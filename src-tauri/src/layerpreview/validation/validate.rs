use crate::layerpreview::{
    animations::commands::get_spritesheets_path, select::select_import::select::InitialFolderData,
};
use crate::{
    filesystem::{
        folderhash::{calculate_folder_hash, get_previous_hash, save_folder_hash},
        persist::{load_projectsetup_state, save_projectsetup_state},
    },
    layerpreview::validation::reload::reload_folder_data,
};
use anyhow::Result;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing;

#[tauri::command]
pub async fn validate_and_reload_layers(
    folder_path: String,
    app_handle: AppHandle,
) -> Result<InitialFolderData, String> {
    tracing::info!(
        "Validating and reloading layers for folder: {}",
        folder_path
    );

    let folder_path_buf = PathBuf::from(&folder_path);
    if !folder_path_buf.exists() {
        let msg = "Folder does not exist".to_string();
        tracing::error!("{}", msg);
        return Err(msg);
    }

    let persisted_state = load_projectsetup_state(app_handle.state())
        .await
        .map_err(|e| {
            let msg = format!("Failed to load project setup state: {}", e);
            tracing::error!("{}", msg);
            msg
        })?
        .unwrap_or_default();

    let current_hash = calculate_folder_hash(folder_path.clone())
        .await
        .map_err(|e| e.to_string())?;

    tracing::debug!("Calculated current folder hash: {}", current_hash);

    let previous_hash = get_previous_hash(folder_path.clone(), app_handle.state()).await;

    let should_recreate_spritesheets = match previous_hash {
        Ok(Some(hash)) => {
            if hash != current_hash {
                tracing::info!(
                    "Folder hash changed ({} -> {}), recreating spritesheets",
                    hash,
                    current_hash
                );
                true
            } else if persisted_state.is_animated_collection {
                let project_id = folder_path_buf
                    .file_name()
                    .and_then(|name| name.to_str())
                    .ok_or_else(|| {
                        let msg = "Failed to get folder name".to_string();
                        tracing::error!("{}", msg);
                        msg
                    })?
                    .to_string();

                let spritesheets_dir = get_spritesheets_path(app_handle.clone(), project_id)
                    .await
                    .map_err(|e| {
                        let msg = format!("Failed to get spritesheets directory: {}", e);
                        tracing::error!("{}", msg);
                        msg
                    })?;

                if !PathBuf::from(&spritesheets_dir).exists() {
                    tracing::info!("Spritesheets directory doesn't exist, recreating spritesheets");
                    true
                } else {
                    tracing::debug!("Spritesheets directory exists, no recreation needed");
                    false
                }
            } else {
                tracing::debug!("Not an animated collection, no spritesheets needed");
                false
            }
        }
        _ => {
            tracing::info!("No previous hash found, recreating spritesheets");
            true
        }
    };

    tracing::info!(
        "Reloading folder data (recreate spritesheets: {})",
        should_recreate_spritesheets
    );

    let result = reload_folder_data(
        app_handle.clone(),
        folder_path.clone(),
        should_recreate_spritesheets,
    )
    .await?;

    if should_recreate_spritesheets {
        tracing::info!("Saving new folder hash: {}", current_hash);
        save_folder_hash(folder_path.clone(), current_hash, app_handle.state())
            .await
            .map_err(|e| {
                let msg = format!("Failed to save folder hash: {}", e);
                tracing::error!("{}", msg);
                msg
            })?;
        tracing::info!("Folder hash saved successfully");
    }

    let mut updated_state = persisted_state.clone();
    updated_state.selected_folder = Some(folder_path);
    updated_state.is_animated_collection = result.is_animated_collection;

    tracing::info!(
        "Updating project state: animated_collection={}",
        result.is_animated_collection
    );

    save_projectsetup_state(updated_state, app_handle.state())
        .await
        .map_err(|e| {
            let msg = format!("Failed to save project setup state: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

    tracing::info!("Project state updated successfully");

    tracing::info!("Validation and reload completed successfully");
    Ok(result)
}
