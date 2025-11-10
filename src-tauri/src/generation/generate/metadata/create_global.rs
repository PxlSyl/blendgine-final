use std::{fs, path::Path};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::{from_str, to_string_pretty, Value};

#[derive(Debug, Serialize, Deserialize)]
pub struct GlobalMetadata {
    pub name: String,
    pub description: String,
    pub items: Vec<ItemMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemMetadata {
    pub name: String,
    pub edition: u32,
    pub image: String,
    pub external_files: Value,
    pub description: String,
    pub date: String,
    pub dna: String,
    pub attributes: Vec<Attribute>,
    pub compiler: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attribute {
    pub trait_type: String,
    pub value: String,
}

pub fn create_global_metadata(
    metadata_folder: &Path,
    collection_name: &str,
    collection_description: &str,
) -> Result<()> {
    let mut global_metadata = GlobalMetadata {
        name: collection_name.to_string(),
        description: collection_description.to_string(),
        items: Vec::new(),
    };

    let mut metadata_files = Vec::new();
    for entry in fs::read_dir(metadata_folder)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            metadata_files.push(path);
        }
    }

    for file_path in metadata_files {
        if file_path.file_name().unwrap() == "_metadata.json" {
            continue;
        }

        let content = fs::read_to_string(&file_path)?;
        let item_metadata: ItemMetadata = from_str(&content)?;

        if item_metadata.attributes.is_empty() {
            eprintln!(
                "Invalid metadata structure in file {:?}: missing attributes array",
                file_path
            );
            continue;
        }

        global_metadata.items.push(item_metadata);
    }

    global_metadata.items.sort_by(|a, b| {
        let a_num = a
            .name
            .split('#')
            .nth(1)
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(0);
        let b_num = b
            .name
            .split('#')
            .nth(1)
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(0);
        a_num.cmp(&b_num)
    });

    let global_metadata_path = metadata_folder.join("_metadata.json");
    fs::write(global_metadata_path, to_string_pretty(&global_metadata)?)?;

    Ok(())
}
