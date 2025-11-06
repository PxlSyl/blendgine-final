use anyhow::Result;
use std::path::PathBuf;
use tokio::fs::{metadata, read_dir};
use tracing;

#[tauri::command]
pub async fn get_layer_image_names(
    folder_path: String,
    layer_name: String,
) -> Result<Vec<String>, String> {
    tracing::debug!(
        "Getting image names for layer: {} in folder: {}",
        layer_name,
        folder_path
    );

    let path = PathBuf::from(&folder_path).join(&layer_name);

    if metadata(&path).await.is_err() {
        return Ok(Vec::new());
    }

    let mut images = Vec::new();
    let mut dir_stream = read_dir(&path).await.map_err(|e| {
        let msg = format!("Failed to read directory: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;

    while let Some(entry) = dir_stream.next_entry().await.map_err(|e| {
        let msg = format!("Failed to read entry: {}", e);
        tracing::error!("{}", msg);
        msg
    })? {
        let file_type = entry.file_type().await.map_err(|e| {
            let msg = format!("Failed to get file type: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;
        if file_type.is_file() {
            if let Some(ext) = entry.path().extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_ascii_lowercase();
                if ["png", "webp", "gif", "mp4", "webm", "mov", "avi", "mkv"]
                    .contains(&ext_lower.as_str())
                {
                    images.push(entry.file_name().to_string_lossy().to_string());
                }
            }
        }
    }

    tracing::debug!("Found {} images in layer: {}", images.len(), layer_name);
    Ok(images)
}
