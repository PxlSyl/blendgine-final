use anyhow::Result;
use std::path::Path;

use crate::generation::generate::{
    generate_single::progress::send_generation_progress,
    metadata::create_single::{generate_metadata, Blockchain},
};
use crate::types::{GenerationResult, NFTTrait, RarityConfig, SolanaMetadataConfig};

pub fn save_metadata_file(
    traits: &[NFTTrait],
    dna: &str,
    collection_name: &str,
    collection_description: &str,
    blockchain: Blockchain,
    solana_config: Option<&SolanaMetadataConfig>,
    image_format: &str,
    index: u32,
    total_to_generate: u32,
    include_rarity: bool,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    export_folder: &Path,
    window: &tauri::Window,
) -> Result<GenerationResult> {
    let metadata = generate_metadata(
        traits,
        collection_name,
        collection_description,
        dna,
        blockchain,
        solana_config,
        image_format,
        index,
        include_rarity,
        rarity_config,
        current_set_id,
    )?;

    let metadata_path = export_folder.join("collection").join("metadata");
    std::fs::create_dir_all(&metadata_path)?;

    let metadata_filename = format!("{}_{}.json", collection_name, index + 1);
    let metadata_filepath = metadata_path.join(&metadata_filename);

    std::fs::write(&metadata_filepath, serde_json::to_string_pretty(&metadata)?)?;

    if let Err(e) = send_generation_progress(
        traits,
        collection_name,
        image_format,
        index,
        total_to_generate,
        export_folder,
        window,
    ) {
        eprintln!("⚠️ [PROGRESS] Failed to send progress: {}", e);
    }

    Ok(GenerationResult {
        traits: traits.to_vec(),
        original_index: index + 1,
    })
}
