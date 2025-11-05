use anyhow::{Context, Result};
use chrono;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    str::FromStr,
};
use tauri::{Manager, Window};
use tokio::fs::create_dir_all;
use tracing;

use crate::{
    filesystem::{
        constants::StorageFiles,
        persist::{
            load_forced_combination_state, load_incompatibility_state, load_layer_order_state,
            load_rarity_config,
        },
    },
    generation::generate::{
        generate::generate_nfts, generate_single::file_watcher::start_file_watcher,
        metadata::create_single::Blockchain, utils::clear_directory,
    },
};

use crate::types::{NFTGenerationArgs, OrderedLayersSet};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NFTProgressInfo {
    pub current_count: u32,
    pub total_count: u32,
    pub estimated_count: u32,
    pub sequence_number: u32,
    pub current_image: ImageInfo,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImageInfo {
    pub path: String,
    pub name: String,
    pub traits: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GenerationResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GenerationCompleteEvent {
    pub success: bool,
    pub total_generated: u32,
    pub export_path: String,
    pub duration_ms: u64,
}

impl FromStr for Blockchain {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "eth" => Ok(Blockchain::Eth),
            "sol" => Ok(Blockchain::Sol),
            _ => Err("Invalid blockchain type".to_string()),
        }
    }
}

#[derive(Debug)]
pub struct GenerationPaths {
    pub export: PathBuf,
    pub collection: PathBuf,
    pub images: PathBuf,
    pub metadata: PathBuf,
    pub sprites: Option<PathBuf>,
}

pub async fn load_state<T, F, Fut>(loader: F, name: &str) -> Result<T>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<T, String>>,
{
    loader()
        .await
        .map_err(|e| anyhow::anyhow!("Error loading {}: {}", name, e))
}

pub async fn create_export_directories(
    export_path: &Path,
    args: &NFTGenerationArgs,
) -> Result<GenerationPaths> {
    let collection_path = export_path.join("collection");
    let images_path = collection_path.join("images");
    let metadata_path = collection_path.join("metadata");

    create_dir_all(&images_path)
        .await
        .context("Failed to create images directory")?;
    create_dir_all(&metadata_path)
        .await
        .context("Failed to create metadata directory")?;

    let sprites_path = if args.is_animated_collection && args.include_spritesheets {
        let sprites_path = collection_path.join("sprites");
        create_dir_all(&sprites_path)
            .await
            .context("Failed to create sprites directory")?;
        Some(sprites_path)
    } else {
        None
    };

    Ok(GenerationPaths {
        export: export_path.to_path_buf(),
        collection: collection_path,
        images: images_path,
        metadata: metadata_path,
        sprites: sprites_path,
    })
}

fn parse_blockchain(blockchain_str: &str) -> Result<Blockchain> {
    blockchain_str
        .parse::<Blockchain>()
        .map_err(|_| anyhow::anyhow!("Invalid blockchain type: {}", blockchain_str))
}

#[tauri::command]
pub async fn start_nft_generation(
    window: Window,
    args: NFTGenerationArgs,
) -> Result<GenerationResponse, String> {
    invoke_generation(window, &args)
        .await
        .map_err(|e| e.to_string())
}

pub async fn invoke_generation(
    window: Window,
    args: &NFTGenerationArgs,
) -> Result<GenerationResponse> {
    let export_path = PathBuf::from(&args.export_folder);

    if export_path == PathBuf::from("/") || export_path == PathBuf::from("C:\\") {
        return Err(anyhow::anyhow!(
            "Cannot clear critical system directory: {}",
            export_path.display()
        ));
    }

    clear_directory(&export_path)?;

    let app_state = window.state::<StorageFiles>();

    let (rarity_config, layer_order, incompatibilities, forced_combinations) = tokio::try_join!(
        load_state(
            || load_rarity_config(app_state.clone()),
            "rarity configuration"
        ),
        load_state(|| load_layer_order_state(app_state.clone()), "layer order"),
        load_state(
            || load_incompatibility_state(app_state.clone()),
            "incompatibilities"
        ),
        load_state(
            || load_forced_combination_state(app_state.clone()),
            "forced combinations"
        ),
    )?;

    let ordered_layers_sets: HashMap<_, _> = layer_order
        .sets
        .iter()
        .map(|(set_id, set_info)| {
            let name = set_info
                .custom_name
                .clone()
                .unwrap_or_else(|| set_id.clone());

            (
                set_id.clone(),
                OrderedLayersSet {
                    id: set_id.clone(),
                    name,
                    layers: set_info.layers.clone(),
                    nft_count: set_info.nft_count,
                    custom_name: set_info.custom_name.clone(),
                    created_at: chrono::Utc::now().to_rfc3339(),
                },
            )
        })
        .collect();

    let blockchain = parse_blockchain(&args.blockchain)?;

    let paths = create_export_directories(&export_path, args).await?;

    tracing::info!(
        "🚀 Starting NFT generation - Collection: {}, Export: {}, Blockchain: {}, Expected NFTs: {}",
        args.collection_name,
        export_path.display(),
        args.blockchain,
        ordered_layers_sets.values().map(|set| set.nft_count).sum::<u32>()
    );

    if let Err(e) = start_file_watcher(paths.images.clone(), window.clone()) {
        tracing::error!("Failed to start grid file watcher: {e:?}");
    }

    let result = generate_nfts(
        args,
        &paths,
        &ordered_layers_sets,
        &rarity_config,
        &incompatibilities,
        &forced_combinations,
        &blockchain,
        &window,
    )
    .await;

    match result {
        Ok((success, message)) => Ok(GenerationResponse {
            success,
            message: Some(message),
            error: None,
        }),

        Err(e) => Ok(GenerationResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}
