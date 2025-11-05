use serde_json::json;
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use tauri::State;
use tokio::{fs, io::AsyncReadExt};
use tracing;
use walkdir::WalkDir;

use crate::{
    filesystem::{
        constants::StorageFiles,
        storage::{load_storage, save_storage},
        utils::normalize_path,
    },
    types::OtherParameters,
};

async fn load_other_parameters(storage: &PathBuf) -> Result<OtherParameters, String> {
    match load_storage(storage).await {
        Ok(Some(params)) => Ok(params),
        Ok(None) => Ok(OtherParameters::default()),
        Err(e) => Err(e),
    }
}

#[tauri::command]
pub async fn calculate_folder_hash(folder_path: String) -> Result<String, String> {
    tracing::info!("[FolderHash] Calculating hash for folder: {}", folder_path);

    let result = calculate_folder_hash_impl(&PathBuf::from(&folder_path)).await;

    match &result {
        Ok(hash) => {
            tracing::debug!(
                "[FolderHash] Successfully calculated hash for {}: {}",
                folder_path,
                hash
            );
            Ok(hash.clone())
        }
        Err(e) => {
            tracing::error!(
                "[FolderHash] Failed to calculate hash for {}: {}",
                folder_path,
                e
            );
            Err(e.to_string())
        }
    }
}

async fn calculate_folder_hash_impl(path: &PathBuf) -> std::io::Result<String> {
    tracing::debug!(
        "[FolderHash] Starting hash calculation for path: {:?}",
        path
    );

    let mut hasher = Sha256::new();
    let mut file_count = 0;
    let mut total_size = 0u64;
    let mut dir_count = 0;

    let walker = WalkDir::new(path)
        .follow_links(false)
        .sort_by(|a, b| a.path().cmp(b.path()));

    for entry in walker {
        match entry {
            Ok(entry) => {
                let entry_path = entry.path();

                if entry.file_type().is_file() {
                    let relative_path = entry_path
                        .strip_prefix(path)
                        .unwrap_or(entry_path)
                        .to_string_lossy();

                    let normalized_path = normalize_path(&relative_path);
                    hasher.update(normalized_path.as_bytes());

                    tracing::trace!("[FolderHash] Processing file: {}", normalized_path);

                    if let Err(e) =
                        hash_file_content(entry_path, &mut hasher, &mut total_size).await
                    {
                        tracing::warn!("[FolderHash] Failed to read file {:?}: {}", entry_path, e);
                    } else {
                        file_count += 1;
                    }
                } else if entry.file_type().is_dir() {
                    dir_count += 1;

                    let relative_path = entry_path
                        .strip_prefix(path)
                        .unwrap_or(entry_path)
                        .to_string_lossy();

                    let normalized_path = normalize_path(&relative_path);
                    hasher.update(normalized_path.as_bytes());

                    tracing::debug!("[FolderHash] Processing directory: {}", normalized_path);
                }
            }
            Err(e) => {
                tracing::warn!("[FolderHash] Failed to access entry: {}", e);
            }
        }
    }

    let hash = format!("{:x}", hasher.finalize());
    tracing::info!(
        "[FolderHash] Hash calculation completed: {} files, {} directories, {} bytes, hash: {}",
        file_count,
        dir_count,
        total_size,
        hash
    );

    Ok(hash)
}

async fn hash_file_content(
    file_path: &std::path::Path,
    hasher: &mut Sha256,
    total_size: &mut u64,
) -> std::io::Result<()> {
    let mut file = match fs::File::open(file_path).await {
        Ok(file) => file,
        Err(e) => {
            tracing::warn!("[FolderHash] Failed to open file {:?}: {}", file_path, e);
            return Err(e);
        }
    };

    let mut buffer = [0u8; 8192];
    let mut file_size = 0u64;

    loop {
        let bytes_read = match file.read(&mut buffer).await {
            Ok(n) if n == 0 => break,
            Ok(n) => n,
            Err(e) => {
                tracing::warn!(
                    "[FolderHash] Failed to read chunk from {:?}: {}",
                    file_path,
                    e
                );
                return Err(e);
            }
        };

        hasher.update(&buffer[..bytes_read]);
        file_size += bytes_read as u64;
    }

    *total_size += file_size;

    tracing::trace!(
        "[FolderHash] Hashed file {:?}: {} bytes",
        file_path,
        file_size
    );

    Ok(())
}

#[tauri::command]
pub async fn is_folder_modified(
    folder_path: String,
    previous_hash: String,
) -> Result<bool, String> {
    if folder_path.is_empty() {
        tracing::debug!("[FolderHash] Empty folder path, returning false");
        return Ok(false);
    }

    tracing::info!(
        "[FolderHash] Checking if folder is modified: {}",
        folder_path
    );
    tracing::debug!("[FolderHash] Previous hash: {}", previous_hash);

    let current_hash = match calculate_folder_hash(folder_path.clone()).await {
        Ok(hash) => {
            tracing::debug!("[FolderHash] Current hash: {}", hash);
            hash
        }
        Err(e) => {
            tracing::error!("[FolderHash] Failed to calculate current hash: {}", e);
            return Err(e);
        }
    };

    let is_modified = current_hash != previous_hash;

    if is_modified {
        tracing::info!(
            "[FolderHash] Folder {} has been modified (hash changed)",
            folder_path
        );
    } else {
        tracing::debug!(
            "[FolderHash] Folder {} has not been modified (hash unchanged)",
            folder_path
        );
    }

    Ok(is_modified)
}

#[tauri::command]
pub async fn get_previous_hash<'r>(
    folder_path: String,
    storage_files: State<'r, StorageFiles>,
) -> Result<Option<String>, String> {
    tracing::debug!(
        "[FolderHash] Getting previous hash for folder: {}",
        folder_path
    );

    let other_parameters = load_other_parameters(&storage_files.other_parameters).await?;
    let hash = other_parameters.hash.get(&folder_path).cloned();

    match &hash {
        Some(h) => tracing::debug!(
            "[FolderHash] Found previous hash for {}: {}",
            folder_path,
            h
        ),
        None => tracing::debug!("[FolderHash] No previous hash found for {}", folder_path),
    }

    Ok(hash)
}

#[tauri::command]
pub async fn save_folder_hash<'r>(
    folder_path: String,
    hash: String,
    storage_files: State<'r, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!(
        "[FolderHash] Saving hash for folder: {} -> {}",
        folder_path,
        hash
    );

    let mut other_parameters = load_other_parameters(&storage_files.other_parameters).await?;

    if let Some(previous_hash) = other_parameters.hash.get(&folder_path) {
        if previous_hash == &hash {
            tracing::debug!(
                "[FolderHash] Hash unchanged for {}, skipping save",
                folder_path
            );
            return Ok(json!({ "success": true, "message": "Hash unchanged" }));
        } else {
            tracing::info!(
                "[FolderHash] Hash changed for {}: {} -> {}",
                folder_path,
                previous_hash,
                hash
            );
        }
    } else {
        tracing::info!("[FolderHash] First time saving hash for {}", folder_path);
    }

    other_parameters
        .hash
        .insert(folder_path.clone(), hash.clone());

    match save_storage(&storage_files.other_parameters, &other_parameters).await {
        Ok(_) => {
            tracing::info!("[FolderHash] Successfully saved hash for {}", folder_path);
            Ok(json!({ "success": true, "hash": hash }))
        }
        Err(e) => {
            tracing::error!(
                "[FolderHash] Failed to save hash for {}: {}",
                folder_path,
                e
            );
            Err(e)
        }
    }
}
