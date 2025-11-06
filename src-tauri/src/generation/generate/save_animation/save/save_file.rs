use crate::generation::generate::task_manager::spawn_save_task;
use anyhow::{Context, Result};
use image::DynamicImage;
use std::path::Path;
use tokio::fs::create_dir_all;

use crate::generation::generate::save_animation::save::{
    save_gif::save_gif_animation, save_mp4::save_mp4_animation, save_webm::save_webm_animation,
    save_webp::save_webp_animation, structs::WorkerOptions,
};

pub async fn save_animation(frames: &[DynamicImage], options: &WorkerOptions) -> Result<()> {
    let format = options.format.clone().unwrap_or_else(|| "webp".to_string());
    let output_path = Path::new(&options.output_path);

    if let Some(parent) = output_path.parent() {
        create_dir_all(parent)
            .await
            .context("Failed to create output directory")?;
    }

    let frames_clone = frames.to_vec();
    let options_clone = options.clone();
    let output_path_clone = output_path.to_path_buf();
    let format_clone = format.clone();
    let task_id = format!(
        "save_anim_{}",
        output_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
    );
    let handle = spawn_save_task(task_id.clone(), move || {
        let save_result = match format_clone.as_str() {
            "gif" => save_gif_animation(&frames_clone, &output_path_clone, &options_clone),
            "webp" => save_webp_animation(&frames_clone, &output_path_clone, &options_clone),
            "mp4" => save_mp4_animation(&frames_clone, &output_path_clone, &options_clone),
            "webm" => save_webm_animation(&frames_clone, &output_path_clone, &options_clone),
            _ => Err(anyhow::anyhow!("Unsupported format: {}", format_clone)),
        };

        match save_result {
            Ok(_) => {
                tracing::info!(
                    "✅ [SAVE] Animation saved successfully to {}",
                    output_path_clone.display()
                );
                Ok(())
            }
            Err(e) => {
                tracing::error!("❌ [SAVE] Failed to save animation: {}", e);
                Err(anyhow::anyhow!("Failed to save animation: {}", e))
            }
        }
    })
    .await
    .map_err(|e| anyhow::anyhow!("Failed to spawn save task: {}", e))?;

    handle
        .await
        .map_err(|e| anyhow::anyhow!("Save task join error: {}", e))??;

    Ok(())
}
