use anyhow::Result;
use dashmap::DashMap;
use rayon::prelude::*;
use std::time::Duration;
use std::{env, fs, path::PathBuf, sync::Arc};
use tokio_util::sync::CancellationToken;
use walkdir::WalkDir;

use crate::effects::core::cpu::resize_cpu::ResizeConfig;
use crate::types::NFTGenerationArgs;

use crate::types::{
    AnimationQualityConfig, ForcedCombinations, ForcedCombinationsBySets, GenerationResult,
    Incompatibilities, IncompatibilitiesBySets, NFTTrait, OrderedLayersSets, RarityConfig,
    SolanaMetadataConfig, SpritesheetLayout,
};

use crate::generation::{
    clean_up_contexts::cleanup_all_global_contexts,
    generate::{
        generate_single::generate_single_artwork::generate_single_artwork,
        layers::traits_selection::precompute_incompatibilities,
        metadata::{create_global::create_global_metadata, create_single::Blockchain},
        pausecancel::{check_cancelled, set_export_folder_path, wait_for_pause},
        rarity::{calculate_image_rarity, create_rarity_files},
        shuffle::shuffle_and_rename,
        task_manager::{
            create_generation_session, get_semaphore_info, get_system_info, spawn_generation_task,
            MetricsUtils, PerformanceMetrics,
        },
    },
    generation_main::GenerationPaths,
};

use tauri::Window;

use std::collections::{HashMap, HashSet};

fn precompute_rarity_cache(rarity_config: &RarityConfig) -> HashMap<String, HashMap<String, bool>> {
    let mut cache = HashMap::new();

    for (layer_name, layer_config) in &rarity_config.layers {
        let mut layer_cache = HashMap::new();

        for (set_id, layer_set_config) in &layer_config.sets {
            if layer_set_config.active {
                layer_cache.insert(set_id.clone(), true);
            }
        }

        cache.insert(layer_name.clone(), layer_cache);
    }

    cache
}

#[derive(Clone, Debug)]
pub struct GlobalGenerationCaches {
    pub incompatibility_maps: Arc<HashMap<String, HashMap<String, HashSet<String>>>>,
    pub forced_combinations_maps: Arc<HashMap<String, ForcedCombinations>>,
    pub rarity_probability_cache: Arc<HashMap<String, HashMap<String, bool>>>,
    pub uniqueness_cache: Arc<DashMap<String, bool>>,
    pub file_lookup_cache: Arc<DashMap<String, std::collections::HashSet<String>>>,
}

impl Drop for GlobalGenerationCaches {
    fn drop(&mut self) {
        self.uniqueness_cache.clear();
        self.file_lookup_cache.clear();
        self.incompatibility_maps = Arc::new(HashMap::new());
        self.forced_combinations_maps = Arc::new(HashMap::new());
        self.rarity_probability_cache = Arc::new(HashMap::new());
    }
}

#[derive(Clone)]
pub struct WorkerParamsArc {
    pub global_index: u32,
    pub rarity_config: Arc<RarityConfig>,
    pub incompatibility_map: Arc<HashMap<String, HashSet<String>>>,
    pub set_forced_combinations: Arc<ForcedCombinations>,
    pub active_layer_order: Arc<Vec<String>>,
    pub input_folder: Arc<PathBuf>,
    pub export_folder: Arc<PathBuf>,
    pub working_folder: Option<Arc<PathBuf>>,
    pub sprites_path: Option<Arc<PathBuf>>,
    pub collection_name: Arc<String>,
    pub collection_description: Arc<String>,
    pub image_format: Arc<String>,
    pub set_id: Arc<String>,
    pub solana_config: Option<Arc<SolanaMetadataConfig>>,
    pub animation_quality: Option<Arc<AnimationQualityConfig>>,
    pub resize_config: Option<Arc<ResizeConfig>>,
    pub spritesheet_layout: Option<Arc<SpritesheetLayout>>,
    pub include_rarity: bool,
    pub final_width: u32,
    pub final_height: u32,
    pub allow_duplicates: bool,
    pub total_to_generate: u32,
    pub blockchain: Blockchain,
    pub is_animated_collection: bool,
    pub include_spritesheets: bool,
    pub fps: u32,
    pub total_frames_count: u32,
    pub window: Window,
    pub global_caches: GlobalGenerationCaches,
    pub base_width: u32,
    pub base_height: u32,
}

