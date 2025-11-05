use anyhow;
use serde_json::json;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::Manager;
use tracing;

#[tauri::command]
pub async fn is_folder_empty(folder_path: String) -> Result<bool, String> {
    if folder_path.is_empty() {
        tracing::warn!("[Utils] Empty folder path provided");
        return Err("folderPath must be a string".into());
    }

    tracing::debug!("[Utils] Checking if folder is empty: {}", folder_path);
    let entries = fs::read_dir(&folder_path).map_err(|e| e.to_string())?;
    let count = entries.count();

    tracing::debug!("[Utils] Folder {} contains {} entries", folder_path, count);
    Ok(count == 0)
}

#[tauri::command]
pub async fn check_folder_exists(path: String) -> Result<bool, String> {
    let path = Path::new(&path);
    let exists = path.exists() && path.is_dir();

    tracing::debug!(
        "[Utils] Checking folder exists: {} -> {}",
        path.display(),
        exists
    );
    Ok(exists)
}

#[tauri::command]
pub fn get_documents_path() -> Result<PathBuf, String> {
    tracing::debug!("[Utils] Getting documents path");
    dirs::document_dir().ok_or_else(|| "Could not get documents path".to_string())
}

#[tauri::command]
pub async fn clean_previews_folder(export_path: String) -> Result<serde_json::Value, String> {
    let previews_folder = PathBuf::from(export_path).join("previews");
    tracing::debug!("[Utils] Cleaning previews folder: {:?}", previews_folder);

    match fs::remove_dir_all(&previews_folder) {
        Ok(_) => {
            tracing::info!(
                "[Utils] Successfully cleaned previews folder: {:?}",
                previews_folder
            );
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!(
                "[Utils] Failed to clean previews folder {:?}: {}",
                previews_folder,
                e
            );
            Ok(json!({
                "success": false,
                "error": e.to_string()
            }))
        }
    }
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<serde_json::Value, String> {
    tracing::debug!("[Utils] Deleting file: {}", file_path);

    match fs::remove_file(&file_path) {
        Ok(_) => {
            tracing::info!("[Utils] Successfully deleted file: {}", file_path);
            Ok(json!({ "success": true }))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            tracing::debug!("[Utils] File not found (already deleted): {}", file_path);
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!("[Utils] Failed to delete file {}: {}", file_path, e);
            Ok(json!({
                "success": false,
                "error": e.to_string()
            }))
        }
    }
}

#[tauri::command]
pub async fn quit() -> Result<bool, String> {
    tracing::info!("[Utils] Application quit requested");
    std::process::exit(0);
}

#[tauri::command]
pub async fn ensure_config_folder(app: tauri::AppHandle) -> Result<(), String> {
    tracing::debug!("[Utils] Ensuring config folder exists");

    let config_dir = app.path().app_config_dir().map_err(|e| {
        tracing::error!("[Utils] Failed to get app config directory: {}", e);
        e.to_string()
    })?;

    tracing::debug!("[Utils] Config directory: {:?}", config_dir);
    fs::create_dir_all(&config_dir).map_err(|e| {
        tracing::error!(
            "[Utils] Failed to create config directory {:?}: {}",
            config_dir,
            e
        );
        e.to_string()
    })?;

    tracing::info!("[Utils] Config folder ensured: {:?}", config_dir);
    Ok(())
}

pub fn ensure_file_ready(file_path: &Path) -> Result<(), anyhow::Error> {
    tracing::debug!("[Utils] Ensuring file is ready: {:?}", file_path);

    let mut attempts = 0;
    const MAX_ATTEMPTS: u32 = 10;
    const DELAY_MS: u64 = 100;

    while attempts < MAX_ATTEMPTS {
        if !file_path.exists() {
            tracing::trace!(
                "[Utils] File does not exist yet, attempt {}/{}",
                attempts + 1,
                MAX_ATTEMPTS
            );
            std::thread::sleep(std::time::Duration::from_millis(DELAY_MS));
            attempts += 1;
            continue;
        }

        match std::fs::File::open(file_path) {
            Ok(_) => {
                let initial_size = std::fs::metadata(file_path)?.len();
                std::thread::sleep(std::time::Duration::from_millis(DELAY_MS));
                let final_size = std::fs::metadata(file_path)?.len();

                if initial_size == final_size && initial_size > 0 {
                    tracing::debug!(
                        "[Utils] File is ready: {:?} (size: {} bytes)",
                        file_path,
                        final_size
                    );
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    return Ok(());
                } else {
                    tracing::trace!(
                        "[Utils] File size changing, attempt {}/{}",
                        attempts + 1,
                        MAX_ATTEMPTS
                    );
                }
            }
            Err(_) => {
                tracing::trace!(
                    "[Utils] File not accessible yet, attempt {}/{}",
                    attempts + 1,
                    MAX_ATTEMPTS
                );
                std::thread::sleep(std::time::Duration::from_millis(DELAY_MS));
            }
        }

        attempts += 1;
    }

    tracing::error!(
        "[Utils] File not ready after {} attempts: {:?}",
        MAX_ATTEMPTS,
        file_path
    );
    Err(anyhow::anyhow!(
        "File not ready after {} attempts: {:?}",
        MAX_ATTEMPTS,
        file_path
    ))
}

pub fn normalize_path(path: &str) -> String {
    path.replace("\\", "/")
}
