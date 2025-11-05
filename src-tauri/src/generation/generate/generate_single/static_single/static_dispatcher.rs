use std::path::{Path, PathBuf};

use anyhow::Result;

use crate::effects::core::cpu::resize_cpu::ResizeConfig;
use crate::generation::generate::pausecancel::{check_cancelled, wait_for_pause};
use crate::renderer::get_current_renderer_preference;
use crate::types::{NFTTrait, RarityConfig};

use super::{static_cpu::cleanup_cpu_caches_internal, static_gpu::reset_shared_gpu_pipeline};
use super::{static_cpu::process_static_single_cpu, static_gpu::process_static_single_gpu};

pub fn cleanup_static_caches_final_by_preference() {
    let user_preference = get_current_renderer_preference();

    if user_preference == "cpu" {
        cleanup_cpu_caches_internal();
    } else {
        if let Err(e) = reset_shared_gpu_pipeline() {
            eprintln!("⚠️ [DISPATCHER] Error while resetting GPU: {}", e);
        }
    }
}

pub async fn process_static_single(
    traits: &[NFTTrait],
    active_layer_order: &[String],
    input_folder: &Path,
    base_width: u32,
    base_height: u32,
    final_width: u32,
    final_height: u32,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    images_path: PathBuf,
    collection_name: &str,
    image_format: &str,
    index: u32,
    resize_config: Option<&ResizeConfig>,
) -> Result<()> {
    check_cancelled().await?;
    wait_for_pause().await?;

    let user_preference = get_current_renderer_preference();

    if user_preference == "cpu" {
        process_static_single_cpu(
            traits,
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
            resize_config.cloned(),
        )
        .await
    } else {
        match process_static_single_gpu(
            traits,
            active_layer_order,
            input_folder,
            base_width,
            base_height,
            final_width,
            final_height,
            rarity_config,
            current_set_id,
            images_path.clone(),
            collection_name,
            image_format,
            index,
            resize_config,
        )
        .await
        {
            Ok(result) => Ok(result),
            Err(_) => {
                process_static_single_cpu(
                    traits,
                    active_layer_order,
                    input_folder,
                    base_width,
                    base_height,
                    final_width,
                    final_height,
                    rarity_config,
                    current_set_id,
                    images_path.clone(),
                    collection_name,
                    image_format,
                    index,
                    resize_config.cloned(),
                )
                .await
            }
        }
    }
}
