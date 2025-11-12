use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use anyhow::Result;
use csv::Writer;
use rust_xlsxwriter::Workbook;
use serde::{Deserialize, Serialize};
use serde_json::{from_str, Value};

use crate::types::RarityConfig;

#[derive(Debug, Serialize, Deserialize)]
struct RarityData {
    layer: String,
    trait_name: String,
    defined_rarity: String,
    effective_rarity: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ImageRarity {
    image: String,
    rarity_score: String,
    traits: String,
    rank: Option<usize>,
}

pub fn create_rarity_files(
    metadata_folder: &Path,
    collection_info_folder: &str,
    nft_count: usize,
    rarity_config: &RarityConfig,
) -> Result<()> {
    let traits_rarity_folder = PathBuf::from(collection_info_folder).join("traits rarity");
    let _ = fs::create_dir_all(&traits_rarity_folder)?;

    let csv_path = traits_rarity_folder.join("rarity.csv");
    let xlsx_path = traits_rarity_folder.join("rarity.xlsx");

    let mut all_traits: HashMap<String, HashMap<String, usize>> = HashMap::new();

    for entry in fs::read_dir(metadata_folder)? {
        let entry = entry?;
        let path = entry.path();
        if path.file_name().unwrap() == "_metadata.json" {
            continue;
        }

        let content = fs::read_to_string(&path)?;
        let metadata: serde_json::Value = serde_json::from_str(&content)?;

        if let Some(attributes) = metadata.get("attributes").and_then(|a| a.as_array()) {
            for attribute in attributes {
                if let (Some(trait_type), Some(value)) = (
                    attribute.get("trait_type").and_then(|t| t.as_str()),
                    attribute.get("value").and_then(|v| v.as_str()),
                ) {
                    let trait_counts = all_traits
                        .entry(trait_type.to_string())
                        .or_insert_with(HashMap::new);
                    *trait_counts.entry(value.to_string()).or_insert(0) += 1;
                }
            }
        }
    }

    let mut data: Vec<RarityData> = Vec::new();

    for (layer_name, layer_traits) in &all_traits {
        for (trait_name, count) in layer_traits {
            let effective_rarity = (*count as f64 / nft_count as f64) * 100.0;

            let mut defined_rarity_total = 0.0;
            let mut active_set_count = 0;

            if let Some(layer_config) = rarity_config.layers.get(layer_name) {
                if let Some(trait_config) = layer_config.traits.get(trait_name) {
                    for (set_name, set_config) in &trait_config.sets {
                        if layer_config.sets.get(set_name).map_or(false, |s| s.active) {
                            defined_rarity_total += set_config.value as f64;
                            active_set_count += 1;
                        }
                    }
                }
            }

            let defined_rarity = if active_set_count > 0 {
                defined_rarity_total / active_set_count as f64
            } else {
                0.0
            };

            data.push(RarityData {
                layer: layer_name.clone(),
                trait_name: trait_name.clone(),
                defined_rarity: format!("{:.2}", defined_rarity),
                effective_rarity: format!("{:.2}", effective_rarity),
            });
        }
    }

    data.sort_by(|a, b| {
        if a.layer != b.layer {
            a.layer.cmp(&b.layer)
        } else {
            a.effective_rarity
                .parse::<f64>()
                .unwrap_or(0.0)
                .partial_cmp(&b.effective_rarity.parse::<f64>().unwrap_or(0.0))
                .unwrap_or(std::cmp::Ordering::Equal)
        }
    });

    let possible_combinations = all_traits
        .values()
        .map(|traits| traits.len())
        .product::<usize>();

    data.push(RarityData {
        layer: String::new(),
        trait_name: String::new(),
        defined_rarity: String::new(),
        effective_rarity: String::new(),
    });
    data.push(RarityData {
        layer: "Possible Combinations".to_string(),
        trait_name: possible_combinations.to_string(),
        defined_rarity: String::new(),
        effective_rarity: String::new(),
    });

    let mut writer = Writer::from_path(csv_path)?;
    let _ = writer.write_record(&[
        "Layer",
        "Trait",
        "Defined Rarity (%)",
        "Effective Rarity (%)",
    ])?;
    for record in &data {
        let _ = writer.write_record(&[
            &record.layer,
            &record.trait_name,
            &record.defined_rarity,
            &record.effective_rarity,
        ])?;
    }
    let _ = writer.flush()?;

    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();
    let _ = sheet.set_name("Rarity");

    let _ = sheet.write_string(0, 0, "Layer");
    let _ = sheet.write_string(0, 1, "Trait");
    let _ = sheet.write_string(0, 2, "Defined Rarity (%)");
    let _ = sheet.write_string(0, 3, "Effective Rarity (%)");

    for (row, record) in data.iter().enumerate() {
        let row = (row + 1) as u32;
        let _ = sheet.write_string(row, 0, &record.layer);
        let _ = sheet.write_string(row, 1, &record.trait_name);
        let _ = sheet.write_string(row, 2, &record.defined_rarity);
        let _ = sheet.write_string(row, 3, &record.effective_rarity);
    }

    let _ = workbook.save(xlsx_path)?;

    Ok(())
}

pub fn calculate_image_rarity(
    metadata_folder: &Path,
    collection_info_folder: &str,
    nft_count: usize,
) -> Result<()> {
    let image_rarity_folder = PathBuf::from(collection_info_folder).join("images rarity");
    fs::create_dir_all(&image_rarity_folder)?;

    let csv_path = image_rarity_folder.join("image_rarity.csv");
    let xlsx_path = image_rarity_folder.join("image_rarity.xlsx");

    let mut all_traits: HashMap<String, HashMap<String, usize>> = HashMap::new();
    let mut image_rarities: Vec<ImageRarity> = Vec::new();

    for entry in fs::read_dir(metadata_folder)? {
        let entry = entry?;
        let path = entry.path();
        if path.file_name().unwrap() == "_metadata.json" {
            continue;
        }

        let content = fs::read_to_string(&path)?;
        let metadata: Value = from_str(&content)?;

        if let Some(attributes) = metadata.get("attributes").and_then(|a| a.as_array()) {
            for attribute in attributes {
                if let (Some(trait_type), Some(value)) = (
                    attribute.get("trait_type").and_then(|t| t.as_str()),
                    attribute.get("value").and_then(|v| v.as_str()),
                ) {
                    let trait_counts = all_traits
                        .entry(trait_type.to_string())
                        .or_insert_with(HashMap::new);
                    *trait_counts.entry(value.to_string()).or_insert(0) += 1;
                }
            }
        }
    }

    for entry in fs::read_dir(metadata_folder)? {
        let entry = entry?;
        let path = entry.path();
        if path.file_name().unwrap() == "_metadata.json" {
            continue;
        }

        let content = fs::read_to_string(&path)?;
        let metadata: Value = from_str(&content)?;

        if let (Some(image), Some(attributes)) = (
            metadata.get("image").and_then(|i| i.as_str()),
            metadata.get("attributes").and_then(|a| a.as_array()),
        ) {
            let mut rarity_score = 0.0;
            let mut traits_list = Vec::new();

            for attribute in attributes {
                if let (Some(trait_type), Some(value)) = (
                    attribute.get("trait_type").and_then(|t| t.as_str()),
                    attribute.get("value").and_then(|v| v.as_str()),
                ) {
                    if let Some(count) = all_traits
                        .get(trait_type)
                        .and_then(|traits| traits.get(value))
                    {
                        let trait_rarity = *count as f64 / nft_count as f64;
                        rarity_score += 1.0 / trait_rarity;
                    }
                    traits_list.push(format!("{}: {}", trait_type, value));
                }
            }

            image_rarities.push(ImageRarity {
                image: image.to_string(),
                rarity_score: format!("{:.2}", rarity_score),
                traits: traits_list.join(", "),
                rank: None,
            });
        }
    }

    image_rarities.sort_by(|a, b| {
        b.rarity_score
            .parse::<f64>()
            .unwrap_or(0.0)
            .partial_cmp(&a.rarity_score.parse::<f64>().unwrap_or(0.0))
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    for (index, item) in image_rarities.iter_mut().enumerate() {
        item.rank = Some(index + 1);
    }

    let mut writer = Writer::from_path(csv_path)?;
    writer.write_record(&["Rank", "Image", "Rarity Score", "Traits"])?;
    for record in &image_rarities {
        writer.write_record(&[
            &record.rank.map_or(String::new(), |r| r.to_string()),
            &record.image,
            &record.rarity_score,
            &record.traits,
        ])?;
    }
    writer.flush()?;

    let mut workbook = Workbook::new();
    let sheet = workbook.add_worksheet();
    let _ = sheet.set_name("Image Rarity");

    let _ = sheet.write_string(0, 0, "Rank");
    let _ = sheet.write_string(0, 1, "Image");
    let _ = sheet.write_string(0, 2, "Rarity Score");
    let _ = sheet.write_string(0, 3, "Traits");

    for (row, record) in image_rarities.iter().enumerate() {
        let row = (row + 1) as u32; // Start from row 1 (after header)
        let _ = sheet.write_number(row, 0, record.rank.unwrap_or(0) as f64);
        let _ = sheet.write_string(row, 1, &record.image);
        let _ = sheet.write_string(row, 2, &record.rarity_score);
        let _ = sheet.write_string(row, 3, &record.traits);
    }

    let _ = workbook.save(xlsx_path)?;

    Ok(())
}
