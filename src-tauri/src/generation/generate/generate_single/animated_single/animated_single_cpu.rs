use anyhow::Result;
use std::{collections::HashMap, path::Path};

use crate::effects::core::cpu::resize_cpu::ResizeConfig;
use crate::effects::core::gpu::blend_modes_gpu::GpuBlendContext;
use crate::generation::generate::{
    generate_single::animated_single::spritesheets::{
        frames::extract_and_process_all_frames, handle_spritesheets,
    },
    layers::blend::LayerBlendProperties,
    save_animation::{save::structs::WorkerOptions, spawn_worker::spawn_animation_worker},
};
use crate::types::{AnimationQualityConfig, NFTTrait, RarityConfig, SpritesheetLayout};

fn is_empty_trait(trait_value: &str) -> bool {
    trait_value == "None" || trait_value == "none" || trait_value.is_empty()
}

pub async fn process_animated_collection(
    traits: &[NFTTrait],
    active_layer_order: &[String],
    input_folder: &Path,
    working_folder: Option<&Path>,
    final_width: u32,
    final_height: u32,
    total_frames: u32,
    spritesheet_layout: &SpritesheetLayout,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    export_folder: &Path,
    collection_name: &str,
    image_format: &str,
    fps: u32,
    animation_quality: Option<&AnimationQualityConfig>,
    resize_config: Option<&ResizeConfig>,
    include_spritesheets: bool,
    sprites_path: Option<&Path>,
    index: u32,
) -> Result<()> {
    if total_frames == 0 {
        return Ok(());
    }

    if GpuBlendContext::get_global().is_none() {
        return Err(anyhow::anyhow!(
            "GPU blend context not initialized for animated collection. GPU is required."
        ));
    }

    let mut blend_properties_cache: HashMap<String, LayerBlendProperties> =
        HashMap::with_capacity(active_layer_order.len());

    for layer in active_layer_order {
        let trait_data = traits.iter().find(|t| t.trait_type == *layer);
        if let Some(trait_data) = trait_data {
            if is_empty_trait(&trait_data.value) {
                continue;
            }

            let blend_key = format!("{}_{}", layer, trait_data.value);
            let blend_properties = LayerBlendProperties::from_config(
                layer,
                &trait_data.value,
                rarity_config,
                current_set_id,
            );
            blend_properties_cache.insert(blend_key, blend_properties);
        }
    }

    let (layer_frames, final_complete_spritesheet) = extract_and_process_all_frames(
        active_layer_order,
        traits,
        input_folder,
        working_folder,
        spritesheet_layout,
        &blend_properties_cache,
    )?;

    let composed_frames = layer_frames.values().next().unwrap().clone();

    if composed_frames.len() != total_frames as usize {
        return Err(anyhow::anyhow!(
            "Incorrect number of frames generated: expected {}, got {}",
            total_frames,
            composed_frames.len()
        ));
    }

    let output_path = export_folder
        .join("collection")
        .join("images")
        .join(format!(
            "{}_{}.{}",
            collection_name,
            index + 1,
            image_format
        ));
    let delay = (1000.0 / fps as f32) as u32;

    if include_spritesheets {
        if let Some(sprites_path) = sprites_path {
            let spritesheet_paths = handle_spritesheets(
                &final_complete_spritesheet,
                sprites_path,
                collection_name,
                index,
            )?;
            for path in spritesheet_paths {
                println!("Final composed spritesheet generated: {}", path);
            }
        }
    }

    let options = WorkerOptions {
        frames: composed_frames,
        output_path: output_path.to_string_lossy().to_string(),
        width: final_width,
        height: final_height,
        delay,
        optimize: animation_quality.as_ref().map_or(true, |q| q.optimize),
        format: Some(image_format.to_string()),
        quality_config: animation_quality.cloned(),
        resize_config: resize_config.cloned(),
    };

    spawn_animation_worker(options).await?;

    Ok(())
}
