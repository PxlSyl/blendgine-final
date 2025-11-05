use crate::{effects::core::cpu::resize_cpu::ResizeConfig, types::AnimationQualityConfig};
use image::DynamicImage;

#[derive(Debug, Clone)]
pub struct WorkerOptions {
    pub frames: Vec<DynamicImage>,
    pub output_path: String,
    pub width: u32,
    pub height: u32,
    pub delay: u32,
    pub optimize: bool,
    pub format: Option<String>,
    pub quality_config: Option<AnimationQualityConfig>,
    pub resize_config: Option<ResizeConfig>,
}
