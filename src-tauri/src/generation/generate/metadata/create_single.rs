use crate::types::{NFTTrait, RarityConfig, SolanaMetadataConfig};
use anyhow::Result;
use serde_json::json;
#[derive(Debug, Clone, PartialEq)]
pub enum Blockchain {
    Eth,
    Sol,
}

pub fn generate_metadata(
    traits: &[NFTTrait],
    collection_name: &str,
    collection_description: &str,
    dna: &str,
    blockchain: Blockchain,
    solana_config: Option<&SolanaMetadataConfig>,
    image_format: &str,
    index: u32,
    include_rarity: bool,
    rarity_config: &RarityConfig,
    current_set_id: &str,
) -> Result<serde_json::Value> {
    let filtered_traits: Vec<serde_json::Value> = if include_rarity {
        traits
            .iter()
            .filter(|trait_data| {
                let layer_config = rarity_config.layers.get(&trait_data.trait_type);
                if let Some(config) = layer_config {
                    if let Some(set_config) = config.sets.get(current_set_id) {
                        if set_config.include_in_metadata == Some(false) {
                            return false;
                        }
                    }
                }
                true
            })
            .map(|trait_data| {
                json!({
                    "trait_type": trait_data.trait_type,
                    "value": trait_data.value
                })
            })
            .collect()
    } else {
        traits
            .iter()
            .map(|trait_data| {
                json!({
                    "trait_type": trait_data.trait_type,
                    "value": trait_data.value
                })
            })
            .collect()
    };

    let base_uri = "ipfs://NewUriToReplace//";
    let image_name = format!("{}_{}.{}", collection_name, index + 1, image_format);

    let mut map = serde_json::Map::new();

    map.insert(
        "name".to_string(),
        json!(format!("{} #{}", collection_name, index + 1)),
    );
    map.insert("edition".to_string(), json!(index + 1));
    map.insert(
        "image".to_string(),
        json!(format!("{}{}", base_uri, image_name)),
    );
    map.insert("external_files".to_string(), json!({}));
    map.insert("description".to_string(), json!(collection_description));
    map.insert("date".to_string(), json!(chrono::Utc::now().to_rfc3339()));
    map.insert("dna".to_string(), json!(dna));
    map.insert("attributes".to_string(), json!(filtered_traits));
    map.insert("compiler".to_string(), json!("Blendgine by PxlSylLab"));

    if let Blockchain::Sol = blockchain {
        if let Some(config) = solana_config {
            map.insert("symbol".to_string(), json!(config.symbol));
            map.insert(
                "seller_fee_basis_points".to_string(),
                json!(config.seller_fee_basis_points),
            );
            map.insert("external_url".to_string(), json!(config.external_url));
            map.insert("creators".to_string(), json!(config.creators));
        }
    }

    Ok(serde_json::Value::Object(map))
}
