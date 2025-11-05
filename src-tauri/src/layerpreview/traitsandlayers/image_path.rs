use std::path::PathBuf;

#[tauri::command]
pub async fn get_layer_image_path(
    folder_path: String,
    layer_name: String,
    image_name: String,
) -> Result<String, String> {
    let path = PathBuf::from(&folder_path)
        .join(&layer_name)
        .join(&image_name);

    if !path.exists() {
        return Err(format!("Image not found: {}", path.display()));
    }

    Ok(path.to_string_lossy().to_string())
}
