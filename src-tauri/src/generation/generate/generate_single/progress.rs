use anyhow::Result;
use serde_json::{json, Value};
use std::path::Path;
use tauri::{Emitter, Window};

use crate::{
    generation::generation_main::{ImageInfo, NFTProgressInfo},
    types::NFTTrait,
};

pub fn send_generation_progress(
    traits: &[NFTTrait],
    collection_name: &str,
    image_format: &str,
    index: u32,
    total_to_generate: u32,
    export_folder: &Path,
    window: &Window,
) -> Result<()> {
    let mut traits_obj = json!({});
    for t in traits {
        traits_obj[t.trait_type.clone()] = Value::String(t.value.clone());
    }

    let progress_info = NFTProgressInfo {
        current_count: index + 1,
        total_count: total_to_generate,
        estimated_count: total_to_generate,
        sequence_number: index + 1,
        current_image: ImageInfo {
            path: export_folder
                .join("collection")
                .join("images")
                .join(format!(
                    "{}_{}.{}",
                    collection_name,
                    index + 1,
                    image_format
                ))
                .to_string_lossy()
                .to_string(),
            name: format!("{} #{}.{}", collection_name, index + 1, image_format),
            traits: traits_obj,
        },
    };

    let _ = window.emit("nft-generation-progress", progress_info);
    Ok(())
}
