use num_cpus;
use once_cell::sync::Lazy;
use rayon::{ThreadPool, ThreadPoolBuilder};
use std::sync::atomic::AtomicU32;
use tokio::sync::RwLock;

use crate::types::SpritesheetLayout;
pub const MAX_TEXTURE_SIZE: u32 = 8192;

#[derive(Debug, Clone, PartialEq)]
pub enum ImageFormat {
    Gif,
    WebP,
    Png,
    Mp4,
    WebM,
    Mov,
    Avi,
    Mkv,
}

impl ImageFormat {
    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            "gif" => Some(ImageFormat::Gif),
            "webp" => Some(ImageFormat::WebP),
            "png" => Some(ImageFormat::Png),
            "mp4" => Some(ImageFormat::Mp4),
            "webm" => Some(ImageFormat::WebM),
            "mov" => Some(ImageFormat::Mov),
            "avi" => Some(ImageFormat::Avi),
            "mkv" => Some(ImageFormat::Mkv),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            ImageFormat::Gif => "gif",
            ImageFormat::WebP => "webp",
            ImageFormat::Png => "png",
            ImageFormat::Mp4 => "mp4",
            ImageFormat::WebM => "webm",
            ImageFormat::Mov => "mov",
            ImageFormat::Avi => "avi",
            ImageFormat::Mkv => "mkv",
        }
    }

    pub fn is_video(&self) -> bool {
        matches!(
            self,
            ImageFormat::Mp4
                | ImageFormat::WebM
                | ImageFormat::Mov
                | ImageFormat::Avi
                | ImageFormat::Mkv
        )
    }
}

pub static FRAMES_PROCESSED_COUNT: AtomicU32 = AtomicU32::new(0);
pub static TOTAL_TRAITS_TO_PROCESS: AtomicU32 = AtomicU32::new(0);
pub static GLOBAL_MAX_FRAMES: AtomicU32 = AtomicU32::new(0);

pub static FRAME_DIMENSIONS: Lazy<RwLock<Option<(u32, u32)>>> = Lazy::new(|| RwLock::new(None));
pub static CURRENT_LAYOUT: Lazy<RwLock<Option<SpritesheetLayout>>> =
    Lazy::new(|| RwLock::new(None));

pub static RAYON_POOL: Lazy<ThreadPool> = Lazy::new(|| {
    let rayon_threads = num_cpus::get();

    ThreadPoolBuilder::new()
        .num_threads(rayon_threads)
        .build()
        .expect("Failed to create global Rayon thread pool")
});
