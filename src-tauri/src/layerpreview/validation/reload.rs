use crate::filesystem::persist::{load_projectsetup_state, save_projectsetup_state};
use crate::layerpreview::animations::commands::extract_frames;
use crate::layerpreview::select::select_import::utils::structs::LayerContent;
use crate::layerpreview::{
    animations::{commands::get_spritesheet_metadata, reset_animation_state, GLOBAL_MAX_FRAMES},
    select::select_import::{
        check_animated::check_animated_images, get_layers_content::get_layers_content,
        select::InitialFolderData,
    },
};
use crate::types::SpritesheetLayout;
use anyhow::Result;
use futures::future::join_all;
use std::fs::read_dir;
use std::{fs, path::PathBuf, sync::atomic::Ordering};
use tauri::Manager;
use tracing;

#[tauri::command]
pub async fn reload_folder_data(
    app_handle: tauri::AppHandle,
    folder_path: String,
    should_recreate_spritesheets: bool,
) -> Result<InitialFolderData, String> {
    tracing::info!(
        "Reloading folder data: {} (recreate spritesheets: {})",
        folder_path,
        should_recreate_spritesheets
    );

    if let Err(e) = fs::metadata(&folder_path) {
        let msg = format!("Cannot access folder: {}", e);
        tracing::error!("{}", msg);
        return Err(msg);
    }

    let layers = get_layers_content(&folder_path).await?;

    let base_dimensions = if let Some(first_layer) = layers.first() {
        if let Some(first_image) = first_layer.images.first() {
            first_image.dimensions.clone()
        } else {
            let msg = "No images found in the first layer".to_string();
            tracing::error!("{}", msg);
            return Err(msg);
        }
    } else {
        let msg = "No layers found".to_string();
        tracing::error!("{}", msg);
        return Err(msg);
    };

    let mut persisted_state = load_projectsetup_state(app_handle.state())
        .await
        .map_err(|e| format!("Failed to load project setup state: {}", e))?
        .unwrap_or_default();

    let mut max_frames = persisted_state.max_frames;
    let mut spritesheet_layout = persisted_state.spritesheet_layout.clone();
    let is_animated_collection = persisted_state.is_animated_collection;

    let mut animated_layers_count = 0;
    if is_animated_collection {
        tracing::info!(
            "Processing animated collection with {} layers",
            layers.len()
        );

        for layer in &layers {
            let layer_path = PathBuf::from(&folder_path).join(&layer.name);
            if check_animated_images(layer_path.to_string_lossy().to_string()).await? {
                animated_layers_count += 1;
            }
        }

        tracing::info!("Found {} animated layers", animated_layers_count);

        let path_buf = PathBuf::from(&folder_path);
        let project_id = path_buf
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| {
                let msg = "Failed to get folder name".to_string();
                tracing::error!("{}", msg);
                msg
            })?
            .to_string();

        if should_recreate_spritesheets {
            tracing::info!("Recreating spritesheets for animated collection");
            reset_animation_state().await;

            let total_animated_files = count_total_animated_files(&folder_path, &layers).await?;

            tracing::info!(
                "Found {} animated files to process across {} layers",
                total_animated_files,
                animated_layers_count
            );

            let mut futures = Vec::new();

            for layer in &layers {
                let layer_path = PathBuf::from(&folder_path).join(&layer.name);
                if check_animated_images(layer_path.to_string_lossy().to_string()).await? {
                    let app_handle_clone = app_handle.clone();
                    let path_string = layer_path.to_string_lossy().to_string();
                    let layer_name = layer.name.clone();

                    let path_buf = PathBuf::from(&path_string);
                    let image_name = path_buf
                        .file_stem()
                        .and_then(|name| name.to_str())
                        .ok_or_else(|| {
                            let msg = "Failed to get image name".to_string();
                            tracing::error!("{}", msg);
                            msg
                        })?;

                    futures.push(extract_frames(
                        app_handle_clone,
                        project_id.to_string(),
                        path_string,
                        layer_name.to_string(),
                        image_name.to_string(),
                        0,
                        true,
                        total_animated_files,
                    ));
                }
            }

            let results = join_all(futures).await;
            for result in results {
                result?;
            }

            let raw_count = GLOBAL_MAX_FRAMES.load(Ordering::SeqCst);
            max_frames = raw_count;

            if let Ok(metadata) = get_spritesheet_metadata().await {
                tracing::info!(
                    "Retrieved spritesheet metadata: {}x{} frames, {} sheets",
                    metadata.cols,
                    metadata.rows,
                    metadata.total_sheets
                );

                let layout = SpritesheetLayout {
                    rows: metadata.rows,
                    cols: metadata.cols,
                    frame_width: metadata.frame_width,
                    frame_height: metadata.frame_height,
                    total_sheets: metadata.total_sheets,
                    frames_per_sheet: metadata.frames_per_sheet,
                    total_frames: metadata.total_frames,
                };
                spritesheet_layout = Some(layout);

                persisted_state.max_frames = max_frames;
                persisted_state.spritesheet_layout = spritesheet_layout.clone();

                save_projectsetup_state(persisted_state, app_handle.state())
                    .await
                    .map_err(|e| {
                        let msg = format!("Failed to save project setup state: {}", e);
                        tracing::error!("{}", msg);
                        msg
                    })?;

                tracing::info!("Project setup state saved successfully");
            } else {
                tracing::warn!("Failed to retrieve spritesheet metadata");
            }
        } else {
            max_frames = persisted_state.max_frames;
            spritesheet_layout = persisted_state.spritesheet_layout.clone();
        }
    }

    tracing::info!(
        "Folder data reload completed: {} layers, animated={}, max_frames={:?}",
        layers.len(),
        is_animated_collection,
        max_frames
    );

    Ok(InitialFolderData {
        folder_path,
        layers,
        base_dimensions,
        is_animated_collection,
        frame_count: Some(max_frames),
        spritesheet_layout,
    })
}

async fn count_total_animated_files(
    folder_path: &str,
    layers: &[LayerContent],
) -> Result<u32, String> {
    let mut total_files = 0;
    tracing::debug!("Counting animated files in {} layers", layers.len());

    for layer in layers {
        let layer_path = PathBuf::from(folder_path).join(&layer.name);
        if layer_path.exists() {
            if let Ok(entries) = read_dir(&layer_path) {
                for entry in entries.flatten() {
                    if let Some(ext) = entry.path().extension() {
                        let ext_lower = ext.to_string_lossy().to_lowercase();
                        if ext_lower == "gif"
                            || ext_lower == "webp"
                            || ext_lower == "png"
                            || ext_lower == "mp4"
                            || ext_lower == "webm"
                            || ext_lower == "mov"
                            || ext_lower == "avi"
                            || ext_lower == "mkv"
                        {
                            total_files += 1;
                        }
                    }
                }
            }
        }
    }

    tracing::debug!("Total animated files found: {}", total_files);
    Ok(total_files)
}
