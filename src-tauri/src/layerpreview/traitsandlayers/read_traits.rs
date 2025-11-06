use std::{fs, path::PathBuf};

#[tauri::command]
pub async fn read_traits(folder_path: String, layer_name: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(folder_path).join(&layer_name);

    if !path.exists() {
        return Err(format!("Layer path does not exist: {}", path.display()));
    }

    let mut traits = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        if let Ok(metadata) = entry.metadata() {
            if metadata.is_file() {
                if let Some(file_name) = entry.file_name().to_str() {
                    if !file_name.starts_with('.') && is_image_file(file_name) {
                        if let Some(trait_name) = file_name.split('.').next() {
                            traits.push(trait_name.to_string());
                        }
                    }
                }
            }
        }
    }

    if traits.is_empty() {
        return Err(format!(
            "No valid image files found in layer: {}",
            layer_name
        ));
    }

    Ok(traits)
}

fn is_image_file(file_name: &str) -> bool {
    let extensions = [
        ".png", ".gif", ".webp", ".mp4", ".webm", ".mov", ".avi", ".mkv",
    ];
    let lower_case = file_name.to_lowercase();
    extensions.iter().any(|&ext| lower_case.ends_with(ext))
}
