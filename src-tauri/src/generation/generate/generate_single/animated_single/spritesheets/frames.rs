use anyhow::Result;
use image::DynamicImage;
use std::{collections::HashMap, path::Path};

use crate::generation::generate::{
    cache::get_trait_spritesheets_cached,
    generate_single::animated_single::spritesheets::spritesheet_blender::blend_spritesheets_with_individual_properties,
    layers::blend::LayerBlendProperties,
};
use crate::types::{NFTTrait, SpritesheetLayout};

pub fn extract_and_process_all_frames(
    active_layer_order: &[String],
    traits: &[NFTTrait],
    input_folder: &Path,
    working_folder: Option<&Path>,
    spritesheet_layout: &SpritesheetLayout,
    blend_properties_cache: &std::collections::HashMap<String, LayerBlendProperties>,
) -> Result<(HashMap<String, Vec<DynamicImage>>, DynamicImage)> {
    let mut layer_frames: HashMap<String, Vec<DynamicImage>> = HashMap::new();
    let mut all_spritesheet_paths = Vec::new();

    for layer in active_layer_order {
        let trait_data = traits.iter().find(|t| t.trait_type == *layer);
        if let Some(trait_data) = trait_data {
            let trait_folder_name = trait_data
                .value
                .replace(".png", "")
                .replace(".gif", "")
                .replace(".webp", "");

            let spritesheet_paths = if let Some(working_folder) = working_folder {
                get_trait_spritesheets_cached(layer, &trait_folder_name, working_folder)?
            } else {
                let spritesheet_path = input_folder
                    .join(layer)
                    .join(&trait_folder_name)
                    .join("spritesheet_0.png");

                if spritesheet_path.exists() {
                    vec![spritesheet_path]
                } else {
                    continue;
                }
            };

            all_spritesheet_paths.extend(spritesheet_paths);
        }
    }

    if all_spritesheet_paths.is_empty() {
        return Err(anyhow::anyhow!("No spritesheets found"));
    }

    let mut blend_properties_list = Vec::new();
    for layer in active_layer_order {
        let trait_data = traits.iter().find(|t| t.trait_type == *layer);
        if let Some(trait_data) = trait_data {
            let blend_key = format!("{}_{}", layer, trait_data.value);
            if let Some(blend_properties) = blend_properties_cache.get(&blend_key) {
                blend_properties_list.push(blend_properties.clone());
            }
        }
    }

    if blend_properties_list.len() != all_spritesheet_paths.len() {
        return Err(anyhow::anyhow!(
            "Mismatch: {} spritesheets but {} blend properties",
            all_spritesheet_paths.len(),
            blend_properties_list.len()
        ));
    }

    let (final_complete_spritesheet, all_frames) = blend_spritesheets_with_individual_properties(
        &all_spritesheet_paths,
        &blend_properties_list,
        spritesheet_layout,
    )?;

    for layer in active_layer_order {
        layer_frames.insert(layer.to_string(), all_frames.clone());
    }

    Ok((layer_frames, final_complete_spritesheet))
}
