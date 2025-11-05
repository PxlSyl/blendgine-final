use anyhow::{Context, Result};
use image::GenericImageView;

use crate::effects::core::{
    dispatch::resize::ResizeConverter, interpolate::interpolation::InterpolationEngine,
    interpolate::InterpolationOptions,
};
use crate::generation::generate::save_animation::save::{
    save_file::save_animation, structs::WorkerOptions,
};
use crate::types::InterpolationMethod;

pub async fn spawn_animation_worker(options: WorkerOptions) -> Result<()> {
    let interpolation_engine = InterpolationEngine::get_or_create_global()
        .ok_or_else(|| anyhow::anyhow!("Failed to get or create interpolation engine"))?;

    let frames = options.frames.clone();

    if frames.is_empty() {
        return Err(anyhow::anyhow!("No frames provided"));
    }

    if let Some(first_frame) = frames.first() {
        let (input_width, input_height) = first_frame.dimensions();

        interpolation_engine.optimize_for_size(input_width, input_height);

        let common_sizes = [(input_width, input_height)];
        interpolation_engine.prewarm_pools(&common_sizes);
    }

    let interpolated_frames = if let Some(quality_config) = &options.quality_config {
        let format = options.format.clone().unwrap_or_else(|| "webp".to_string());

        let interpolation_enabled = match format.as_str() {
            "gif" => {
                quality_config
                    .format_specific_settings
                    .gif
                    .interpolation
                    .enabled
            }
            "webp" => {
                quality_config
                    .format_specific_settings
                    .webp
                    .interpolation
                    .enabled
            }
            "mp4" => {
                quality_config
                    .format_specific_settings
                    .mp4
                    .interpolation
                    .enabled
            }
            "webm" => {
                quality_config
                    .format_specific_settings
                    .webm
                    .interpolation
                    .enabled
            }
            _ => false,
        };

        if interpolation_enabled {
            let (method, factor) = match format.as_str() {
                "gif" => (
                    quality_config
                        .format_specific_settings
                        .gif
                        .interpolation
                        .method,
                    quality_config
                        .format_specific_settings
                        .gif
                        .interpolation
                        .factor,
                ),
                "webp" => (
                    quality_config
                        .format_specific_settings
                        .webp
                        .interpolation
                        .method,
                    quality_config
                        .format_specific_settings
                        .webp
                        .interpolation
                        .factor,
                ),
                "mp4" => (
                    quality_config
                        .format_specific_settings
                        .mp4
                        .interpolation
                        .method,
                    quality_config
                        .format_specific_settings
                        .mp4
                        .interpolation
                        .factor,
                ),
                "webm" => (
                    quality_config
                        .format_specific_settings
                        .webm
                        .interpolation
                        .method,
                    quality_config
                        .format_specific_settings
                        .webm
                        .interpolation
                        .factor,
                ),
                _ => (InterpolationMethod::LucasKanade, 1),
            };

            let interpolation_options = InterpolationOptions { method, factor };

            interpolation_engine
                .interpolate_frames(frames, interpolation_options)
                .context("Failed to interpolate frames with WGPU")?
        } else {
            frames
        }
    } else {
        frames
    };

    interpolation_engine.optimize_memory_usage();
    interpolation_engine.clear_cache();

    let resized_frames = if options.width != 0 && options.height != 0 {
        let resize_converter = ResizeConverter::new().map_err(|e| anyhow::anyhow!("{}", e))?;
        resize_converter
            .resize_images(
                &interpolated_frames,
                options.width,
                options.height,
                &options.resize_config,
            )
            .map_err(|e| anyhow::anyhow!("{}", e))
            .context("Failed to resize frames")?
    } else {
        interpolated_frames
    };

    save_animation(&resized_frames, &options)
        .await
        .context("Failed to save animation")?;

    interpolation_engine.cleanup();

    Ok(())
}
