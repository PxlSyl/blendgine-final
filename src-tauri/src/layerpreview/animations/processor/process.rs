use image::{self, DynamicImage, ImageReader};
use std::{
    io::Cursor,
    path::{Path, PathBuf},
    sync::atomic::Ordering,
};
use tauri::{AppHandle, Runtime};
use tokio::fs::{create_dir_all, read, read_dir};
use tracing;

use crate::layerpreview::animations::{
    extract_gif_frames, extract_video_frames, extract_webp_frames,
    file_watcher::start_animation_file_watcher, utils::update_global_max_frames, ImageFormat,
    GLOBAL_MAX_FRAMES, RAYON_POOL,
};

pub struct FrameProcessor {
    pub frame_count: u32,
    pub max_frames: u32,
    pub image_path: String,
    pub trait_spritesheet_dir: PathBuf,
}

impl FrameProcessor {
    pub async fn new(
        app_handle: AppHandle<impl Runtime>,
        base_dir: PathBuf,
        layer_name: String,
        image_name: String,
        image_path: String,
        max_frames: u32,
        _should_recreate_spritesheets: bool,
        total_files: u32,
    ) -> Result<Self, String> {
        let trait_spritesheet_dir = base_dir
            .join("spritesheets")
            .join(&layer_name)
            .join(&image_name);
        let general_spritesheets_dir = base_dir.join("spritesheets");

        create_dir_all(&trait_spritesheet_dir).await.map_err(|e| {
            let msg = format!("Failed to create spritesheets directory structure: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

        tracing::info!(
            "Starting animation file watcher for {} total files",
            total_files
        );
        if let Err(e) = start_animation_file_watcher(
            general_spritesheets_dir.clone(),
            app_handle.clone(),
            total_files,
        ) {
            tracing::warn!("Failed to start animation file watcher: {}", e);
        }

        Ok(Self {
            frame_count: 0,
            max_frames,
            image_path,
            trait_spritesheet_dir,
        })
    }

    fn process_frames_result(
        &mut self,
        frames: Vec<DynamicImage>,
    ) -> Result<Vec<DynamicImage>, String> {
        self.frame_count = frames.len() as u32;
        Ok(frames)
    }

    async fn process_by_format(
        &mut self,
        data: &[u8],
        format: ImageFormat,
        file_path: Option<&Path>,
    ) -> Result<Vec<DynamicImage>, String> {
        if format.is_video() {
            let video_path =
                file_path.ok_or_else(|| "Video path required for video format".to_string())?;
            return self.process_video(video_path).await;
        }

        match format {
            ImageFormat::Gif | ImageFormat::WebP => {
                self.process_animated_format(data, format).await
            }
            ImageFormat::Png => self.process_png(data).await,
            _ => Err(format!("Unsupported format: {}", format.as_str())),
        }
    }

    async fn process_animated_format(
        &mut self,
        data: &[u8],
        format: ImageFormat,
    ) -> Result<Vec<DynamicImage>, String> {
        let data_clone = data.to_vec();
        let extract_fn = match format {
            ImageFormat::Gif => extract_gif_frames,
            ImageFormat::WebP => extract_webp_frames,
            _ => {
                return Err(format!(
                    "{} should be processed via appropriate handler",
                    format.as_str()
                ))
            }
        };

        let result = RAYON_POOL.install(|| extract_fn(&data_clone));

        match result {
            Ok(frames) => self.process_frames_result(frames),
            Err(e) => Err(format!("Failed to decode {}: {}", format.as_str(), e)),
        }
    }

    async fn process_video(&mut self, video_path: &Path) -> Result<Vec<DynamicImage>, String> {
        tracing::info!("🎬 [VIDEO] Processing video file: {}", video_path.display());
        let frames = extract_video_frames(video_path).await?;
        self.process_frames_result(frames)
    }

    async fn process_png(&mut self, data: &[u8]) -> Result<Vec<DynamicImage>, String> {
        let img = ImageReader::new(Cursor::new(data))
            .with_guessed_format()
            .map_err(|e| {
                let msg = format!("Failed to create image reader: {}", e);
                tracing::error!("{}", msg);
                msg
            })?
            .decode()
            .map_err(|e| {
                let msg = format!("Failed to decode PNG: {}", e);
                tracing::error!("{}", msg);
                msg
            })?;

        let frame_images = vec![img];
        self.process_frames_result(frame_images)
    }

    async fn process_files(&mut self) -> Result<Vec<DynamicImage>, String> {
        let image_path = PathBuf::from(&self.image_path);

        tracing::info!(
            "Processing animation file directly: {}",
            image_path.display()
        );

        let target_path = if image_path.is_dir() {
            let mut found_image_path = None;

            if let Ok(mut entries) = read_dir(&image_path).await {
                while let Some(entry) = entries.next_entry().await.map_err(|e| {
                    let msg = format!("Failed to read directory entry: {}", e);
                    tracing::error!("{}", msg);
                    msg
                })? {
                    let entry_path = entry.path();
                    if entry_path.is_file() {
                        if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()) {
                            if ImageFormat::from_extension(ext).is_some() {
                                found_image_path = Some(entry_path.clone());
                                break;
                            } else {
                                tracing::debug!("Skipping unsupported extension: {}", ext)
                            }
                        }
                    }
                }
            }

            found_image_path.ok_or_else(|| {
                let msg = "No image files found in directory".to_string();
                tracing::error!("{}", msg);
                msg
            })?
        } else {
            image_path
        };

        let extension = target_path
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        let format = ImageFormat::from_extension(extension).ok_or_else(|| {
            let msg = format!("Unsupported file extension: {}", extension);
            tracing::error!("{}", msg);
            msg
        })?;

        tracing::info!(
            "Processing {} file: {}",
            format.as_str(),
            target_path.display()
        );

        let frames = if format.is_video() {
            tracing::info!(
                "🎬 [VIDEO] Processing video via FFmpeg: {}",
                target_path.display()
            );
            self.process_by_format(&[], format, Some(&target_path))
                .await?
        } else {
            let file_data = match read(&target_path).await {
                Ok(data) => data,
                Err(e) => {
                    let msg = format!(
                        "Failed to read file: {} - Error: {}",
                        target_path.display(),
                        e
                    );
                    tracing::error!("{}", msg);
                    return Err(msg);
                }
            };

            self.process_by_format(&file_data, format, Some(&target_path))
                .await?
        };

        update_global_max_frames(self.frame_count, self.max_frames);
        Ok(frames)
    }

    fn repeat_frames_to_count(
        frames: &[DynamicImage],
        target_count: u32,
    ) -> Result<Vec<usize>, String> {
        if frames.is_empty() {
            return Err("No frames available for processing".to_string());
        }

        let mut result = Vec::with_capacity(target_count as usize);

        for i in 0..target_count {
            let frame_index = (i % frames.len() as u32) as usize;
            result.push(frame_index);
        }

        Ok(result)
    }

    pub async fn process(&mut self) -> Result<Vec<String>, String> {
        let frames = self.process_files().await?;

        tracing::info!("Processing animation file with {} frames", frames.len());

        let final_frame_count = GLOBAL_MAX_FRAMES.load(Ordering::SeqCst);

        let frame_indices = Self::repeat_frames_to_count(&frames, final_frame_count)?;
        tracing::info!(
            "Creating spritesheets: {} original frames -> {} frame indices",
            frames.len(),
            frame_indices.len()
        );

        tracing::info!("Using GPU renderer for spritesheet creation");
        self.create_spritesheets_gpu(&frames, frame_indices.as_slice(), final_frame_count)
            .await?;

        let mut entries = read_dir(&self.trait_spritesheet_dir).await.map_err(|e| {
            let msg = format!("Failed to read spritesheet directory: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

        let mut found_files = false;
        while let Some(_entry) = entries.next_entry().await.map_err(|e| {
            let msg = format!("Failed to read directory entry: {}", e);
            tracing::error!("{}", msg);
            msg
        })? {
            found_files = true;
        }

        if !found_files {
            let msg = format!(
                "No spritesheets were created in {}",
                self.trait_spritesheet_dir.display()
            );
            tracing::error!("{}", msg);
            return Err(msg);
        }

        let frame_paths_strings: Vec<String> = (0..frame_indices.len())
            .map(|idx| format!("memory_frame_{:04}", idx))
            .collect();

        Ok(frame_paths_strings)
    }
}
