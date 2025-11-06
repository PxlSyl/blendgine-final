use crate::layerpreview::{
    animations::commands::extract_frames,
    select::select_import::{check_animated::check_animated_images, utils::structs::LayerContent},
};
use anyhow::Result;
use futures::future::join_all;
use std::{fs::read_dir, path::PathBuf};
use tracing;

const SUPPORTED_IMAGE_EXTENSIONS: &[&str] =
    &["gif", "webp", "png", "mp4", "webm", "mov", "avi", "mkv"];

pub async fn extract_animation_frames(
    folder_path: &str,
    layers: &[LayerContent],
    app_handle: &tauri::AppHandle,
    project_id: &str,
    total_files: u32,
) -> Result<(), String> {
    tracing::info!(
        "Starting animation frame extraction for {} layers, {} total files",
        layers.len(),
        total_files
    );

    let mut futures = Vec::new();

    for layer in layers {
        let layer_path = PathBuf::from(folder_path).join(&layer.name);
        tracing::debug!(
            "Processing layer: {} at path: {}",
            layer.name,
            layer_path.display()
        );

        if !check_animated_images(layer_path.to_string_lossy().to_string()).await? {
            tracing::debug!("Layer {} is not animated, skipping", layer.name);
            continue;
        }

        if let Ok(entries) = read_dir(&layer_path) {
            for entry in entries.flatten() {
                if let Some(ext) = entry.path().extension() {
                    let ext = ext.to_string_lossy().to_lowercase();
                    if SUPPORTED_IMAGE_EXTENSIONS.contains(&ext.as_str()) {
                        if let Some(name) = entry.path().file_stem() {
                            let image_name = name.to_string_lossy().to_string();
                            tracing::debug!(
                                "Found animated image: {} ({}) in layer {}",
                                image_name,
                                ext,
                                layer.name
                            );

                            let app_handle_clone = app_handle.clone();
                            let path_string = entry.path().to_string_lossy().to_string();

                            futures.push(extract_frames(
                                app_handle_clone,
                                project_id.to_string(),
                                path_string,
                                layer.name.clone(),
                                image_name,
                                0,
                                true,
                                total_files,
                            ));
                        }
                    }
                }
            }
        }
    }

    let results = join_all(futures).await;

    for (i, result) in results.iter().enumerate() {
        match result {
            Ok(_) => tracing::info!("extract_frames {} succeeded", i),
            Err(e) => tracing::warn!("extract_frames {} failed but continuing: {}", i, e),
        }
    }

    tracing::info!(
        "Animation frame extraction completed for {} layers",
        layers.len()
    );
    Ok(())
}
