use serde_json::json;
use std::{collections::HashMap, fs, path::Path};
use tauri::{Manager, State};
use tracing;

use crate::{
    filesystem::{
        constants::StorageFiles,
        storage::{load_storage, save_storage},
        utils::normalize_path,
    },
    types::{RarityConfig, RarityConfigStorage, SetsStorage},
};

#[tauri::command]
pub async fn rename_item(
    app_handle: tauri::AppHandle,
    storage_files: State<'_, StorageFiles>,
    base_path: String,
    old_name: String,
    new_name: String,
) -> Result<serde_json::Value, String> {
    let old_path = Path::new(&base_path).join(&old_name);
    let new_path = Path::new(&base_path).join(&new_name);

    let is_trait_rename = old_name.contains('.') && new_name.contains('.');

    let (layer_name, old_trait_name, new_trait_name) = if is_trait_rename {
        let old_path_parts: Vec<&str> = old_name.split('/').collect();
        let new_path_parts: Vec<&str> = new_name.split('/').collect();

        if old_path_parts.len() == 2 && new_path_parts.len() == 2 {
            let layer_name = old_path_parts[0].to_string();
            let old_trait_name = normalize_path(
                &Path::new(old_path_parts[1])
                    .file_stem()
                    .ok_or("Could not extract trait name from old name")?
                    .to_string_lossy(),
            );
            let new_trait_name = normalize_path(
                &Path::new(new_path_parts[1])
                    .file_stem()
                    .ok_or("Could not extract trait name from new name")?
                    .to_string_lossy(),
            );

            (layer_name, old_trait_name, new_trait_name)
        } else {
            let layer_path = Path::new(&base_path);
            let layer_name = normalize_path(
                &layer_path
                    .file_name()
                    .ok_or("Could not extract layer name from base path")?
                    .to_string_lossy(),
            );

            let old_trait_name = normalize_path(
                &Path::new(&old_name)
                    .file_stem()
                    .ok_or("Could not extract trait name from old name")?
                    .to_string_lossy(),
            );

            let new_trait_name = normalize_path(
                &Path::new(&new_name)
                    .file_stem()
                    .ok_or("Could not extract trait name from new name")?
                    .to_string_lossy(),
            );

            (layer_name, old_trait_name, new_trait_name)
        }
    } else {
        (String::new(), String::new(), String::new())
    };

    match fs::rename(&old_path, &new_path) {
        Ok(_) => {
            if !is_trait_rename {
                if let Err(e) =
                    rename_animation_directories(&app_handle, &base_path, &old_name, &new_name)
                        .await
                {
                    tracing::warn!("Warning: Failed to rename animation directories: {}", e);
                }
            } else {
                if let Err(e) = update_rarity_config_for_trait_rename(
                    &storage_files,
                    &layer_name,
                    &old_trait_name,
                    &new_trait_name,
                )
                .await
                {
                    tracing::warn!("Warning: Failed to update rarity config: {}", e);
                }

                if let Err(e) = rename_trait_animation_directories(
                    &app_handle,
                    &base_path,
                    &layer_name,
                    &old_trait_name,
                    &new_trait_name,
                )
                .await
                {
                    tracing::warn!(
                        "Warning: Failed to rename trait animation directories: {}",
                        e
                    );
                }
            }

            if !is_trait_rename {
                if let Err(e) =
                    update_rarity_config_for_layer_rename(&storage_files, &old_name, &new_name)
                        .await
                {
                    tracing::warn!(
                        "Warning: Failed to update rarity config for layer rename: {}",
                        e
                    );
                }

                if let Err(e) =
                    update_ordered_layers_for_layer_rename(&storage_files, &old_name, &new_name)
                        .await
                {
                    tracing::warn!(
                        "Warning: Failed to update ordered layers for layer rename: {}",
                        e
                    );
                }
            }

            Ok(json!({
                "success": true
            }))
        }
        Err(error) => {
            tracing::error!("Error renaming item: {}", error);
            Ok(json!({
                "success": false,
                "error": error.to_string()
            }))
        }
    }
}

