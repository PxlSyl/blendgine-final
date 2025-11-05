use crate::{
    generation::generate::generate::GlobalGenerationCaches,
    types::{ForcedCombinations, Incompatibilities, NFTTrait, RarityConfig},
};
use rand::prelude::*;
use std::collections::{HashMap, HashSet};

pub fn precompute_incompatibilities(
    incompatibilities: &Incompatibilities,
) -> HashMap<String, HashSet<String>> {
    let mut incompatibility_map = HashMap::new();

    for (_layer, layer_incompatibilities) in incompatibilities.incompatibilities.iter() {
        if let Some(traits_map) = layer_incompatibilities.get("traits") {
            for (trait_name, incompatible_layers) in traits_map.iter() {
                for incompatible_layer in incompatible_layers {
                    incompatibility_map
                        .entry(trait_name.clone())
                        .or_insert_with(HashSet::new)
                        .insert(incompatible_layer.clone());
                }
            }
        }
    }

    incompatibility_map
}

pub fn check_compatibility(
    incompatibility_map: &HashMap<String, HashSet<String>>,
    trait_name: &str,
    existing_traits: &[NFTTrait],
) -> bool {
    if let Some(incompatible_layers) = incompatibility_map.get(trait_name) {
        for existing_trait in existing_traits {
            if incompatible_layers.contains(&existing_trait.trait_type) {
                return false;
            }
        }
    }
    true
}

pub fn handle_forced_combinations(
    current_layer: &str,
    selected_trait: &str,
    forced_combinations: &ForcedCombinations,
    traits: &[NFTTrait],
    layer_order: &[String],
    rarity_config: &RarityConfig,
    set_id: &str,
    global_caches: &GlobalGenerationCaches,
) -> bool {
    let current_layer_index = layer_order
        .iter()
        .position(|l| l == current_layer)
        .unwrap_or(0);
    let is_current_layer_active = global_caches
        .rarity_probability_cache
        .get(current_layer)
        .and_then(|layer_cache| layer_cache.get(set_id))
        .unwrap_or(&false);

    if !is_current_layer_active {
        return true;
    }

    if rarity_config
        .layers
        .get(current_layer)
        .and_then(|l| l.traits.get(selected_trait))
        .and_then(|t| t.sets.get(set_id))
        .map_or(false, |s| !s.enabled)
    {
        return true;
    }

    for i in 0..current_layer_index {
        let lower_layer = &layer_order[i];
        let lower_trait = traits
            .iter()
            .find(|t| t.trait_type == *lower_layer)
            .map(|t| t.value.clone());

        if let Some(lower_trait) = lower_trait {
            let is_lower_layer_active = global_caches
                .rarity_probability_cache
                .get(lower_layer)
                .and_then(|layer_cache| layer_cache.get(set_id))
                .unwrap_or(&false);

            if !is_lower_layer_active {
                continue;
            }

            if rarity_config
                .layers
                .get(lower_layer)
                .and_then(|l| l.traits.get(&lower_trait))
                .and_then(|t| t.sets.get(set_id))
                .map_or(false, |s| !s.enabled)
            {
                continue;
            }

            if let Some(forced_traits) = forced_combinations
                .forced_combinations
                .get(lower_layer)
                .and_then(|t| t.get(&lower_trait))
                .and_then(|l| l.get(current_layer))
            {
                let available_forced_traits: Vec<_> = forced_traits
                    .iter()
                    .filter(|&trait_name| {
                        rarity_config
                            .layers
                            .get(current_layer)
                            .and_then(|l| l.traits.get(trait_name))
                            .and_then(|t| t.sets.get(set_id))
                            .map_or(true, |s| s.enabled)
                    })
                    .collect();

                if !available_forced_traits.is_empty() {
                    if available_forced_traits.contains(&&selected_trait.to_string()) {
                        return true;
                    } else if check_equal_percentages(
                        lower_layer,
                        &lower_trait,
                        current_layer,
                        selected_trait,
                        rarity_config,
                        set_id,
                        global_caches,
                    ) {
                        return false;
                    }
                }
            }
        }
    }

    if let Some(forced_combos) = forced_combinations
        .forced_combinations
        .get(current_layer)
        .and_then(|t| t.get(selected_trait))
    {
        for (forced_layer, forced_traits) in forced_combos {
            let is_forced_layer_active = global_caches
                .rarity_probability_cache
                .get(forced_layer)
                .and_then(|layer_cache| layer_cache.get(set_id))
                .unwrap_or(&false);

            if !is_forced_layer_active {
                continue;
            }

            if let Some(forced_layer_index) = layer_order.iter().position(|l| l == forced_layer) {
                if forced_layer_index < current_layer_index {
                    let existing_trait = traits
                        .iter()
                        .find(|t| t.trait_type == *forced_layer)
                        .map(|t| t.value.clone());

                    let available_forced_traits: Vec<_> = forced_traits
                        .iter()
                        .filter(|&trait_name| {
                            rarity_config
                                .layers
                                .get(forced_layer)
                                .and_then(|l| l.traits.get(trait_name))
                                .and_then(|t| t.sets.get(set_id))
                                .map_or(true, |s| s.enabled)
                        })
                        .collect();

                    if !available_forced_traits.is_empty() {
                        if existing_trait.is_none()
                            || !available_forced_traits.contains(&&existing_trait.unwrap())
                        {
                            return false;
                        }
                    }
                }
            }
        }
    }

    true
}

