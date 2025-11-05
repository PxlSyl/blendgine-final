use crate::{
    layerpreview::{
        animations::{
            commands::get_spritesheet_metadata,
            utils::{reset_animation_state, set_total_traits_to_process},
            GLOBAL_MAX_FRAMES,
        },
        select::select_import::{
            check_animated::check_animated_images, utils::extract_frames::extract_animation_frames,
            utils::structs::LayerContent,
        },
    },
    types::SpritesheetLayout,
};

use anyhow::Result;
use std::{path::PathBuf, sync::atomic::Ordering};
use tracing;

pub async fn process_animated_layers(
    folder_path: &str,
    layers: &[LayerContent],
    app_handle: &tauri::AppHandle,
) -> Result<(bool, Option<u32>, Option<SpritesheetLayout>), String> {
    tracing::info!(
        "Processing animated layers for {} layers in folder: {}",
        layers.len(),
        folder_path
    );

    let mut is_animated_collection = false;
    let mut frame_count = None;
    let mut spritesheet_layout = None;

    reset_animation_state().await;

    let animated_layers_count = layers
        .iter()
        .filter(|layer| {
            let layer_path = PathBuf::from(folder_path).join(&layer.name);
            futures::executor::block_on(check_animated_images(
                layer_path.to_string_lossy().to_string(),
            ))
            .unwrap_or(false)
        })
        .count();

    tracing::info!(
        "Found {} animated layers out of {} total layers",
        animated_layers_count,
        layers.len()
    );

    if animated_layers_count > 0 {
        tracing::info!(
            "Processing animated collection with {} animated layers",
            animated_layers_count
        );

        set_total_traits_to_process(animated_layers_count as u32).await;
        is_animated_collection = true;

        let path_buf = PathBuf::from(folder_path);
        let project_id = path_buf
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| {
                let msg = "Failed to get folder name".to_string();
                tracing::error!("{}", msg);
                msg
            })?;

        let total_files = count_total_animated_files(folder_path, layers);
        tracing::info!("Total animated files to process: {}", total_files);

        tracing::info!("Starting frame extraction for {} files", total_files);
        extract_animation_frames(folder_path, layers, app_handle, project_id, total_files).await?;

        let raw_count = GLOBAL_MAX_FRAMES.load(Ordering::SeqCst);
        frame_count = Some(raw_count);
        tracing::info!("Frame extraction completed, max frames: {}", raw_count);

        if let Ok(metadata) = get_spritesheet_metadata().await {
            tracing::info!(
                "Retrieved spritesheet metadata: {}x{} frames, {} sheets",
                metadata.cols,
                metadata.rows,
                metadata.total_sheets
            );

            spritesheet_layout = Some(SpritesheetLayout {
                rows: metadata.rows,
                cols: metadata.cols,
                frame_width: metadata.frame_width,
                frame_height: metadata.frame_height,
                total_sheets: metadata.total_sheets,
                frames_per_sheet: metadata.frames_per_sheet,
                total_frames: metadata.total_frames,
            });
        } else {
            tracing::warn!("Failed to retrieve spritesheet metadata");
        }
    }

    tracing::info!(
        "Processed animated layers: animated={}, frame_count={:?}, has_layout={}",
        is_animated_collection,
        frame_count,
        spritesheet_layout.is_some()
    );

    Ok((is_animated_collection, frame_count, spritesheet_layout))
}

fn count_total_animated_files(folder_path: &str, layers: &[LayerContent]) -> u32 {
    use std::fs::read_dir;

    let mut total_files = 0;
    tracing::debug!("Counting animated files in {} layers", layers.len());

    for layer in layers {
        let layer_path = PathBuf::from(folder_path).join(&layer.name);
        if layer_path.exists() {
            let mut layer_file_count = 0;
            if let Ok(entries) = read_dir(&layer_path) {
                for entry in entries.flatten() {
                    if let Some(ext) = entry.path().extension() {
                        let ext_lower = ext.to_string_lossy().to_lowercase();
                        if ext_lower == "gif" || ext_lower == "webp" || ext_lower == "png" {
                            total_files += 1;
                            layer_file_count += 1;
                        }
                    }
                }
            }
            if layer_file_count > 0 {
                tracing::debug!("Layer {}: {} animated files", layer.name, layer_file_count);
            }
        }
    }

    tracing::debug!("Total animated files found: {}", total_files);
    total_files
}
