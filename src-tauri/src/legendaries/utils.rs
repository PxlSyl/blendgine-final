use anyhow::Result;
use rand::seq::SliceRandom;
use std::{
    fs,
    path::{Path, PathBuf},
};

pub async fn find_image_and_metadata_folders(base_folder: &Path) -> Result<(PathBuf, PathBuf)> {
    let mut images_folder = None;
    let mut metadata_folder = None;

    for entry in fs::read_dir(base_folder)? {
        let entry = entry?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        if let Ok(files) = fs::read_dir(&path) {
            if let Some(first_file) = files.filter_map(Result::ok).next() {
                let extension = first_file
                    .path()
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .map(|s| s.to_lowercase());

                match extension {
                    Some(ext)
                        if ["png", "jpg", "jpeg", "webp", "gif", "mp4", "webm"]
                            .contains(&ext.as_str()) =>
                    {
                        images_folder = Some(path.clone());
                    }
                    Some(ext) if ext == "json" => {
                        metadata_folder = Some(path.clone());
                    }
                    _ => continue,
                }
            }
        }
    }

    match (images_folder, metadata_folder) {
        (Some(img), Some(meta)) => Ok((img, meta)),
        _ => Err(anyhow::anyhow!("Could not find image and metadata folders")),
    }
}

pub fn shuffle_array<T>(array: &mut [T]) {
    let mut rng = rand::thread_rng();
    array.shuffle(&mut rng);
}