pub fn calculate_adjusted_probabilities(
    layer: &str,
    rarity_config: &RarityConfig,
    forced_combinations: &ForcedCombinations,
    traits: &[NFTTrait],
    set_id: &str,
    global_caches: &GlobalGenerationCaches,
) -> HashMap<String, f64> {
    let layer_config = rarity_config.layers.get(layer);
    if layer_config.is_none() {
        return HashMap::new();
    }

    let is_layer_active = global_caches
        .rarity_probability_cache
        .get(layer)
        .and_then(|layer_cache| layer_cache.get(set_id))
        .unwrap_or(&false);

    if !is_layer_active {
        return HashMap::new();
    }

    let mut adjusted_probabilities = HashMap::new();
    let enabled_traits: Vec<_> = layer_config
        .unwrap()
        .traits
        .iter()
        .filter(|(_, config)| config.sets.get(set_id).map_or(true, |s| s.enabled))
        .collect();

    let enabled_traits_clone = enabled_traits.clone();

    for (trait_name, config) in enabled_traits {
        if let Some(value) = config.sets.get(set_id).map(|s| s.value) {
            adjusted_probabilities.insert(trait_name.clone(), value as f64);
        }
    }

    for (forcing_layer, forcing_traits) in &forced_combinations.forced_combinations {
        let is_forcing_layer_active = global_caches
            .rarity_probability_cache
            .get(forcing_layer)
            .and_then(|layer_cache| layer_cache.get(set_id))
            .unwrap_or(&false);

        if !is_forcing_layer_active {
            continue;
        }

        if let Some(forcing_trait) = traits
            .iter()
            .find(|t| t.trait_type == *forcing_layer)
            .map(|t| t.value.clone())
        {
            if let Some(forced_traits) = forcing_traits
                .get(&forcing_trait)
                .and_then(|l| l.get(layer))
            {
                let available_forced_traits: Vec<_> = forced_traits
                    .iter()
                    .filter(|&trait_name| {
                        rarity_config
                            .layers
                            .get(layer)
                            .and_then(|l| l.traits.get(trait_name))
                            .and_then(|t| t.sets.get(set_id))
                            .map_or(true, |s| s.enabled)
                    })
                    .collect();

                if !available_forced_traits.is_empty() {
                    for trait_name in adjusted_probabilities.keys().cloned().collect::<Vec<_>>() {
                        if available_forced_traits.contains(&&trait_name) {
                            *adjusted_probabilities.get_mut(&trait_name).unwrap() *= 2.0;
                        } else {
                            *adjusted_probabilities.get_mut(&trait_name).unwrap() *= 0.5;
                        }
                    }
                }
            }
        }
    }

    let total_probability: f64 = adjusted_probabilities.values().sum();
    if total_probability > 0.0 {
        for probability in adjusted_probabilities.values_mut() {
            *probability /= total_probability;
        }
    }

    if forced_combinations.forced_combinations.is_empty() || total_probability == 0.0 {
        let active_total_probability: f64 = enabled_traits_clone
            .iter()
            .map(|(_, config)| config.sets.get(set_id).map_or(0.0, |s| s.value as f64))
            .sum();

        if active_total_probability > 0.0 {
            return enabled_traits_clone
                .iter()
                .map(|(trait_name, config)| {
                    let value = config.sets.get(set_id).map_or(0.0, |s| s.value as f64);
                    (trait_name.to_string(), value / active_total_probability)
                })
                .collect();
        }
    }

    adjusted_probabilities
}

