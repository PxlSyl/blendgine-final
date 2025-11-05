use anyhow::Result;
use rand::{rngs::StdRng, seq::SliceRandom, SeedableRng};
use serde_json::Value;
use std::{collections::BTreeMap, fs, path::Path};

use crate::types::GenerationResult;

pub fn shuffle_and_rename(
    export_folder: &Path,
    collection_name: &str,
    image_format: &str,
    all_generated_nfts: &mut [GenerationResult],
    include_spritesheets: bool,
) -> Result<()> {
    let mut rng = StdRng::from_entropy();
    all_generated_nfts.shuffle(&mut rng);

    let temp_dir = export_folder.join("temp");
    fs::create_dir_all(&temp_dir)?;

    let collection_path = export_folder.join("collection");
    let images_path = collection_path.join("images");
    let metadata_path = collection_path.join("metadata");
    let sprites_path = collection_path.join("sprites");

    for (i, nft) in all_generated_nfts.iter().enumerate() {
        let new_index = i + 1;

        let old_image = images_path.join(format!(
            "{}_{}.{}",
            collection_name, nft.original_index, image_format
        ));
        let old_metadata =
            metadata_path.join(format!("{}_{}.json", collection_name, nft.original_index));
        let old_sprite =
            sprites_path.join(format!("{}_{}.png", collection_name, nft.original_index));

        let temp_image = temp_dir.join(format!(
            "{}_{}.{}",
            collection_name, new_index, image_format
        ));
        let temp_metadata = temp_dir.join(format!("{}_{}.json", collection_name, new_index));
        let temp_sprite = temp_dir.join(format!("{}_{}_sprite.png", collection_name, new_index));

        if old_image.exists() {
            fs::copy(&old_image, &temp_image)?;
        }
        if old_metadata.exists() {
            fs::copy(&old_metadata, &temp_metadata)?;

            let mut metadata: BTreeMap<String, Value> =
                serde_json::from_str(&fs::read_to_string(&old_metadata)?)?;

            metadata.remove("name");
            metadata.remove("edition");
            metadata.remove("image");
            let external_files = metadata.remove("external_files");

            let symbol = metadata.remove("symbol");
            let seller_fee_basis_points = metadata.remove("sellerFeeBasisPoints");
            let external_url = metadata.remove("externalUrl");
            let creators = metadata.remove("creators");

            metadata.insert(
                "name".to_string(),
                Value::String(format!("{} #{}", collection_name, new_index)),
            );
            metadata.insert("edition".to_string(), Value::Number(new_index.into()));
            metadata.insert(
                "image".to_string(),
                Value::String(format!(
                    "{}_{}.{}",
                    collection_name, new_index, image_format
                )),
            );

            if let Some(Value::Object(mut ext)) = external_files {
                if let Some(sprite_sheet) = ext.get_mut("sprite_sheet") {
                    *sprite_sheet = Value::String(format!(
                        "{}/sprites/{}_{}.png",
                        collection_name, collection_name, new_index
                    ));
                }
                metadata.insert("external_files".to_string(), Value::Object(ext));
            } else if let Some(v) = external_files {
                metadata.insert("external_files".to_string(), v);
            }

            if let Some(v) = symbol {
                metadata.insert("symbol".to_string(), v);
            }
            if let Some(v) = seller_fee_basis_points {
                metadata.insert("sellerFeeBasisPoints".to_string(), v);
            }
            if let Some(v) = external_url {
                metadata.insert("externalUrl".to_string(), v);
            }
            if let Some(v) = creators {
                metadata.insert("creators".to_string(), v);
            }

            fs::write(&temp_metadata, serde_json::to_string_pretty(&metadata)?)?;
        }

        if include_spritesheets && old_sprite.exists() {
            fs::copy(&old_sprite, &temp_sprite)?;
        }
    }

    for nft in all_generated_nfts.iter() {
        let old_image = images_path.join(format!(
            "{}_{}.{}",
            collection_name, nft.original_index, image_format
        ));
        let old_metadata =
            metadata_path.join(format!("{}_{}.json", collection_name, nft.original_index));
        let old_sprite =
            sprites_path.join(format!("{}_{}.png", collection_name, nft.original_index));

        let _ = fs::remove_file(&old_image);
        let _ = fs::remove_file(&old_metadata);
        if include_spritesheets {
            let _ = fs::remove_file(&old_sprite);
        }
    }

    for (i, _) in all_generated_nfts.iter().enumerate() {
        let new_index = i + 1;

        let temp_image = temp_dir.join(format!(
            "{}_{}.{}",
            collection_name, new_index, image_format
        ));
        let temp_metadata = temp_dir.join(format!("{}_{}.json", collection_name, new_index));
        let temp_sprite = temp_dir.join(format!("{}_{}_sprite.png", collection_name, new_index));

        let final_image = images_path.join(format!(
            "{}_{}.{}",
            collection_name, new_index, image_format
        ));
        let final_metadata = metadata_path.join(format!("{}_{}.json", collection_name, new_index));
        let final_sprite = sprites_path.join(format!("{}_{}.png", collection_name, new_index));

        if fs::metadata(&temp_image).is_ok() {
            fs::rename(&temp_image, &final_image)?;
        }
        if fs::metadata(&temp_metadata).is_ok() {
            fs::rename(&temp_metadata, &final_metadata)?;
        }
        if include_spritesheets && fs::metadata(&temp_sprite).is_ok() {
            fs::rename(&temp_sprite, &final_sprite)?;
        }
    }

    fs::remove_dir_all(&temp_dir)?;

    Ok(())
}
