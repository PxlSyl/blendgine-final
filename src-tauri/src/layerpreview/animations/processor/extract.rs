use image::{self, codecs::gif::GifDecoder, open, AnimationDecoder, DynamicImage, RgbaImage};
use std::{
    io::Cursor,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::fs::{create_dir_all, read_dir, remove_dir_all};
use tracing;
use webp_animation::Decoder;

use crate::ffmpeg_wrapper::FFmpegWrapper;
use crate::filesystem::temp_dir::get_secure_working_dir;

pub fn extract_webp_frames(data: &[u8]) -> Result<Vec<DynamicImage>, String> {
    let decoder = Decoder::new(data).map_err(|e| format!("Decoder error: {:?}", e))?;
    let mut result = Vec::new();

    let (width, height) = decoder.dimensions();

    for frame in decoder.into_iter() {
        let frame_rgba_bytes = frame
            .into_image()
            .map_err(|_| "Failed to convert WebP frame to RGBA bytes".to_string())?;

        let rgba_image = RgbaImage::from_raw(width, height, frame_rgba_bytes.to_vec())
            .ok_or_else(|| "Failed to create RgbaImage from WebP frame data".to_string())?;

        result.push(DynamicImage::ImageRgba8(rgba_image));
    }
    Ok(result)
}

pub fn extract_gif_frames(data: &[u8]) -> Result<Vec<DynamicImage>, String> {
    let decoder = GifDecoder::new(Cursor::new(data))
        .map_err(|e| format!("Failed to create GIF decoder: {}", e))?;
    let frames = decoder
        .into_frames()
        .collect_frames()
        .map_err(|e| format!("Failed to collect GIF frames: {}", e))?;

    let mut frame_images = Vec::new();
    for frame in frames.iter() {
        let dynamic_image = DynamicImage::ImageRgba8(frame.buffer().clone());
        frame_images.push(dynamic_image);
    }
    Ok(frame_images)
}

pub async fn extract_video_frames(video_path: &Path) -> Result<Vec<DynamicImage>, String> {
    let base_temp_dir = get_secure_working_dir()
        .map_err(|e| format!("Failed to get secure working directory: {}", e))?;

    let temp_frames_dir = base_temp_dir.join("video_frames").join(format!(
        "{:?}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis()
    ));

    create_dir_all(&temp_frames_dir)
        .await
        .map_err(|e| format!("Failed to create temp frames directory: {}", e))?;

    let ffmpeg = FFmpegWrapper::new().map_err(|e| format!("Failed to initialize FFmpeg: {}", e))?;

    let _fps = ffmpeg
        .extract_frames(video_path, &temp_frames_dir, None, None, None)
        .map_err(|e| format!("Failed to extract video frames: {}", e))?;

    tracing::info!(
        "🎬 [VIDEO] Frames extracted to {}",
        temp_frames_dir.display()
    );

    let mut frames = Vec::new();
    let mut entries = read_dir(&temp_frames_dir)
        .await
        .map_err(|e| format!("Failed to read frames directory: {}", e))?;

    let mut frame_paths = Vec::new();
    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("png") {
            frame_paths.push(path);
        }
    }

    frame_paths.sort();

    for frame_path in frame_paths {
        let img = open(&frame_path)
            .map_err(|e| format!("Failed to load frame {}: {}", frame_path.display(), e))?;
        frames.push(img);
    }

    let _ = remove_dir_all(&temp_frames_dir).await;

    tracing::info!("🎬 [VIDEO] Extracted {} frames", frames.len());

    if frames.is_empty() {
        return Err("No frames extracted from video".to_string());
    }

    Ok(frames)
}