async fn rename_animation_directories(
    app_handle: &tauri::AppHandle,
    base_path: &str,
    old_layer_name: &str,
    new_layer_name: &str,
) -> Result<(), String> {
    tracing::debug!(
        "[Rename] Renaming animation directories for layer: {} -> {}",
        old_layer_name,
        new_layer_name
    );

    let project_id = normalize_path(
        &Path::new(base_path)
            .file_name()
            .ok_or("Could not extract project ID from base path")?
            .to_string_lossy(),
    );
    tracing::debug!("[Rename] Project ID extracted: {}", project_id);

    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        tracing::error!("[Rename] Failed to get app data directory: {}", e);
        format!("Failed to get app data directory: {}", e)
    })?;

    let animated_dir = app_data_dir.join("animated").join(&project_id);

    if !animated_dir.exists() {
        tracing::debug!("[Rename] Animated directory does not exist, skipping");
        return Ok(());
    }

    tracing::debug!("[Rename] Processing frames directory");
    let old_frames_dir = animated_dir.join("frames").join(old_layer_name);
    let new_frames_dir = animated_dir.join("frames").join(new_layer_name);

    if old_frames_dir.exists() {
        if new_frames_dir.exists() {
            tracing::debug!(
                "[Rename] Removing existing frames directory: {:?}",
                new_frames_dir
            );
            fs::remove_dir_all(&new_frames_dir).map_err(|e| {
                tracing::error!("[Rename] Failed to remove existing frames directory: {}", e);
                format!("Failed to remove existing frames directory: {}", e)
            })?;
        }

        if let Some(parent) = new_frames_dir.parent() {
            tracing::debug!("[Rename] Creating frames parent directory: {:?}", parent);
            fs::create_dir_all(parent).map_err(|e| {
                tracing::error!("[Rename] Failed to create frames parent directory: {}", e);
                format!("Failed to create frames parent directory: {}", e)
            })?;
        }

        tracing::debug!(
            "[Rename] Renaming frames directory: {:?} -> {:?}",
            old_frames_dir,
            new_frames_dir
        );
        fs::rename(&old_frames_dir, &new_frames_dir).map_err(|e| {
            tracing::error!("[Rename] Failed to rename frames directory: {}", e);
            format!("Failed to rename frames directory: {}", e)
        })?;
        tracing::info!("[Rename] Successfully renamed frames directory");
    } else {
        tracing::debug!("[Rename] Old frames directory does not exist, skipping");
    }

    tracing::debug!("[Rename] Processing spritesheets directory");
    let old_spritesheets_dir = animated_dir.join("spritesheets").join(old_layer_name);
    let new_spritesheets_dir = animated_dir.join("spritesheets").join(new_layer_name);

    if old_spritesheets_dir.exists() {
        if new_spritesheets_dir.exists() {
            tracing::debug!(
                "[Rename] Removing existing spritesheets directory: {:?}",
                new_spritesheets_dir
            );
            fs::remove_dir_all(&new_spritesheets_dir).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to remove existing spritesheets directory: {}",
                    e
                );
                format!("Failed to remove existing spritesheets directory: {}", e)
            })?;
        }

        if let Some(parent) = new_spritesheets_dir.parent() {
            tracing::debug!(
                "[Rename] Creating spritesheets parent directory: {:?}",
                parent
            );
            fs::create_dir_all(parent).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to create spritesheets parent directory: {}",
                    e
                );
                format!("Failed to create spritesheets parent directory: {}", e)
            })?;
        }

        tracing::debug!(
            "[Rename] Renaming spritesheets directory: {:?} -> {:?}",
            old_spritesheets_dir,
            new_spritesheets_dir
        );
        fs::rename(&old_spritesheets_dir, &new_spritesheets_dir).map_err(|e| {
            tracing::error!("[Rename] Failed to rename spritesheets directory: {}", e);
            format!("Failed to rename spritesheets directory: {}", e)
        })?;
        tracing::info!("[Rename] Successfully renamed spritesheets directory");
    } else {
        tracing::debug!("[Rename] Old spritesheets directory does not exist, skipping");
    }

    tracing::info!(
        "[Rename] Successfully completed animation directories rename for layer: {} -> {}",
        old_layer_name,
        new_layer_name
    );
    Ok(())
}

async fn update_rarity_config_for_trait_rename(
    storage_files: &StorageFiles,
    layer_name: &str,
    old_trait_name: &str,
    new_trait_name: &str,
) -> Result<(), String> {
    tracing::debug!(
        "[Rename] Updating rarity config for trait rename: {} -> {} in layer {}",
        old_trait_name,
        new_trait_name,
        layer_name
    );

    let current_config: Option<RarityConfigStorage> =
        match load_storage(&storage_files.rarity_config).await {
            Ok(Some(config)) => {
                tracing::debug!("[Rename] Successfully loaded existing rarity config");
                Some(config)
            }
            Ok(_none) => {
                tracing::warn!("[Rename] No rarity config found, creating default");
                Some(RarityConfigStorage {
                    rarity_config_storage: RarityConfig::default(),
                })
            }
            Err(e) => {
                tracing::error!("[Rename] Failed to load rarity config: {}", e);
                return Err(format!("Failed to load rarity config: {}", e));
            }
        };

    if let Some(mut config) = current_config {
        if let Some(layer_config) = config.rarity_config_storage.layers.get_mut(layer_name) {
            if let Some(trait_config) = layer_config.traits.remove(old_trait_name) {
                layer_config
                    .traits
                    .insert(new_trait_name.to_string(), trait_config);
                tracing::info!(
                    "[Rename] Updated trait name from '{}' to '{}' in layer '{}'",
                    old_trait_name,
                    new_trait_name,
                    layer_name
                );
            } else {
                tracing::warn!(
                    "[Rename] Trait '{}' not found in layer '{}'",
                    old_trait_name,
                    layer_name
                );
                return Ok(());
            }
        } else {
            tracing::warn!("[Rename] Layer '{}' not found in rarity config", layer_name);
            return Ok(());
        }

        match save_storage(&storage_files.rarity_config, &config).await {
            Ok(_) => {
                tracing::info!(
                    "[Rename] Successfully updated rarity_config.json with trait rename"
                );
            }
            Err(e) => {
                tracing::error!("[Rename] Failed to save updated rarity config: {}", e);
                return Err(format!("Failed to save updated rarity config: {}", e));
            }
        }
    }

    Ok(())
}

