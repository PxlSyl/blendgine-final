use anyhow::{Context, Result};
use image::DynamicImage;
use std::{path::Path, thread::sleep, time::Duration};

use crate::{
    ffmpeg_wrapper::FFmpegWrapper, filesystem::utils::ensure_file_ready,
    generation::generate::save_animation::save::structs::WorkerOptions,
};

pub fn save_mp4_animation(
    frames: &[DynamicImage],
    output_path: &Path,
    options: &WorkerOptions,
) -> Result<()> {
    let quality_config = options
        .quality_config
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("Quality config required for MP4"))?;

    let settings = &quality_config.format_specific_settings.mp4;
    let fps = 1000.0 / options.delay as f32;

    let ffmpeg = FFmpegWrapper::new().context("Failed to initialize FFmpeg")?;

    ffmpeg
        .encode_animation_direct(
            frames,
            output_path,
            "mp4",
            fps,
            Some(settings.quality.try_into().unwrap()),
            options.optimize,
            None,
            None,
        )
        .context("Failed to encode MP4 with FFmpeg")?;

    ensure_file_ready(output_path)?;
    sleep(Duration::from_millis(200));

    Ok(())
}