pub async fn generate_nfts(
    args: &NFTGenerationArgs,
    paths: &GenerationPaths,
    ordered_layers_sets: &OrderedLayersSets,
    rarity_config: &RarityConfig,
    incompatibilities_by_sets: &IncompatibilitiesBySets,
    forced_combinations_by_sets: &ForcedCombinationsBySets,
    blockchain: &Blockchain,
    window: &tauri::Window,
) -> Result<(bool, String)> {
    println!("🚀 [DEBUG] Starting generate_nfts");

    let start_time = std::time::Instant::now();

    let temp_frames_dir = env::temp_dir().join("blendgine");
    if temp_frames_dir.exists() {
        for entry in WalkDir::new(&temp_frames_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_dir())
        {
            if let Err(e) = fs::remove_dir_all(entry.path()) {
                println!("⚠️ Error while deleting {}: {}", entry.path().display(), e);
            }
        }
    }

    let input_path = PathBuf::from(&args.input_folder);
    let mut working_folder = input_path.clone();
    if args.is_animated_collection {
        let last_folder = input_path
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| anyhow::anyhow!("Invalid input folder name"))?;

        let app_data_dir = if cfg!(windows) {
            dirs::data_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find app data directory"))?
                .join("com.pxlsyllab.blendgine")
        } else if cfg!(target_os = "macos") {
            dirs::home_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?
                .join("Library")
                .join("Application Support")
                .join("com.pxlsyllab.blendgine")
        } else {
            dirs::home_dir()
                .ok_or_else(|| anyhow::anyhow!("Could not find home directory"))?
                .join(".config")
                .join("com.pxlsyllab.blendgine")
        };

        let spritesheets_path = app_data_dir
            .join("animated")
            .join(last_folder)
            .join("spritesheets");

        fs::create_dir_all(&spritesheets_path)?;
        working_folder = spritesheets_path;
    }

    let mut all_generated_nfts: Vec<GenerationResult> = Vec::new();
    let mut all_traits: Vec<Vec<NFTTrait>> = Vec::new();
    let mut global_index: u32 = 0;
    let mut total_to_generate: u32 = 0;

    for (set_id, set_config) in ordered_layers_sets {
        if set_config.nft_count == 0 {
            return Err(anyhow::anyhow!(
                "Invalid NFT count in set \"{}\": {}",
                set_id,
                set_config.nft_count
            ));
        }
        if set_config.layers.is_empty() {
            return Err(anyhow::anyhow!("No layers defined for set \"{}\"", set_id));
        }
        total_to_generate += set_config.nft_count;
    }

    if let Err(_) = check_cancelled().await {
        return Ok((false, "Generation cancelled by user".to_string()));
    }

    set_export_folder_path(paths.export.to_path_buf());

    println!("{}", get_system_info());

    let default_incompatibilities = Incompatibilities::default();
    let default_forced_combinations = ForcedCombinations::default();

    let incompatibility_maps: HashMap<String, HashMap<String, HashSet<String>>> =
        ordered_layers_sets
            .par_iter()
            .map(|(set_id, _set_config)| {
                let incompatibilities = incompatibilities_by_sets
                    .sets
                    .get(set_id)
                    .unwrap_or(&default_incompatibilities);
                let map = precompute_incompatibilities(incompatibilities);
                println!(
                    "   🔗 Set '{}': {} incompatibility rules",
                    set_id,
                    map.len()
                );
                (set_id.clone(), map)
            })
            .collect();

    let forced_combinations_maps: HashMap<String, &ForcedCombinations> = ordered_layers_sets
        .iter()
        .map(|(set_id, _set_config)| {
            let forced = forced_combinations_by_sets
                .sets
                .get(set_id)
                .unwrap_or(&default_forced_combinations);
            println!(
                "   🔗 Set '{}': {} forced combination rules",
                set_id,
                forced.forced_combinations.len()
            );
            (set_id.clone(), forced)
        })
        .collect();

    let global_caches = GlobalGenerationCaches {
        incompatibility_maps: Arc::new(incompatibility_maps.clone()),
        forced_combinations_maps: Arc::new(
            forced_combinations_maps
                .iter()
                .map(|(k, v)| (k.clone(), (*v).clone()))
                .collect(),
        ),
        rarity_probability_cache: Arc::new(precompute_rarity_cache(&rarity_config)),
        uniqueness_cache: Arc::new(DashMap::new()),
        file_lookup_cache: Arc::new(DashMap::new()),
    };

    for (set_id, set_config) in ordered_layers_sets {
        wait_for_pause().await?;
        check_cancelled().await?;

        let active_layer_order: Vec<_> = set_config
            .layers
            .iter()
            .filter(|layer| {
                rarity_config
                    .layers
                    .get(*layer)
                    .and_then(|layer_config| layer_config.sets.get::<str>(set_id))
                    .map(|set_config| set_config.active)
                    .unwrap_or(false)
            })
            .cloned()
            .collect();

        let mut set_completed = 0;

        let nft_count = set_config.nft_count as usize;

        tracing::info!(
            "🎯 [TOKIO_NATIVE] Set '{}': {} NFT tasks - Tokio optimizes automatically",
            set_id,
            nft_count
        );

        let worker_params_arc = WorkerParamsArc {
            global_index,
            rarity_config: Arc::new(rarity_config.clone()),
            incompatibility_map: Arc::new(
                global_caches
                    .incompatibility_maps
                    .get(set_id)
                    .unwrap()
                    .clone(),
            ),
            set_forced_combinations: Arc::new(
                global_caches
                    .forced_combinations_maps
                    .get(set_id)
                    .unwrap()
                    .clone(),
            ),
            active_layer_order: Arc::new(active_layer_order),
            input_folder: Arc::new(input_path.clone()),
            export_folder: Arc::new(paths.export.to_path_buf()),
            working_folder: Some(Arc::new(working_folder.clone())),
            sprites_path: paths.sprites.as_ref().map(|p| Arc::new(p.to_path_buf())),
            collection_name: Arc::new(args.collection_name.clone()),
            collection_description: Arc::new(args.collection_description.clone()),
            image_format: Arc::new(args.image_format.clone()),
            set_id: Arc::new(set_id.to_string()),
            solana_config: args.solana_config.as_ref().map(|c| Arc::new(c.clone())),
            animation_quality: args.animation_quality.as_ref().map(|c| Arc::new(c.clone())),
            resize_config: args.resize_config.as_ref().map(|c| Arc::new(c.clone())),
            spritesheet_layout: args
                .spritesheet_layout
                .as_ref()
                .map(|c| Arc::new(c.clone())),
            include_rarity: args.include_rarity,
            final_width: args.final_width,
            final_height: args.final_height,
            allow_duplicates: args.allow_duplicates,
            total_to_generate,
            blockchain: blockchain.clone(),
            is_animated_collection: args.is_animated_collection,
            include_spritesheets: args.include_spritesheets,
            fps: args.fps.unwrap_or(24),
            total_frames_count: args
                .total_frames_count
                .expect("total_frames_count should be Some for animated collections"),
            window: window.clone(),
            global_caches: global_caches.clone(),
            base_width: args.base_width,
            base_height: args.base_height,
        };

        let session_token = create_generation_session().await;
        let pool_results = generate_nfts_with_tokio_native(
            worker_params_arc.clone(),
            set_config.nft_count as usize,
            session_token,
        )
        .await?;
        let pool_metrics = PerformanceMetrics::new_generation(
            nft_count as u32,
            start_time.elapsed(),
            0,
            0.0,
            0.0,
            Duration::from_secs(0),
            0,
            set_config.nft_count as u32,
        );

        wait_for_pause().await?;
        check_cancelled().await?;

        for nft in &pool_results {
            all_generated_nfts.push(nft.clone());
            set_completed += 1;
        }

        global_index += set_completed;

        let metrics = PerformanceMetrics::new_generation(
            nft_count as u32,
            pool_metrics.execution_time,
            pool_metrics.memory_usage,
            pool_metrics.cpu_usage,
            pool_metrics.throughput,
            Duration::from_millis(0),
            0,
            set_completed as u32,
        );

        MetricsUtils::display_metrics(&metrics);

        all_traits.extend(pool_results.iter().map(|nft| nft.traits.clone()));

        println!("🌍 [DEBUG] Global index updated: {}", global_index);
    }

    if args.shuffle_sets {
        shuffle_and_rename(
            &paths.export,
            &args.collection_name,
            &args.image_format,
            &mut all_generated_nfts,
            args.include_spritesheets,
        )?;
    }

    create_global_metadata(
        &paths.metadata,
        &args.collection_name,
        &args.collection_description,
    )?;

    if args.include_rarity {
        let collection_info_path = paths.collection.join("collection infos");
        fs::create_dir_all(&collection_info_path)?;

        create_rarity_files(
            &paths.metadata,
            &collection_info_path.to_string_lossy(),
            global_index as usize,
            &rarity_config,
        )?;

        calculate_image_rarity(
            &paths.metadata,
            &collection_info_path.to_string_lossy(),
            global_index as usize,
        )?;
    }

    if global_index != total_to_generate {
        println!(
            "❌ [DEBUG] Generation mismatch: Generated {} NFTs but expected {}",
            global_index, total_to_generate
        );
        return Err(anyhow::anyhow!(
            "Generation mismatch: Generated {} NFTs but expected {}",
            global_index,
            total_to_generate
        ));
    }

    println!("🎉 [WORKER CALC] Résumé final de la génération");
    println!("{}", get_system_info());
    println!("🎯 [WORKER CALC] {} NFTs générés avec succès", global_index);

    println!(
        "🎉 [DEBUG] Generation completed successfully! {} NFTs generated",
        global_index
    );

    let total_generation_time = start_time.elapsed();
    let (final_cpu, final_memory) = MetricsUtils::measure_system_performance();

    let generation_metrics = MetricsUtils::create_generation_metrics(
        global_index,
        total_generation_time,
        0,
        final_memory,
        0.0,
        final_cpu,
        0,
        global_index,
    );

    MetricsUtils::display_metrics(&generation_metrics);

    MetricsUtils::display_generation_metrics(
        global_index,
        total_generation_time,
        final_memory,
        final_cpu,
        MetricsUtils::calculate_throughput(global_index, total_generation_time),
        global_index,
    );

    cleanup_all_global_contexts().await;

    Ok((true, "Generation succesful!".to_string()))
}

