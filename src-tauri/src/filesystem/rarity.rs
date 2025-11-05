use crate::{
    filesystem::{constants::StorageFiles, storage::save_storage},
    types::{GlobalRarityInput, RarityConfig},
};
use serde_json::json;
use tauri::State;
use tracing;

use super::persist::{load_global_rarity, load_rarity_config};

#[tauri::command]
pub async fn validate_rarity_config(config: RarityConfig) -> Result<serde_json::Value, String> {
    tracing::debug!(
        "[Rarity] Starting rarity config validation with {} layers",
        config.layers.len()
    );

    for (layer_name, layer_config) in config.layers.iter() {
        tracing::trace!(
            "[Rarity] Validating layer: {} with {} traits",
            layer_name,
            layer_config.traits.len()
        );

        let all_sets: std::collections::HashSet<String> = layer_config
            .traits
            .iter()
            .flat_map(|(_, t)| t.sets.keys().cloned())
            .collect();

        tracing::debug!(
            "[Rarity] Layer '{}' has {} unique sets",
            layer_name,
            all_sets.len()
        );

        for set_id in all_sets {
            if let Some(layer_set) = layer_config.sets.get(&set_id) {
                if !layer_set.active {
                    tracing::trace!(
                        "[Rarity] Set '{}' in layer '{}' is inactive, skipping",
                        set_id,
                        layer_name
                    );
                    continue;
                }

                let total: f32 = layer_config
                    .traits
                    .iter()
                    .filter_map(|(_trait_name, t)| {
                        t.sets.get(&set_id).filter(|s| s.enabled).map(|s| s.value)
                    })
                    .sum();

                tracing::debug!(
                    "[Rarity] Layer '{}' set '{}' total rarity: {}%",
                    layer_name,
                    set_id,
                    total
                );

                if (total - 100.0).abs() > 0.001 {
                    tracing::warn!(
                        "[Rarity] Validation failed: Layer '{}' set '{}' total rarity {}% != 100%",
                        layer_name,
                        set_id,
                        total
                    );
                    return Ok(json!({
                        "valid": false,
                        "message": format!("Total rarity for layer '{}' in set '{}' must be 100%, got {}%", layer_name, set_id, total)
                    }));
                }
            }
        }
    }

    tracing::info!("[Rarity] Rarity config validation completed successfully");
    Ok(json!({ "valid": true }))
}

