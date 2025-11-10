use std::{
    collections::{HashMap, HashSet},
    path::Path,
};

use anyhow::Result;

use crate::{
    effects::core::gpu::resize_gpu::ResizeConfig,
    generation::generate::{
        generate::GlobalGenerationCaches,
        generate_single::{
            animated_single::animated_single_cpu::process_animated_collection,
            generate_traits::generate_traits_and_validate, save_metadata::save_metadata_file,
            static_single::process_static_single,
        },
        metadata::create_single::Blockchain,
        pausecancel::{check_cancelled, wait_for_pause},
    },
    types::{
        AnimationQualityConfig, ForcedCombinations, GenerationResult, RarityConfig,
        SolanaMetadataConfig, SpritesheetLayout,
    },
};

pub async fn generate_single_artwork(
    index: u32,
    input_folder: &Path,
    export_folder: &Path,
    collection_name: &str,
    collection_description: &str,
    include_rarity: bool,
    rarity_config: &RarityConfig,
    active_layer_order: &[String],
    base_width: u32,
    base_height: u32,
    final_width: u32,
    final_height: u32,
    image_format: &str,
    incompatibility_map: &HashMap<String, HashSet<String>>,
    forced_combinations: &ForcedCombinations,
    allow_duplicates: bool,
    current_set_id: &str,
    total_to_generate: u32,
    blockchain: Blockchain,
    is_animated_collection: bool,
    include_spritesheets: bool,
    sprites_path: Option<&Path>,
    fps: u32,
    solana_config: Option<&SolanaMetadataConfig>,
    animation_quality: Option<&AnimationQualityConfig>,
    resize_config: Option<&ResizeConfig>,
    total_frames_count: Option<u32>,
    spritesheet_layout: Option<&SpritesheetLayout>,
    working_folder: Option<&Path>,
    window: &tauri::Window,
    global_caches: &GlobalGenerationCaches,
) -> Result<Option<GenerationResult>> {
    wait_for_pause().await?;
    check_cancelled().await?;

    let (traits, dna) = generate_traits_and_validate(
        input_folder,
        active_layer_order,
        rarity_config,
        incompatibility_map,
        forced_combinations,
        allow_duplicates,
        current_set_id,
        is_animated_collection,
        working_folder,
        global_caches,
    )?;

    wait_for_pause().await?;
    check_cancelled().await?;

    if is_animated_collection {
        let total_frames = total_frames_count.unwrap_or(0);

        if total_frames == 0 {
            return Ok(None);
        }

        process_animated_collection(
            &traits,
            active_layer_order,
            input_folder,
            working_folder,
            final_width,
            final_height,
            total_frames,
            spritesheet_layout.as_ref().unwrap(),
            rarity_config,
            current_set_id,
            export_folder,
            collection_name,
            image_format,
            fps,
            animation_quality,
            resize_config,
            include_spritesheets,
            sprites_path,
            index,
        )
        .await?;
    } else {
        let images_path = export_folder.join("collection").join("images");
        process_static_single(
            &traits,
            active_layer_order,
            input_folder,
            base_width,
            base_height,
            final_width,
            final_height,
            rarity_config,
            current_set_id,
            images_path,
            collection_name,
            image_format,
            index,
            resize_config,
        )
        .await?;
    }

    let nft_result = GenerationResult {
        traits: traits.to_vec(),
        original_index: index + 1,
    };

    if let Err(e) = save_metadata_file(
        &traits,
        &dna,
        collection_name,
        collection_description,
        blockchain,
        solana_config,
        image_format,
        index,
        total_to_generate,
        include_rarity,
        rarity_config,
        current_set_id,
        export_folder,
        window,
    ) {
        eprintln!("⚠️ [METADATA] Failed to save metadata: {}", e);
    }

    Ok(Some(nft_result))
}
