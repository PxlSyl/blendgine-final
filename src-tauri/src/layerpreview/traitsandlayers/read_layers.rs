use std::{fs, path::PathBuf};

#[tauri::command]
pub async fn read_layers(folder_path: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(&folder_path);

    if !path.exists() {
        return Err("Folder path does not exist".into());
    }

    let mut layers = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        if let Ok(metadata) = entry.metadata() {
            if metadata.is_dir() {
                if let Some(dir_name) = entry.file_name().to_str() {
                    if !dir_name.starts_with('.')
                        && dir_name != "frames"
                        && dir_name != "spritesheets"
                    {
                        layers.push(dir_name.to_string());
                    }
                }
            }
        }
    }

    Ok(layers)
}