#[tauri::command]
pub async fn update_global_rarity_from_config(
    input: GlobalRarityInput,
    storage_files: State<'_, StorageFiles>,
) -> Result<(), String> {
    tracing::info!(
        "[Rarity] Starting global rarity update from config with {} layers",
        input.rarity_config.layers.len()
    );

    let mut global_rarity_data = serde_json::Map::new();

    let total_collection_nfts: u32 = input.sets.values().map(|set_info| set_info.nft_count).sum();
    tracing::debug!("[Rarity] Total collection NFTs: {}", total_collection_nfts);

    for (layer_name, layer_config) in input.rarity_config.layers.iter() {
        tracing::debug!(
            "[Rarity] Processing layer: {} with {} traits",
            layer_name,
            layer_config.traits.len()
        );
        let mut layer_traits = Vec::new();

        for (trait_name, trait_config) in layer_config.traits.iter() {
            tracing::trace!(
                "[Rarity] Processing trait: {} in layer: {}",
                trait_name,
                layer_name
            );

            let mut weighted_rarity_sum = 0.0;

            for (set_id, set_info) in input.sets.iter() {
                let nft_count = set_info.nft_count;
                if nft_count == 0 {
                    continue;
                }

                if let Some(trait_set) = trait_config.sets.get(set_id) {
                    if trait_set.enabled {
                        let set_weight = nft_count as f64 / total_collection_nfts as f64;
                        weighted_rarity_sum += trait_set.value as f64 * set_weight;

                        tracing::trace!(
                            "[Rarity] Set '{}' weight: {:.4}, rarity: {:.2}, contribution: {:.4}",
                            set_id,
                            set_weight,
                            trait_set.value,
                            trait_set.value as f64 * set_weight
                        );
                    }
                }
            }

            tracing::debug!(
                "[Rarity] Layer '{}' trait '{}' final weighted rarity: {:.4}",
                layer_name,
                trait_name,
                weighted_rarity_sum
            );

            layer_traits.push(serde_json::json!({
                "traitName": trait_name,
                "rarity": weighted_rarity_sum
            }));
        }

        layer_traits.sort_by(|a, b| {
            let rarity_a = a["rarity"].as_f64().unwrap_or(0.0);
            let rarity_b = b["rarity"].as_f64().unwrap_or(0.0);
            rarity_b
                .partial_cmp(&rarity_a)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        tracing::debug!(
            "[Rarity] Layer '{}' sorted {} traits by rarity",
            layer_name,
            layer_traits.len()
        );
        global_rarity_data.insert(layer_name.clone(), serde_json::Value::Array(layer_traits));
    }

    tracing::debug!(
        "[Rarity] Saving rarity data with {} layers",
        global_rarity_data.len()
    );

    match save_storage(&storage_files.global_rarity, &global_rarity_data).await {
        Ok(_) => {
            tracing::info!("[Rarity] Successfully saved rarity data");
        }
        Err(e) => {
            tracing::error!("[Rarity] Failed to save rarity data: {}", e);
            return Err(format!("Failed to save rarity data: {}", e));
        }
    }

    tracing::info!("[Rarity] Rarity update completed successfully");
    Ok(())
}

#[tauri::command]
pub async fn get_rarity_data(
    layer_name: String,
    trait_name: String,
    set_id: String,
    storage_files: State<'_, StorageFiles>,
) -> Result<serde_json::Value, String> {
    tracing::debug!(
        "[Rarity] Getting rarity data for layer: {}, trait: {}, set: {}",
        layer_name,
        trait_name,
        set_id
    );

    let rarity_config = match load_rarity_config(storage_files.clone()).await {
        Ok(config) => {
            tracing::debug!("[Rarity] Successfully loaded rarity config");
            config
        }
        Err(e) => {
            tracing::error!("[Rarity] Failed to load rarity config: {}", e);
            return Err(e);
        }
    };

    let global_rarity_data = match load_global_rarity(storage_files).await {
        Ok(data) => {
            tracing::debug!("[Rarity] Successfully loaded global rarity data");
            data
        }
        Err(e) => {
            tracing::error!("[Rarity] Failed to load global rarity data: {}", e);
            return Err(e);
        }
    };

    let rarity = if let Some(layer_data) = rarity_config.layers.get(&layer_name) {
        if let Some(trait_data) = layer_data.traits.get(&trait_name) {
            if let Some(set_data) = trait_data.sets.get(&set_id) {
                tracing::debug!(
                    "[Rarity] Found rarity value: {} for layer: {}, trait: {}, set: {}",
                    set_data.value,
                    layer_name,
                    trait_name,
                    set_id
                );
                set_data.value
            } else {
                tracing::debug!(
                    "[Rarity] Set '{}' not found for trait '{}' in layer '{}'",
                    set_id,
                    trait_name,
                    layer_name
                );
                0.0
            }
        } else {
            tracing::debug!(
                "[Rarity] Trait '{}' not found in layer '{}'",
                trait_name,
                layer_name
            );
            0.0
        }
    } else {
        tracing::debug!("[Rarity] Layer '{}' not found in rarity config", layer_name);
        0.0
    };

    let global_rarity = if let Some(global_data) = global_rarity_data {
        if let Some(layer_data) = global_data
            .get(&layer_name)
            .and_then(|data| data.as_array())
        {
            if let Some(trait_data) = layer_data.iter().find(|t| {
                t.get("traitName")
                    .and_then(|name| name.as_str())
                    .map_or(false, |name| name == trait_name)
            }) {
                let global_rarity_value = trait_data
                    .get("rarity")
                    .and_then(|r| r.as_f64())
                    .unwrap_or(0.0);
                tracing::debug!(
                    "[Rarity] Found global rarity: {} for layer: {}, trait: {}",
                    global_rarity_value,
                    layer_name,
                    trait_name
                );
                global_rarity_value
            } else {
                tracing::debug!(
                    "[Rarity] Trait '{}' not found in global rarity data for layer '{}'",
                    trait_name,
                    layer_name
                );
                0.0
            }
        } else {
            tracing::debug!(
                "[Rarity] Layer '{}' not found in global rarity data",
                layer_name
            );
            0.0
        }
    } else {
        tracing::debug!("[Rarity] No global rarity data available");
        0.0
    };

    tracing::info!(
        "[Rarity] Returning rarity data - rarity: {}, globalRarity: {}",
        rarity,
        global_rarity
    );

    Ok(json!({
        "rarity": rarity,
        "globalRarity": global_rarity
    }))
}
