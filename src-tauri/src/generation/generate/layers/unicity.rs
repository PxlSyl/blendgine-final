use dashmap::DashMap;
use once_cell::sync::Lazy;
use sha2::{Digest, Sha256};

use crate::types::{NFTTrait, RarityConfig};

static UNIQUE_DNA_SET: Lazy<DashMap<String, ()>> = Lazy::new(|| DashMap::new());

pub fn generate_dna(
    nft_traits: &[NFTTrait],
    rarity_config: &RarityConfig,
    current_set_id: &str,
    active_layer_order: &[String],
) -> String {
    let mut sorted_traits = nft_traits.to_vec();
    sorted_traits.sort_by(|a, b| {
        let a_index = active_layer_order
            .iter()
            .position(|x| x == &a.trait_type)
            .unwrap_or(usize::MAX);
        let b_index = active_layer_order
            .iter()
            .position(|x| x == &b.trait_type)
            .unwrap_or(usize::MAX);
        a_index.cmp(&b_index)
    });

    let dna_string = sorted_traits
        .iter()
        .map(|nft_trait| {
            let trait_rarity = rarity_config
                .layers
                .get(&nft_trait.trait_type)
                .and_then(|layer| layer.traits.get(&nft_trait.value))
                .and_then(|trait_config| trait_config.sets.get(current_set_id))
                .map(|set_config| set_config.value)
                .unwrap_or(0.0);

            format!(
                "{}:{}:{:.2}",
                nft_trait.trait_type, nft_trait.value, trait_rarity
            )
        })
        .collect::<Vec<_>>()
        .join("-");

    let mut hasher = Sha256::new();
    hasher.update(dna_string.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn is_unique_combination(
    nft_traits: &[NFTTrait],
    rarity_config: &RarityConfig,
    current_set_id: &str,
    active_layer_order: &[String],
) -> bool {
    let dna = generate_dna(
        nft_traits,
        rarity_config,
        current_set_id,
        active_layer_order,
    );

    if UNIQUE_DNA_SET.contains_key(&dna) {
        false
    } else {
        UNIQUE_DNA_SET.insert(dna, ());
        true
    }
}
