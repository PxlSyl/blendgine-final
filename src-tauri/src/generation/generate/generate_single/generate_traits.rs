use std::{
    collections::{HashMap, HashSet},
    path::Path,
};

use anyhow::Result;

use crate::generation::generate::{
    layers::handle_files::handle_layer_files,
    layers::traits_selection::{
        check_compatibility, handle_forced_combinations, select_random_with_rarity,
    },
    layers::unicity::{generate_dna, is_unique_combination},
};
use crate::{
    generation::generate::generate::GlobalGenerationCaches,
    types::{ForcedCombinations, NFTTrait, RarityConfig},
};

const MAX_ATTEMPTS: u32 = 1000;

pub fn generate_traits_and_validate(
    input_folder: &Path,
    active_layer_order: &[String],
    rarity_config: &RarityConfig,
    incompatibility_map: &HashMap<String, HashSet<String>>,
    forced_combinations: &ForcedCombinations,
    allow_duplicates: bool,
    current_set_id: &str,
    is_animated_collection: bool,
    working_folder: Option<&Path>,
    global_caches: &GlobalGenerationCaches,
) -> Result<(Vec<NFTTrait>, String)> {
    let mut traits = Vec::new();
    let mut attempts = 0;
    let mut is_valid = false;
    let mut dna = String::new();

    while attempts < MAX_ATTEMPTS {
        attempts += 1;
        is_valid = true;
        traits.clear();

        for layer in active_layer_order {
            let layer_path = input_folder.join(layer);

            let (layer_files, adjusted_probabilities) = handle_layer_files(
                layer,
                &layer_path,
                rarity_config,
                forced_combinations,
                &traits,
                current_set_id,
                is_animated_collection,
                working_folder,
                global_caches,
            )?;

            if layer_files.is_empty() {
                is_valid = false;
                break;
            }

            let selected_file = select_random_with_rarity(
                &layer_files,
                current_set_id,
                &adjusted_probabilities,
                layer,
                global_caches,
            );

            if selected_file.is_none() {
                is_valid = false;
                break;
            }

            let trait_name = if is_animated_collection {
                selected_file.unwrap()
            } else {
                Path::new(&selected_file.unwrap())
                    .file_stem()
                    .unwrap()
                    .to_string_lossy()
                    .into_owned()
            };

            if !check_compatibility(incompatibility_map, &trait_name, &traits) {
                is_valid = false;
                break;
            }

            if !handle_forced_combinations(
                layer,
                &trait_name,
                forced_combinations,
                &traits,
                active_layer_order,
                rarity_config,
                current_set_id,
                global_caches,
            ) {
                is_valid = false;
                break;
            }

            traits.push(NFTTrait {
                trait_type: layer.to_string(),
                value: trait_name,
            });
        }

        if !is_valid {
            continue;
        }

        dna = generate_dna(&traits, rarity_config, current_set_id, active_layer_order);

        if !allow_duplicates {
            let is_unique = global_caches
                .uniqueness_cache
                .entry(dna.clone())
                .or_insert_with(|| {
                    is_unique_combination(
                        &traits,
                        rarity_config,
                        current_set_id,
                        active_layer_order,
                    )
                });

            if !*is_unique {
                is_valid = false;
                continue;
            }
        }

        break;
    }

    if !is_valid {
        return Err(anyhow::anyhow!(
            "Failed to generate valid NFT after {} attempts",
            MAX_ATTEMPTS
        ));
    }

    Ok((traits, dna))
}
