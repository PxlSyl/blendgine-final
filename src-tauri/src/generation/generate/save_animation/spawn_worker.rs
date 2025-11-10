use anyhow::{Context, Result};
use image::GenericImageView;

use crate::{
    effects::core::{
        gpu::{
            resize_gpu::ResizeGpu,
            shaders::{get_global_device, get_global_queue},
        },
        interpolate::{interpolation::InterpolationEngine, InterpolationOptions},
    },
    generation::generate::save_animation::save::{
        save_file::save_animation, structs::WorkerOptions,
    },
    types::InterpolationMethod,
};

pub async fn spawn_animation_worker(options: WorkerOptions) -> Result<()> {
    let frames = options.frames.clone();

    if frames.is_empty() {
        return Err(anyhow::anyhow!("No frames provided"));
    }

    let interpolation_enabled = if let Some(quality_config) = &options.quality_config {
        let format = options.format.clone().unwrap_or_else(|| "webp".to_string());
        match format.as_str() {
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
        }
    } else {
        false
    };

    let interpolated_frames = if interpolation_enabled {
        let interpolation_engine = InterpolationEngine::get_or_create_global()
            .await
            .ok_or_else(|| anyhow::anyhow!("Failed to get or create interpolation engine"))?;

        if let Some(first_frame) = frames.first() {
            let (input_width, input_height) = first_frame.dimensions();
            interpolation_engine.optimize_for_size(input_width, input_height);
            let common_sizes = [(input_width, input_height)];
            interpolation_engine.prewarm_pools(&common_sizes);
        }

        let quality_config = options.quality_config.as_ref().unwrap();
        let format = options.format.clone().unwrap_or_else(|| "webp".to_string());

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

        let result = interpolation_engine
            .interpolate_frames(frames, interpolation_options)
            .context("Failed to interpolate frames with WGPU")?;

        interpolation_engine.optimize_memory_usage();
        interpolation_engine.clear_cache();
        interpolation_engine.cleanup();

        result
    } else {
        frames
    };

    let resized_frames = if options.width != 0 && options.height != 0 {
        let needs_resize = if let Some(first_frame) = interpolated_frames.first() {
            let (current_width, current_height) = first_frame.dimensions();
            current_width != options.width || current_height != options.height
        } else {
            false
        };

        if needs_resize {
            tracing::info!(
                "🔄 [ANIM RESIZE] Resizing {} frames to {}x{}",
                interpolated_frames.len(),
                options.width,
                options.height
            );

            let device = get_global_device()
                .ok_or_else(|| anyhow::anyhow!("Global GPU device not initialized"))?;
            let queue = get_global_queue()
                .ok_or_else(|| anyhow::anyhow!("Global GPU queue not initialized"))?;

            let resize_gpu = ResizeGpu::new(&device, &queue)
                .map_err(|e| anyhow::anyhow!("Failed to create GPU resizer: {}", e))?;

            resize_gpu
                .resize_images(
                    &device,
                    &queue,
                    &interpolated_frames,
                    options.width,
                    options.height,
                    &options.resize_config,
                )
                .map_err(|e| anyhow::anyhow!("Failed to resize frames: {}", e))?
        } else {
            tracing::info!(
                "✅ [ANIM RESIZE] Skipping resize - dimensions unchanged ({}x{})",
                interpolated_frames
                    .first()
                    .map(|f| f.dimensions().0)
                    .unwrap_or(0),
                interpolated_frames
                    .first()
                    .map(|f| f.dimensions().1)
                    .unwrap_or(0)
            );
            interpolated_frames
        }
    } else {
        interpolated_frames
    };

    save_animation(&resized_frames, &options)
        .await
        .context("Failed to save animation")?;

    Ok(())
}
