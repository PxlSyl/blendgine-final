use crate::{
    filesystem::{
        constants::StorageFiles,
        default_json::get_default_json_content,
        storage::{load_storage, save_storage},
    },
    types::{
        ForcedCombinationsBySets, ImageSetupState, IncompatibilitiesBySets, Preferences,
        ProjectSetupState, RarityConfig, RarityConfigStorage, SetInfo, SetOrder, SetsStorage,
    },
};
use chrono::Utc;
use serde::Serialize;
use serde_json::json;
use std::collections::HashMap;
use tauri::{Emitter, Manager, State};
use tracing;

#[tauri::command]
pub async fn load_preferences(
    storage_files: State<'_, StorageFiles>,
) -> Result<Option<Preferences>, String> {
    load_storage(&storage_files.preferences)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_preferences(
    preferences: Preferences,
    app_handle: tauri::AppHandle,
    storage_files: State<'_, StorageFiles>,
) -> Result<(), String> {
    save_storage(&storage_files.preferences, &preferences)
        .await
        .map_err(|e| e.to_string())?;

    // Mettre à jour le thème sombre/clair
    for window in app_handle.windows().values() {
        window
            .set_theme(if preferences.dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;
    }

    // Mettre à jour le thème de couleurs si spécifié
    if let Some(theme_name) = preferences.theme_name {
        for window in app_handle.windows().values() {
            window
                .emit("color-theme-changed", theme_name.clone())
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn save_projectsetup_state(
    state: ProjectSetupState,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    save_storage(&storage_files.project_setup, &state)
        .await
        .map(|_| json!({ "success": true }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_projectsetup_state(
    storage_files: State<'_, StorageFiles>,
) -> Result<Option<ProjectSetupState>, String> {
    load_storage(&storage_files.project_setup)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_layer_order_state(
    storage_files: State<'_, StorageFiles>,
) -> Result<SetsStorage, String> {
    tracing::debug!("[LayerOrder] Loading layer order state");

    match load_storage::<SetsStorage>(&storage_files.ordered_layers).await {
        Ok(Some(config)) => {
            tracing::debug!("[LayerOrder] Successfully loaded existing layer order config");
            Ok(config)
        }
        Ok(_none) => {
            tracing::info!("[LayerOrder] No layer order config found, creating default");
            let default_set_id = "set1".to_string();
            let mut default_sets = HashMap::new();

            default_sets.insert(
                default_set_id.clone(),
                SetInfo {
                    id: default_set_id.clone(),
                    name: "Set 1".to_string(),
                    custom_name: Some("Set 1".to_string()),
                    created_at: Utc::now().to_rfc3339(),
                    layers: vec![],
                    nft_count: 10,
                },
            );

            let default_config = SetsStorage {
                sets: default_sets,
                active_set_id: default_set_id.clone(),
                set_orders: vec![SetOrder {
                    id: default_set_id,
                    order: 0,
                }],
            };

            if let Err(e) = save_storage(&storage_files.ordered_layers, &default_config).await {
                tracing::error!("[LayerOrder] Failed to save default layer order: {}", e);
                return Err(format!("Failed to save default layer order: {}", e));
            }

            tracing::info!("[LayerOrder] Successfully created default layer order config");
            Ok(default_config)
        }
        Err(e) => {
            tracing::error!("[LayerOrder] Failed to load layer order: {}", e);
            Err(format!("Failed to load layer order: {}", e))
        }
    }
}

#[tauri::command]
pub async fn save_layer_order_state(
    state: SetsStorage,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!("[LayerOrder] Saving layer order state");

    match save_storage(&storage_files.ordered_layers, &state).await {
        Ok(_) => {
            tracing::info!("[LayerOrder] Successfully saved layer order state");
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!("[LayerOrder] Failed to save layer order state: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_incompatibility_state(
    storage_files: State<'_, StorageFiles>,
) -> Result<IncompatibilitiesBySets, String> {
    tracing::debug!("[Incompatibility] Loading incompatibility state");

    match load_storage(&storage_files.incompatibility).await {
        Ok(Some(data)) => {
            tracing::debug!("[Incompatibility] Successfully loaded incompatibility config");
            Ok(data)
        }
        Ok(_none) => {
            tracing::info!("[Incompatibility] No incompatibility config found, using defaults");
            Ok(IncompatibilitiesBySets::default())
        }
        Err(e) => {
            tracing::error!(
                "[Incompatibility] Failed to load incompatibility config: {}",
                e
            );
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn save_incompatibility_state(
    state: IncompatibilitiesBySets,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!("[Incompatibility] Saving incompatibility state");

    match save_storage(&storage_files.incompatibility, &state).await {
        Ok(_) => {
            tracing::info!("[Incompatibility] Successfully saved incompatibility state");
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!(
                "[Incompatibility] Failed to save incompatibility state: {}",
                e
            );
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_forced_combination_state(
    storage_files: State<'_, StorageFiles>,
) -> Result<ForcedCombinationsBySets, String> {
    tracing::debug!("[ForcedCombination] Loading forced combination state");

    match load_storage(&storage_files.forced_combination).await {
        Ok(Some(data)) => {
            tracing::debug!("[ForcedCombination] Successfully loaded forced combination config");
            Ok(data)
        }
        Ok(_none) => {
            tracing::info!(
                "[ForcedCombination] No forced combination config found, using defaults"
            );
            Ok(ForcedCombinationsBySets::default())
        }
        Err(e) => {
            tracing::error!(
                "[ForcedCombination] Failed to load forced combination config: {}",
                e
            );
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn save_forced_combination_state(
    state: ForcedCombinationsBySets,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!("[ForcedCombination] Saving forced combination state");

    match save_storage(&storage_files.forced_combination, &state).await {
        Ok(_) => {
            tracing::info!("[ForcedCombination] Successfully saved forced combination state");
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!(
                "[ForcedCombination] Failed to save forced combination state: {}",
                e
            );
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_image_setup_state(
    storage_files: State<'_, StorageFiles>,
) -> Result<ImageSetupState, String> {
    tracing::debug!("[ImageSetup] Loading image setup state");

    let project_state = match load_projectsetup_state(storage_files.clone()).await {
        Ok(state) => {
            tracing::debug!("[ImageSetup] Successfully loaded project setup state");
            state
        }
        Err(e) => {
            tracing::warn!(
                "[ImageSetup] Failed to load project setup state, using defaults: {}",
                e
            );
            None
        }
    };

    let is_animated_collection = project_state
        .map(|state| state.is_animated_collection)
        .unwrap_or(false);

    tracing::debug!(
        "[ImageSetup] Collection is animated: {}",
        is_animated_collection
    );

    match load_storage::<ImageSetupState>(&storage_files.image_setup).await {
        Ok(Some(config)) => {
            tracing::debug!("[ImageSetup] Successfully loaded existing image setup config");
            let mut default_state = ImageSetupState::default();

            let default_format = if is_animated_collection { "gif" } else { "png" };
            default_state.image_format = default_format.to_string();

            let merged_state = ImageSetupState {
                image_format: if config.image_format.is_empty() {
                    default_format.to_string()
                } else {
                    config.image_format
                },
                base_width: config.base_width,
                base_height: config.base_height,
                final_width: config.final_width,
                final_height: config.final_height,
                fixed_proportion: config.fixed_proportion,
                include_spritesheets: config.include_spritesheets,
                allow_duplicates: config.allow_duplicates,
                shuffle_sets: config.shuffle_sets,
                blockchain: config.blockchain,
                solana_config: config.solana_config.or(default_state.solana_config),
                animation_quality: config.animation_quality.or(default_state.animation_quality),
                resize_config: config.resize_config.or(default_state.resize_config),
            };

            tracing::debug!("[ImageSetup] Successfully merged image setup config with defaults");
            Ok(merged_state)
        }
        Ok(_none) => {
            tracing::info!("[ImageSetup] No image setup config found, using defaults");
            let mut default_state = ImageSetupState::default();
            let default_format = if is_animated_collection { "gif" } else { "png" };
            default_state.image_format = default_format.to_string();
            Ok(default_state)
        }
        Err(e) => {
            tracing::error!("[ImageSetup] Failed to load image setup: {}", e);
            Err(format!("Failed to load image setup: {}", e))
        }
    }
}

#[tauri::command]
pub async fn save_image_setup_state(
    state: ImageSetupState,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!("[ImageSetup] Saving image setup state");

    match save_storage(&storage_files.image_setup, &state).await {
        Ok(_) => {
            tracing::info!("[ImageSetup] Successfully saved image setup state");
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!("[ImageSetup] Failed to save image setup state: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_rarity_config(
    storage_files: State<'_, StorageFiles>,
) -> Result<RarityConfig, String> {
    tracing::debug!("[Rarity] Loading rarity config");

    let config: Option<RarityConfigStorage> = match load_storage(&storage_files.rarity_config).await
    {
        Ok(Some(config)) => {
            tracing::debug!("[Rarity] Successfully loaded existing rarity config");
            Some(config)
        }
        Ok(_none) => {
            tracing::info!("[Rarity] No rarity config found, creating default");
            let default_config = RarityConfigStorage {
                rarity_config_storage: RarityConfig::default(),
            };

            if let Err(e) = save_storage(&storage_files.rarity_config, &default_config).await {
                tracing::error!("[Rarity] Failed to save default config: {}", e);
                return Err(format!("Failed to save default config: {}", e));
            }

            tracing::info!("[Rarity] Successfully created default rarity config");
            Some(default_config)
        }
        Err(e) => {
            tracing::error!("[Rarity] Failed to load rarity config: {}", e);
            return Err(format!("Failed to load rarity config: {}", e));
        }
    };

    let rarity_config = config.map(|c| c.rarity_config_storage).unwrap_or_default();
    tracing::debug!("[Rarity] Successfully retrieved rarity config");
    Ok(rarity_config)
}

#[tauri::command]
pub async fn save_rarity_config(
    config: RarityConfig,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::info!("[Rarity] Saving rarity config");

    let rarity_config = RarityConfigStorage {
        rarity_config_storage: config,
    };

    match save_storage(&storage_files.rarity_config, &rarity_config).await {
        Ok(_) => {
            tracing::info!("[Rarity] Successfully saved rarity config");
            Ok(json!({ "success": true }))
        }
        Err(e) => {
            tracing::error!("[Rarity] Failed to save rarity config: {}", e);
            Err(format!("Failed to save rarity config: {}", e))
        }
    }
}

#[tauri::command]
pub async fn save_global_rarity(
    data: serde_json::Value,
    storage_files: State<'_, StorageFiles>,
) -> Result<(), String> {
    tracing::info!("[GlobalRarity] Saving global rarity data");

    let result = save_storage(&storage_files.global_rarity, &data)
        .await
        .map_err(|e| format!("Failed to save global rarity data: {}", e));

    match &result {
        Ok(_) => tracing::info!(
            "[GlobalRarity] Successfully saved global rarity data to {:?}",
            storage_files.global_rarity
        ),
        Err(e) => tracing::error!("[GlobalRarity] Failed to save global rarity data: {}", e),
    }

    result
}
#[tauri::command]
pub async fn load_global_rarity(
    storage_files: State<'_, StorageFiles>,
) -> Result<Option<serde_json::Value>, String> {
    tracing::debug!("[GlobalRarity] Loading global rarity data");

    if !storage_files.global_rarity.exists() {
        tracing::info!("[GlobalRarity] File does not exist, creating default");
        let default_content = get_default_json_content("global_rarity.json");

        let default_data: serde_json::Value = match serde_json::from_str(&default_content) {
            Ok(data) => data,
            Err(e) => {
                tracing::error!("[GlobalRarity] Failed to parse default content: {}", e);
                return Err(format!(
                    "Failed to parse default global rarity content: {}",
                    e
                ));
            }
        };

        if let Err(e) = save_storage(&storage_files.global_rarity, &default_data).await {
            tracing::error!("[GlobalRarity] Failed to save default data: {}", e);
            return Err(format!("Failed to save default global rarity data: {}", e));
        }

        tracing::info!("[GlobalRarity] Successfully created default global rarity file");
        return Ok(Some(default_data));
    }

    let content = match tokio::fs::read_to_string(&storage_files.global_rarity).await {
        Ok(content) => content,
        Err(e) => {
            tracing::error!("[GlobalRarity] Failed to read file: {}", e);
            return Err(format!("Failed to read global rarity file: {}", e));
        }
    };

    if content.trim().is_empty() {
        tracing::info!("[GlobalRarity] File is empty, creating default");
        let default_content = get_default_json_content("global_rarity.json");

        let default_data: serde_json::Value = match serde_json::from_str(&default_content) {
            Ok(data) => data,
            Err(e) => {
                tracing::error!("[GlobalRarity] Failed to parse default content: {}", e);
                return Err(format!(
                    "Failed to parse default global rarity content: {}",
                    e
                ));
            }
        };

        if let Err(e) = save_storage(&storage_files.global_rarity, &default_data).await {
            tracing::error!("[GlobalRarity] Failed to save default data: {}", e);
            return Err(format!("Failed to save default global rarity data: {}", e));
        }

        tracing::info!("[GlobalRarity] Successfully created default global rarity data");
        return Ok(Some(default_data));
    }

    let data: serde_json::Value = match serde_json::from_str(&content) {
        Ok(data) => data,
        Err(e) => {
            tracing::error!("[GlobalRarity] Failed to parse JSON content: {}", e);
            return Err(format!("Failed to parse global rarity data: {}", e));
        }
    };

    tracing::debug!("[GlobalRarity] Successfully parsed global rarity data");

    Ok(Some(data))
}

#[tauri::command]
pub async fn save_storage_command<T>(
    app_handle: tauri::AppHandle,
    filename: &str,
    data: T,
) -> Result<(), String>
where
    T: Serialize,
{
    tracing::info!("[StorageCommand] Saving data to file: {}", filename);

    let storage_files = app_handle.state::<StorageFiles>();
    let path = match storage_files.get_path_for_filename(filename) {
        Some(path) => {
            tracing::debug!(
                "[StorageCommand] Mapped filename '{}' to path: {:?}",
                filename,
                path
            );
            path
        }
        None => {
            tracing::error!("[StorageCommand] Unknown filename: {}", filename);
            return Err(format!("Unknown file: {}", filename));
        }
    };

    match save_storage(path, &data).await {
        Ok(_) => {
            tracing::info!("[StorageCommand] Successfully saved data to {}", filename);
            Ok(())
        }
        Err(e) => {
            tracing::error!(
                "[StorageCommand] Failed to save data to {}: {}",
                filename,
                e
            );
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn load_storage_command(
    app_handle: tauri::AppHandle,
    filename: &str,
) -> Result<Option<String>, String> {
    tracing::info!("[StorageCommand] Loading data from file: {}", filename);

    let storage_files = app_handle.state::<StorageFiles>();
    let path = match storage_files.get_path_for_filename(filename) {
        Some(path) => {
            tracing::debug!(
                "[StorageCommand] Mapped filename '{}' to path: {:?}",
                filename,
                path
            );
            path
        }
        None => {
            tracing::error!("[StorageCommand] Unknown filename: {}", filename);
            return Err(format!("Unknown file: {}", filename));
        }
    };

    if !path.exists() {
        tracing::info!(
            "[StorageCommand] File does not exist, creating default: {}",
            filename
        );
        let default_content = get_default_json_content(filename);

        let default_value: serde_json::Value = match serde_json::from_str(&default_content) {
            Ok(value) => value,
            Err(e) => {
                tracing::error!(
                    "[StorageCommand] Failed to parse default content for {}: {}",
                    filename,
                    e
                );
                return Err(format!(
                    "Failed to parse default content for {}: {}",
                    filename, e
                ));
            }
        };

        if let Err(e) = save_storage(path, &default_value).await {
            tracing::error!("[StorageCommand] Failed to create file {}: {}", filename, e);
            return Err(format!("Failed to create file {}: {}", filename, e));
        }

        tracing::info!(
            "[StorageCommand] Successfully created default file: {}",
            filename
        );
        return Ok(Some(default_content));
    }

    match tokio::fs::read_to_string(path).await {
        Ok(content) => {
            tracing::debug!("[StorageCommand] Successfully read file: {}", filename);
            Ok(Some(content))
        }
        Err(e) => {
            tracing::error!("[StorageCommand] Failed to read {}: {}", filename, e);
            Err(format!("Failed to read {}: {}", filename, e))
        }
    }
}