async fn update_rarity_config_for_layer_rename(
    storage_files: &StorageFiles,
    old_name: &str,
    new_name: &str,
) -> Result<(), String> {
    tracing::debug!(
        "[Rename] Updating rarity config for layer rename: {} -> {}",
        old_name,
        new_name
    );

    let current_config: Option<RarityConfigStorage> =
        match load_storage(&storage_files.rarity_config).await {
            Ok(Some(config)) => {
                tracing::debug!("[Rename] Successfully loaded existing rarity config");
                Some(config)
            }
            Ok(_none) => {
                tracing::warn!("[Rename] No rarity config found, creating default");
                Some(RarityConfigStorage {
                    rarity_config_storage: RarityConfig::default(),
                })
            }
            Err(e) => {
                tracing::error!("[Rename] Failed to load rarity config: {}", e);
                return Err(format!("Failed to load rarity config: {}", e));
            }
        };

    if let Some(mut config) = current_config {
        if let Some(layer_config) = config.rarity_config_storage.layers.remove(old_name) {
            config
                .rarity_config_storage
                .layers
                .insert(new_name.to_string(), layer_config);
            tracing::info!(
                "[Rename] Updated layer name from '{}' to '{}' in rarity config",
                old_name,
                new_name
            );
        } else {
            tracing::warn!("[Rename] Layer '{}' not found in rarity config", old_name);
            return Ok(());
        }

        match save_storage(&storage_files.rarity_config, &config).await {
            Ok(_) => {
                tracing::info!(
                    "[Rename] Successfully updated rarity_config.json with layer rename"
                );
            }
            Err(e) => {
                tracing::error!("[Rename] Failed to save updated rarity config: {}", e);
                return Err(format!("Failed to save updated rarity config: {}", e));
            }
        }
    }

    Ok(())
}

async fn update_ordered_layers_for_layer_rename(
    storage_files: &StorageFiles,
    old_name: &str,
    new_name: &str,
) -> Result<(), String> {
    tracing::debug!(
        "[Rename] Updating ordered layers for layer rename: {} -> {}",
        old_name,
        new_name
    );

    let current_config: Option<SetsStorage> =
        match load_storage(&storage_files.ordered_layers).await {
            Ok(Some(config)) => {
                tracing::debug!("[Rename] Successfully loaded existing ordered layers config");
                Some(config)
            }
            Ok(_none) => {
                tracing::warn!("[Rename] No ordered layers config found, creating default");
                Some(SetsStorage {
                    sets: HashMap::new(),
                    active_set_id: "set1".to_string(),
                    set_orders: vec![],
                })
            }
            Err(e) => {
                tracing::error!("[Rename] Failed to load ordered layers config: {}", e);
                return Err(format!("Failed to load ordered layers config: {}", e));
            }
        };

    if let Some(mut config) = current_config {
        let mut updated = false;
        for set_info in config.sets.values_mut() {
            if let Some(index) = set_info.layers.iter().position(|layer| layer == old_name) {
                set_info.layers[index] = new_name.to_string();
                updated = true;
                tracing::debug!(
                    "[Rename] Updated layer '{}' to '{}' in set",
                    old_name,
                    new_name
                );
            }
        }

        if updated {
            tracing::info!(
                "[Rename] Updated layer name from '{}' to '{}' in ordered layers config",
                old_name,
                new_name
            );
        } else {
            tracing::warn!(
                "[Rename] Layer '{}' not found in ordered layers config",
                old_name
            );
            return Ok(());
        }

        match save_storage(&storage_files.ordered_layers, &config).await {
            Ok(_) => {
                tracing::info!(
                    "[Rename] Successfully updated ordered_layers.json with layer rename"
                );
            }
            Err(e) => {
                tracing::error!(
                    "[Rename] Failed to save updated ordered layers config: {}",
                    e
                );
                return Err(format!(
                    "Failed to save updated ordered layers config: {}",
                    e
                ));
            }
        }
    }

    Ok(())
}