async fn generate_nfts_with_tokio_native(
    params: WorkerParamsArc,
    nft_count: usize,
    session_token: CancellationToken,
) -> Result<Vec<GenerationResult>> {
    let _cancel_token = session_token;
    let mut tasks = Vec::new();

    tracing::info!(
        "🚀 [TOKIO_NATIVE] Starting {} NFT generation tasks",
        nft_count
    );

    tracing::info!("{}", get_semaphore_info());

    let num_cpus = num_cpus::get();
    tracing::info!(
        "🎯 [PARALLELISM] {} NFTs with max {} concurrent workers",
        nft_count,
        num_cpus
    );

    for index in 0..nft_count {
        let params_clone = params.clone();
        let task_id = format!("generation_{}", index);

        let task_handle = spawn_generation_task(task_id, move || async move {
            let mut params_mut = params_clone.clone();
            params_mut.global_index = index as u32;

            generate_single_artwork(
                params_mut.global_index,
                &**params_mut.input_folder,
                &**params_mut.export_folder,
                &**params_mut.collection_name,
                &**params_mut.collection_description,
                params_mut.include_rarity,
                &params_mut.rarity_config,
                &params_mut.active_layer_order,
                params_mut.base_width,
                params_mut.base_height,
                params_mut.final_width,
                params_mut.final_height,
                &**params_mut.image_format,
                &params_mut.incompatibility_map,
                &params_mut.set_forced_combinations,
                params_mut.allow_duplicates,
                &params_mut.set_id,
                params_mut.total_to_generate,
                params_mut.blockchain,
                params_mut.is_animated_collection,
                params_mut.include_spritesheets,
                params_mut.sprites_path.as_ref().map(|p| &***p),
                params_mut.fps,
                params_mut.solana_config.as_deref(),
                params_mut.animation_quality.as_deref(),
                params_mut.resize_config.as_deref(),
                Some(params_mut.total_frames_count),
                params_mut.spritesheet_layout.as_deref(),
                params_mut.working_folder.as_ref().map(|p| &***p),
                &params_mut.window,
                &params_mut.global_caches,
            )
            .await
        })
        .await?;

        tasks.push(task_handle);
    }

    tracing::info!(
        "⏳ [TOKIO_NATIVE] Waiting for all {} tasks to complete",
        tasks.len()
    );

    let task_results = futures::future::join_all(tasks).await;

    let mut successful_results = Vec::new();
    let mut error_count = 0;

    for task_result in task_results {
        match task_result {
            Ok(generation_result) => match generation_result {
                Ok(Some(nft_result)) => successful_results.push(nft_result),
                Ok(None) => {
                    tracing::debug!("🔄 [TOKIO_NATIVE] NFT skipped (duplicate or filtered)");
                }
                Err(e) => {
                    error_count += 1;
                    tracing::error!("❌ [TOKIO_NATIVE] Generation error: {}", e);
                }
            },
            Err(e) => {
                error_count += 1;
                tracing::error!("❌ [TOKIO_NATIVE] Task join error: {}", e);
            }
        }
    }

    if error_count > 0 {
        tracing::warn!(
            "⚠️ [TOKIO_NATIVE] {} tasks failed, {} succeeded",
            error_count,
            successful_results.len()
        );
    } else {
        tracing::info!(
            "✅ [TOKIO_NATIVE] All {} tasks completed successfully",
            successful_results.len()
        );
    }

    let results = successful_results;

    Ok(results)
}
