use image::ImageReader;
use std::path::Path;

use crate::types::ImageDimensions;

#[tauri::command]
pub async fn get_image_dimensions(path: &Path) -> Result<ImageDimensions, String> {
    let file = match ImageReader::open(path) {
        Ok(file) => file,
        Err(e) => return Err(e.to_string()),
    };

    let img = match file.decode() {
        Ok(img) => img,
        Err(e) => return Err(e.to_string()),
    };

    Ok(ImageDimensions {
        width: img.width(),
        height: img.height(),
    })
}
