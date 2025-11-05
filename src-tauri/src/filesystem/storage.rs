use serde::{de::DeserializeOwned, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;
use tracing;

pub async fn load_storage<T>(path: &PathBuf) -> Result<Option<T>, String>
where
    T: DeserializeOwned + Default + Serialize,
{
    tracing::debug!("[Storage] Loading from path: {:?}", path);

    if !path.exists() {
        tracing::info!("[Storage] File does not exist, creating default");
        let default_value = T::default();

        if let Err(e) = save_storage(path, &default_value).await {
            tracing::error!(
                "[Storage] Failed to save default config to {:?}: {}",
                path,
                e
            );
            return Err(format!("Failed to save default config: {}", e));
        }

        tracing::info!(
            "[Storage] Successfully created default config at {:?}",
            path
        );
        return Ok(Some(default_value));
    }

    let content = match fs::read_to_string(path).await {
        Ok(content) => content,
        Err(e) => {
            tracing::error!("[Storage] Failed to read file {:?}: {}", path, e);
            return Err(format!("Failed to read file: {}", e));
        }
    };

    if content.trim().is_empty() {
        tracing::info!("[Storage] File is empty, creating default");
        let default_value = T::default();

        if let Err(e) = save_storage(path, &default_value).await {
            tracing::error!(
                "[Storage] Failed to save default config to {:?}: {}",
                path,
                e
            );
            return Err(format!("Failed to save default config: {}", e));
        }

        tracing::info!(
            "[Storage] Successfully created default config at {:?}",
            path
        );
        return Ok(Some(default_value));
    }

    tracing::debug!("[Storage] Successfully read file content from {:?}", path);

    match serde_json::from_str(&content) {
        Ok(data) => {
            tracing::debug!("[Storage] Successfully parsed JSON from {:?}", path);
            Ok(Some(data))
        }
        Err(e) => {
            tracing::error!("[Storage] Failed to parse JSON from {:?}: {}", path, e);
            Err(format!(
                "Failed to parse JSON from: {}: {}",
                path.display(),
                e
            ))
        }
    }
}

pub async fn save_storage<T: Serialize>(path: &Path, data: &T) -> Result<(), String> {
    tracing::debug!("[Storage] Saving to path: {:?}", path);

    let content = match serde_json::to_string_pretty(data) {
        Ok(content) => content,
        Err(e) => {
            tracing::error!("[Storage] Failed to serialize data for {:?}: {}", path, e);
            return Err(format!("Failed to serialize data: {}", e));
        }
    };

    tracing::debug!("[Storage] Successfully serialized data for {:?}", path);

    match fs::write(path, content).await {
        Ok(_) => {
            tracing::debug!("[Storage] Successfully wrote data to {:?}", path);
            Ok(())
        }
        Err(e) => {
            tracing::error!("[Storage] Failed to write file {:?}: {}", path, e);
            Err(format!("Failed to write file: {}", e))
        }
    }
}
