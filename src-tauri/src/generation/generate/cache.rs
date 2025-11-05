use std::{
    path::{Path, PathBuf},
    time::{Duration, Instant},
};

use anyhow::Result;
use dashmap::DashMap;
use once_cell::sync::Lazy;

static LAYER_FILES_CACHE: Lazy<DashMap<String, (Vec<String>, Instant)>> =
    Lazy::new(|| DashMap::new());

static SPRITESHEET_PATHS_CACHE: Lazy<DashMap<String, (Vec<PathBuf>, Instant)>> =
    Lazy::new(|| DashMap::new());

const CACHE_DURATION: Duration = Duration::from_secs(300);

fn is_cache_valid(timestamp: &Instant) -> bool {
    timestamp.elapsed() < CACHE_DURATION
}

pub fn clear_generation_files_caches() {
    LAYER_FILES_CACHE.clear();
    SPRITESHEET_PATHS_CACHE.clear();
}

pub fn get_layer_files_cached(
    layer: &str,
    layer_path: &Path,
    is_animated: bool,
) -> Result<Vec<String>> {
    if let Some(entry) = LAYER_FILES_CACHE.get(layer) {
        let (files, timestamp) = entry.value();
        if is_cache_valid(timestamp) {
            return Ok(files.clone());
        }
    }

    let files = scan_layer_directory(layer_path, is_animated)?;
    LAYER_FILES_CACHE.insert(layer.to_string(), (files.clone(), Instant::now()));

    Ok(files)
}

pub fn get_spritesheet_paths_cached(layer: &str, working_folder: &Path) -> Result<Vec<PathBuf>> {
    let cache_key = format!("{}:{}", layer, working_folder.display());

    if let Some(entry) = SPRITESHEET_PATHS_CACHE.get(&cache_key) {
        let (paths, timestamp) = entry.value();
        if is_cache_valid(timestamp) {
            return Ok(paths.clone());
        }
    }

    let paths = scan_spritesheet_paths(working_folder, layer)?;
    SPRITESHEET_PATHS_CACHE.insert(cache_key, (paths.clone(), Instant::now()));

    Ok(paths)
}

pub fn get_trait_spritesheets_cached(
    layer: &str,
    trait_value: &str,
    working_folder: &Path,
) -> Result<Vec<PathBuf>> {
    let cache_key = format!("{}:{}:{}", layer, trait_value, working_folder.display());

    if let Some(entry) = SPRITESHEET_PATHS_CACHE.get(&cache_key) {
        let (paths, timestamp) = entry.value();
        if is_cache_valid(timestamp) {
            return Ok(paths.clone());
        }
    }

    let trait_folder = working_folder.join(layer).join(trait_value);
    let mut paths = Vec::new();

    if trait_folder.exists() && trait_folder.is_dir() {
        let mut sheet_index = 0;
        loop {
            let spritesheet_path = trait_folder.join(format!("spritesheet_{}.png", sheet_index));

            if spritesheet_path.exists() {
                paths.push(spritesheet_path);
                sheet_index += 1;
            } else {
                break;
            }
        }
    }

    SPRITESHEET_PATHS_CACHE.insert(cache_key, (paths.clone(), Instant::now()));

    Ok(paths)
}

fn scan_layer_directory(layer_path: &Path, is_animated: bool) -> Result<Vec<String>> {
    use walkdir::WalkDir;

    let mut files = Vec::new();

    if is_animated {
        let mut entries = WalkDir::new(layer_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_dir())
            .filter(|e| {
                let spritesheet_path = e.path().join("spritesheet_0.png");
                spritesheet_path.exists()
            });

        while let Some(entry) = entries.next() {
            let dir_name = entry.file_name().to_string_lossy().into_owned();
            files.push(dir_name);
        }
    } else {
        let mut entries = WalkDir::new(layer_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .filter(|e| {
                e.path()
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .map_or(false, |ext| {
                        let ext = ext.to_lowercase();
                        ext == "png" || ext == "webp"
                    })
            });

        while let Some(entry) = entries.next() {
            let file_name = entry.file_name().to_string_lossy().into_owned();
            files.push(file_name);
        }
    }

    Ok(files)
}

fn scan_spritesheet_paths(working_folder: &Path, layer: &str) -> Result<Vec<PathBuf>> {
    use walkdir::WalkDir;

    let search_path = working_folder.join(layer);
    let mut paths = Vec::new();

    let mut entries = WalkDir::new(search_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
        .filter(|e| {
            let spritesheet_path = e.path().join("spritesheet_0.png");
            spritesheet_path.exists()
        });

    while let Some(entry) = entries.next() {
        let trait_folder = entry.path();

        let mut sheet_index = 0;
        loop {
            let spritesheet_path = trait_folder.join(format!("spritesheet_{}.png", sheet_index));

            if spritesheet_path.exists() {
                paths.push(spritesheet_path);
                sheet_index += 1;
            } else {
                break;
            }
        }
    }

    Ok(paths)
}
