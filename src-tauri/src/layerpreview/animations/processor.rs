use image::{self, codecs::gif::GifDecoder, AnimationDecoder, DynamicImage, ImageReader};
use num_cpus;
use once_cell::sync::Lazy;
use rayon::ThreadPoolBuilder;
use std::{
    io::Cursor,
    path::PathBuf,
    sync::atomic::{AtomicU32, Ordering},
};
use tauri::{AppHandle, Runtime};
use tokio::sync::RwLock;
use tracing;
use webp_animation::Decoder;

use super::{file_watcher::start_animation_file_watcher, utils::update_global_max_frames};
use crate::renderer::get_current_renderer_preference;
use crate::types::SpritesheetLayout;

pub type Result<T, E = String> = std::result::Result<T, E>;
pub const MAX_TEXTURE_SIZE: u32 = 8192;

#[derive(Debug, Clone, PartialEq)]
enum ImageFormat {
    Gif,
    WebP,
    Png,
}

impl ImageFormat {
    fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            "gif" => Some(ImageFormat::Gif),
            "webp" => Some(ImageFormat::WebP),
            "png" => Some(ImageFormat::Png),
            _ => None,
        }
    }

    fn as_str(&self) -> &'static str {
        match self {
            ImageFormat::Gif => "gif",
            ImageFormat::WebP => "webp",
            ImageFormat::Png => "png",
        }
    }
}

pub static FRAMES_PROCESSED_COUNT: AtomicU32 = AtomicU32::new(0);
pub static TOTAL_TRAITS_TO_PROCESS: AtomicU32 = AtomicU32::new(0);
pub static GLOBAL_MAX_FRAMES: AtomicU32 = AtomicU32::new(0);

pub static FRAME_DIMENSIONS: Lazy<RwLock<Option<(u32, u32)>>> = Lazy::new(|| RwLock::new(None));
pub static CURRENT_LAYOUT: Lazy<RwLock<Option<SpritesheetLayout>>> =
    Lazy::new(|| RwLock::new(None));

pub static RAYON_POOL: Lazy<rayon::ThreadPool> = Lazy::new(|| {
    let rayon_threads = num_cpus::get();

    ThreadPoolBuilder::new()
        .num_threads(rayon_threads)
        .build()
        .expect("Failed to create global Rayon thread pool")
});

fn extract_webp_frames(data: &[u8]) -> Result<Vec<DynamicImage>, String> {
    let decoder = Decoder::new(data).map_err(|e| format!("Decoder error: {:?}", e))?;
    let mut result = Vec::new();

    for frame in decoder.into_iter() {
        let frame_bytes = frame
            .into_image()
            .map_err(|_| "Failed to convert WebP frame to bytes".to_string())?;

        let dynamic_image = image::load_from_memory(&frame_bytes)
            .map_err(|e| format!("Failed to load frame from memory: {}", e))?;

        result.push(dynamic_image);
    }
    Ok(result)
}

fn extract_gif_frames(data: &[u8]) -> Result<Vec<DynamicImage>, String> {
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

        tokio::fs::create_dir_all(&trait_spritesheet_dir)
            .await
            .map_err(|e| {
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
    ) -> Result<Vec<DynamicImage>, String> {
        match format {
            ImageFormat::Gif | ImageFormat::WebP => {
                self.process_animated_format(data, format).await
            }
            ImageFormat::Png => self.process_png(data).await,
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
            ImageFormat::Png => return Err("PNG is not an animated format".to_string()),
        };

        let result = RAYON_POOL.install(|| extract_fn(&data_clone));

        match result {
            Ok(frames) => self.process_frames_result(frames),
            Err(e) => Err(format!("Failed to decode {}: {}", format.as_str(), e)),
        }
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

            if let Ok(mut entries) = tokio::fs::read_dir(&image_path).await {
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

        let file_data = match tokio::fs::read(&target_path).await {
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

        tracing::info!("Processing file: {}", target_path.display());

        tracing::info!("Processing {} file directly", format.as_str());

        let frames = self.process_by_format(&file_data, format).await?;

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

        let renderer_preference = get_current_renderer_preference();

        match renderer_preference.as_str() {
            "gpu" => {
                tracing::info!("Using GPU renderer for spritesheet creation");
                match self
                    .create_spritesheets_gpu(&frames, frame_indices.as_slice(), final_frame_count)
                    .await
                {
                    Ok(()) => {}
                    Err(e) => {
                        tracing::warn!(
                            "GPU spritesheet creation failed, falling back to CPU: {}",
                            e
                        );
                        self.create_spritesheets_cpu(
                            &frames,
                            frame_indices.as_slice(),
                            final_frame_count,
                        )
                        .await?
                    }
                }
            }
            _ => {
                tracing::info!("Using CPU renderer for spritesheet creation");
                self.create_spritesheets_cpu(&frames, frame_indices.as_slice(), final_frame_count)
                    .await?
            }
        }

        let mut entries = tokio::fs::read_dir(&self.trait_spritesheet_dir)
            .await
            .map_err(|e| {
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
