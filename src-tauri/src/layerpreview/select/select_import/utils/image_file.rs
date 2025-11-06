use crate::{
    layerpreview::select::select_import::utils::{
        frame_count::detect_frame_count, structs::ImageMetadata,
    },
    types::ImageDimensions,
};
use anyhow::Result;
use image::{self, ImageReader};
use std::{io::Cursor, path::PathBuf};
use tokio::{fs::read, task::spawn_blocking};
use tracing;

fn is_video_extension(path: &PathBuf) -> bool {
    if let Some(ext) = path.extension() {
        let ext_lower = ext.to_string_lossy().to_lowercase();
        matches!(ext_lower.as_str(), "mp4" | "webm" | "mov" | "avi" | "mkv")
    } else {
        false
    }
}

pub async fn process_image_file(
    path: PathBuf,
) -> Result<Option<(ImageMetadata, ImageDimensions)>, String> {
    tracing::debug!("Processing media file: {}", path.display());

    // For videos, skip detailed processing - they'll be extracted later in extract_frames
    if is_video_extension(&path) {
        tracing::debug!(
            "Video file detected, deferring processing: {}",
            path.display()
        );

        // Return basic metadata with placeholder dimensions
        // Real dimensions will be determined during spritesheet extraction
        let metadata = ImageMetadata {
            name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: path.to_string_lossy().to_string(),
            dimensions: ImageDimensions {
                width: 0,  // Placeholder - will be set during extraction
                height: 0, // Placeholder - will be set during extraction
            },
            frame_count: Some(0), // Placeholder - will be determined during extraction
            is_single_frame: false, // Videos are always animated
        };

        return Ok(Some((
            metadata,
            ImageDimensions {
                width: 0,
                height: 0,
            },
        )));
    }

    // Process images (existing logic)
    let img_data = match read(&path).await {
        Ok(data) => data,
        Err(_) => {
            tracing::debug!("Failed to read image file: {}", path.display());
            return Ok(None);
        }
    };

    let img_data_clone = img_data.clone();
    let dimensions = match spawn_blocking(move || {
        let cursor = Cursor::new(&img_data_clone);
        ImageReader::new(cursor)
            .with_guessed_format()
            .ok()
            .and_then(|reader| reader.decode().ok())
            .map(|img| ImageDimensions {
                width: img.width(),
                height: img.height(),
            })
    })
    .await
    .map_err(|e| {
        let msg = format!("Failed to process image: {}", e);
        tracing::error!("{}", msg);
        msg
    })? {
        Some(dimensions) => dimensions,
        _none => return Ok(None),
    };

    let frame_count = detect_frame_count(&img_data, &path)?;
    let (dimensions, frame_count) = (dimensions, frame_count);
    let is_single_frame = frame_count <= 1;

    tracing::debug!(
        "Image processed: {}x{} dimensions, {} frames",
        dimensions.width,
        dimensions.height,
        frame_count
    );

    let metadata = ImageMetadata {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: path.to_string_lossy().to_string(),
        dimensions: dimensions.clone(),
        frame_count: Some(frame_count),
        is_single_frame,
    };

    tracing::debug!("Image metadata created successfully: {}", metadata.name);
    Ok(Some((metadata, dimensions)))
}
