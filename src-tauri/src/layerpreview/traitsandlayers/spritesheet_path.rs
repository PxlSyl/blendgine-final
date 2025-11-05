use std::path::PathBuf;

#[tauri::command]
pub async fn get_spritesheet_image_path(
    app_handle: tauri::AppHandle,
    project_id: String,
    layer_trait_path: String,
    spritesheet_name: String,
) -> Result<String, String> {
    use crate::layerpreview::animations::commands::get_spritesheets_path;

    let spritesheets_dir = get_spritesheets_path(app_handle, project_id).await?;

    let path = PathBuf::from(&spritesheets_dir)
        .join(&layer_trait_path)
        .join(&spritesheet_name);

    if !path.exists() {
        return Err(format!("Spritesheet not found: {}", path.display()));
    }

    Ok(path.to_string_lossy().to_string())
}