async fn rename_trait_animation_directories(
    app_handle: &tauri::AppHandle,
    base_path: &str,
    layer_name: &str,
    old_trait_name: &str,
    new_trait_name: &str,
) -> Result<(), String> {
    tracing::debug!(
        "[Rename] Renaming trait animation directories: {} -> {} in layer {}",
        old_trait_name,
        new_trait_name,
        layer_name
    );

    let project_id = normalize_path(
        &Path::new(base_path)
            .file_name()
            .ok_or("Could not extract project ID from base path")?
            .to_string_lossy(),
    );
    tracing::debug!("[Rename] Project ID extracted: {}", project_id);

    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        tracing::error!("[Rename] Failed to get app data directory: {}", e);
        format!("Failed to get app data directory: {}", e)
    })?;

    let animated_dir = app_data_dir.join("animated").join(&project_id);

    if !animated_dir.exists() {
        tracing::debug!("[Rename] Animated directory does not exist, skipping");
        return Ok(());
    }

    tracing::info!("[Rename] Animated directory exists, proceeding with rename");

    tracing::debug!("[Rename] Processing frames directory for trait");
    let old_frames_dir = animated_dir
        .join("frames")
        .join(layer_name)
        .join(old_trait_name);
    let new_frames_dir = animated_dir
        .join("frames")
        .join(layer_name)
        .join(new_trait_name);

    if old_frames_dir.exists() {
        if new_frames_dir.exists() {
            tracing::debug!(
                "[Rename] Removing existing trait frames directory: {:?}",
                new_frames_dir
            );
            fs::remove_dir_all(&new_frames_dir).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to remove existing trait frames directory: {}",
                    e
                );
                format!("Failed to remove existing trait frames directory: {}", e)
            })?;
        }

        if let Some(parent) = new_frames_dir.parent() {
            tracing::info!("[Rename] Frames - creating parent directory: {:?}", parent);
            fs::create_dir_all(parent).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to create trait frames parent directory: {}",
                    e
                );
                format!("Failed to create trait frames parent directory: {}", e)
            })?;
        }

        tracing::debug!(
            "[Rename] Renaming trait frames directory: {:?} -> {:?}",
            old_frames_dir,
            new_frames_dir
        );
        fs::rename(&old_frames_dir, &new_frames_dir).map_err(|e| {
            tracing::error!("[Rename] Failed to rename trait frames directory: {}", e);
            format!("Failed to rename trait frames directory: {}", e)
        })?;
        tracing::info!("[Rename] Successfully renamed trait frames directory");
    } else {
        tracing::info!("[Rename] Frames - old directory does not exist, skipping");
    }

    tracing::debug!("[Rename] Processing spritesheets directory for trait");
    let old_spritesheets_dir = animated_dir
        .join("spritesheets")
        .join(layer_name)
        .join(old_trait_name);
    let new_spritesheets_dir = animated_dir
        .join("spritesheets")
        .join(layer_name)
        .join(new_trait_name);

    if old_spritesheets_dir.exists() {
        if new_spritesheets_dir.exists() {
            tracing::debug!(
                "[Rename] Removing existing trait spritesheets directory: {:?}",
                new_spritesheets_dir
            );
            fs::remove_dir_all(&new_spritesheets_dir).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to remove existing trait spritesheets directory: {}",
                    e
                );
                format!(
                    "Failed to remove existing trait spritesheets directory: {}",
                    e
                )
            })?;
        }

        if let Some(parent) = new_spritesheets_dir.parent() {
            tracing::debug!(
                "[Rename] Creating trait spritesheets parent directory: {:?}",
                parent
            );
            fs::create_dir_all(parent).map_err(|e| {
                tracing::error!(
                    "[Rename] Failed to create trait spritesheets parent directory: {}",
                    e
                );
                format!(
                    "Failed to create trait spritesheets parent directory: {}",
                    e
                )
            })?;
        }

        tracing::debug!(
            "[Rename] Renaming trait spritesheets directory: {:?} -> {:?}",
            old_spritesheets_dir,
            new_spritesheets_dir
        );
        fs::rename(&old_spritesheets_dir, &new_spritesheets_dir).map_err(|e| {
            tracing::error!(
                "[Rename] Failed to rename trait spritesheets directory: {}",
                e
            );
            format!("Failed to rename trait spritesheets directory: {}", e)
        })?;
        tracing::info!("[Rename] Successfully renamed trait spritesheets directory");
    } else {
        tracing::info!("[Rename] Spritesheets - old directory does not exist, skipping");
    }

    tracing::info!(
        "[Rename] Successfully completed trait animation directories rename: {} -> {} in layer {}",
        old_trait_name,
        new_trait_name,
        layer_name
    );
    Ok(())
}