pub fn check_equal_percentages(
    layer1: &str,
    trait1: &str,
    layer2: &str,
    trait2: &str,
    rarity_config: &RarityConfig,
    set_id: &str,
    global_caches: &GlobalGenerationCaches,
) -> bool {
    let is_layer1_active = global_caches
        .rarity_probability_cache
        .get(layer1)
        .and_then(|layer_cache| layer_cache.get(set_id))
        .unwrap_or(&false);

    let is_layer2_active = global_caches
        .rarity_probability_cache
        .get(layer2)
        .and_then(|layer_cache| layer_cache.get(set_id))
        .unwrap_or(&false);

    if !is_layer1_active || !is_layer2_active {
        return false;
    }

    let percentage1 = rarity_config
        .layers
        .get(layer1)
        .and_then(|l| l.traits.get(trait1))
        .and_then(|t| t.sets.get(set_id))
        .map_or(0.0, |s| s.value as f64);

    let percentage2 = rarity_config
        .layers
        .get(layer2)
        .and_then(|l| l.traits.get(trait2))
        .and_then(|t| t.sets.get(set_id))
        .map_or(0.0, |s| s.value as f64);

    (percentage1 - percentage2).abs() < f64::EPSILON
}

pub fn select_random_with_rarity(
    files: &[String],
    set_id: &str,
    adjusted_probabilities: &HashMap<String, f64>,
    layer: &str,
    global_caches: &GlobalGenerationCaches,
) -> Option<String> {
    let is_layer_active = global_caches
        .rarity_probability_cache
        .get(layer)
        .and_then(|layer_cache| layer_cache.get(set_id))
        .unwrap_or(&false);

    if !is_layer_active {
        return None;
    }

    if adjusted_probabilities.is_empty() {
        return None;
    }

    let cache_key = format!("{}_{}", layer, files.len()); // Clé unique par layer + nombre de fichiers
    let file_lookup = global_caches
        .file_lookup_cache
        .entry(cache_key)
        .or_insert_with(|| {
            files
                .iter()
                .filter_map(|f| {
                    if let Some(stem) = std::path::Path::new(f).file_stem() {
                        Some(stem.to_string_lossy().into_owned())
                    } else {
                        Some(f.clone())
                    }
                })
                .collect()
        });

    let mut rng = thread_rng();
    let mut cumulative_probability = 0.0;
    let random_value = rng.gen_range(0.0..1.0);

    for (trait_name, probability) in adjusted_probabilities {
        cumulative_probability += probability;
        if random_value <= cumulative_probability {
            if file_lookup.contains(trait_name) {
                return Some(trait_name.clone());
            }
        }
    }

    if !files.is_empty() {
        let random_index = rng.gen_range(0..files.len());
        return Some(files[random_index].clone());
    }

    None
}
