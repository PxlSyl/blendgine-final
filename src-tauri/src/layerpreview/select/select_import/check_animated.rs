use anyhow::Result;
use image::{self, codecs::gif::GifDecoder, AnimationDecoder};
use rayon::prelude::*;
use std::{
    fs::read,
    io::Cursor,
    path::{Path, PathBuf},
};
use tracing;
use walkdir::WalkDir;
use webp_animation::Decoder;

#[tauri::command]
pub async fn check_animated_images(folder_path: String) -> Result<bool, String> {
    tracing::info!("Checking for animated images in folder: {}", folder_path);

    let path = PathBuf::from(&folder_path);
    if !path.exists() {
        let msg = "Folder does not exist".to_string();
        tracing::error!("{}", msg);
        return Err(msg);
    }

    let has_animated = WalkDir::new(&path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_file())
        .par_bridge()
        .any(|entry| {
            let path = entry.path();
            let ext = path
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|s| s.to_ascii_lowercase());

            match ext.as_deref() {
                Some("gif") => check_gif_animated(path).unwrap_or(false),
                Some("webp") => check_webp_animated(path).unwrap_or(false),
                _ => false,
            }
        });

    tracing::info!(
        "Animated images check completed: has_animated={}",
        has_animated
    );
    Ok(has_animated)
}

fn check_gif_animated(path: &Path) -> Result<bool, String> {
    let file_content = read(path).map_err(|e| {
        let msg = format!("Failed to read file: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;

    match GifDecoder::new(Cursor::new(&file_content)) {
        Ok(decoder) => {
            let mut frames = decoder.into_frames();
            Ok(frames.next().is_some() && frames.next().is_some())
        }
        Err(e) => {
            tracing::warn!("Failed to parse GIF file {}: {:?}", path.display(), e);
            Ok(false)
        }
    }
}

fn check_webp_animated(path: &Path) -> Result<bool, String> {
    let file_content = read(path).map_err(|e| {
        let msg = format!("Failed to read file: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;
    match Decoder::new(&file_content) {
        Ok(webp_decoder) => {
            let mut frames = webp_decoder.into_iter();
            Ok(frames.next().is_some() && frames.next().is_some())
        }
        Err(e) => {
            tracing::warn!("Failed to parse WebP file {}: {:?}", path.display(), e);
            Ok(false)
        }
    }
}
