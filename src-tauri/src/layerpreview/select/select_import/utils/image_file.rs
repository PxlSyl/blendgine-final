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

pub async fn process_image_file(
    path: PathBuf,
) -> Result<Option<(ImageMetadata, ImageDimensions)>, String> {
    tracing::debug!("Processing image file: {}", path.display());

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
