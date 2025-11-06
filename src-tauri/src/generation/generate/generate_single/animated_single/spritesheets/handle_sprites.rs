use std::{fs::create_dir_all, path::Path};

use anyhow::Result;
use image::DynamicImage;

pub fn handle_spritesheets(
    final_spritesheet: &DynamicImage,
    sprites_path: &Path,
    collection_name: &str,
    index: u32,
) -> Result<Vec<String>> {
    let sprite_sheet_base_path = sprites_path.join((index + 1).to_string());
    create_dir_all(&sprite_sheet_base_path)?;

    let mut spritesheet_paths = Vec::new();
    let sheet_index = 0;

    let output_path = sprite_sheet_base_path.join(format!("spritesheet_{}.png", sheet_index));

    final_spritesheet.save(&output_path)?;

    spritesheet_paths.push(format!(
        "{}/sprites/{}/spritesheet_{}.png",
        collection_name,
        index + 1,
        sheet_index
    ));

    Ok(spritesheet_paths)
}
