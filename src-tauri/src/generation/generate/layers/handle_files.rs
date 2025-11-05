use std::{collections::HashMap, path::Path};

use crate::generation::generate::{
    cache::{get_layer_files_cached, get_spritesheet_paths_cached},
    generate::GlobalGenerationCaches,
    layers::traits_selection::calculate_adjusted_probabilities,
};
use crate::types::{ForcedCombinations, NFTTrait, RarityConfig};
use anyhow::Result;

pub fn handle_layer_files(
    layer: &str,
    layer_path: &Path,
    rarity_config: &RarityConfig,
    forced_combinations: &ForcedCombinations,
    traits: &[NFTTrait],
    current_set_id: &str,
    is_animated_collection: bool,
    working_folder: Option<&Path>,
    global_caches: &GlobalGenerationCaches,
) -> Result<(Vec<String>, HashMap<String, f64>)> {
    let mut layer_files = Vec::new();

    if is_animated_collection {
        let working_folder = working_folder.ok_or_else(|| {
            anyhow::anyhow!("Working folder is required for animated collections")
        })?;
        let spritesheet_paths = get_spritesheet_paths_cached(layer, working_folder)?;

        for spritesheet_path in spritesheet_paths {
            if let Some(dir_name) = spritesheet_path.parent().and_then(|p| p.file_name()) {
                let dir_name = dir_name.to_string_lossy().into_owned();
                layer_files.push(dir_name);
            }
        }

        if layer_files.is_empty() {
            return Err(anyhow::anyhow!(
                "No files found in working folder for animated layer {}",
                layer
            ));
        }
    } else {
        layer_files = get_layer_files_cached(layer, layer_path, false)?;

        if layer_files.is_empty() {
            return Ok((Vec::new(), HashMap::new()));
        }
    }

    let adjusted_probabilities = calculate_adjusted_probabilities(
        layer,
        rarity_config,
        forced_combinations,
        traits,
        current_set_id,
        global_caches,
    );

    Ok((layer_files, adjusted_probabilities))
}
