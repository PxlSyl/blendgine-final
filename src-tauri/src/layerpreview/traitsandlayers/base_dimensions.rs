use image::ImageReader;
use std::{fs, path::PathBuf};

use crate::types::ImageDimensions;

#[tauri::command]
pub async fn get_base_dimensions(
    folder_path: String,
    first_layer: String,
) -> Result<ImageDimensions, String> {
    let layer_path = PathBuf::from(folder_path).join(first_layer);
    let mut entries = fs::read_dir(&layer_path).map_err(|e| e.to_string())?;

    let first_file = entries
        .next()
        .ok_or("No files found in layer folder")?
        .map_err(|e| e.to_string())?;

    let img = ImageReader::open(first_file.path())
        .map_err(|e| e.to_string())?
        .decode()
        .map_err(|e| e.to_string())?;

    Ok(ImageDimensions {
        width: img.width(),
        height: img.height(),
    })
}
