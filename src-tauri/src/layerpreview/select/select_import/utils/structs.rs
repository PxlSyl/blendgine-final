use crate::types::ImageDimensions;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct LayerContent {
    pub name: String,
    pub images: Vec<ImageMetadata>,
    pub base_dimensions: ImageDimensions,
    pub has_animated_images: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub name: String,
    pub path: String,
    pub dimensions: ImageDimensions,
    pub frame_count: Option<u32>,
    pub is_single_frame: bool,
}
