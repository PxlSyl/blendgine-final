use image::{self, DynamicImage, ImageBuffer, ImageEncoder};
use num_cpus;
use rayon::prelude::*;
use std::sync::Arc;

use tracing;

use crate::{
    layerpreview::animations::{
        utils::fast_copy, FrameProcessor, CURRENT_LAYOUT, FRAME_DIMENSIONS, MAX_TEXTURE_SIZE,
        RAYON_POOL,
    },
    types::SpritesheetLayout,
};

impl FrameProcessor {
    pub async fn create_spritesheets_cpu(
        &self,
        frames: &[DynamicImage],
        frame_indices: &[usize],
        final_frame_count: u32,
    ) -> Result<(), String> {
        tracing::info!(
            "Creating spritesheets directly: {} frames, {} indices",
            frames.len(),
            frame_indices.len()
        );

        let frame_width = frames[0].width();
        let frame_height = frames[0].height();

        let mut frame_dimensions = FRAME_DIMENSIONS.write().await;
        *frame_dimensions = Some((frame_width, frame_height));

        let layout = SpritesheetLayout::calculate(
            frame_width,
            frame_height,
            final_frame_count,
            MAX_TEXTURE_SIZE,
        );

        tracing::info!(
            "Spritesheet layout: {}x{} frames, {} sheets",
            layout.cols,
            layout.rows,
            layout.total_sheets
        );

        let mut current_layout = CURRENT_LAYOUT.write().await;
        *current_layout = Some(layout.clone());

        tracing::info!("Pre-converting {} frames to RgbaImage format", frames.len());
        let rgba_frames: Vec<_> = frames.iter().map(|frame| frame.to_rgba8()).collect();
        tracing::info!("Pre-conversion completed");

        let rgba_frames_arc = Arc::new(rgba_frames);

        let cpu_count = num_cpus::get();

        tracing::info!("Using global Rayon thread pool (CPU count: {})", cpu_count);

        let results: Vec<_> = RAYON_POOL.install(|| {
            (0..layout.total_sheets)
                .into_par_iter()
                .map(|sheet_idx| -> Result<(u32, Vec<u8>), String> {
                    let mut spritesheet = ImageBuffer::from_pixel(
                        frame_width * layout.cols,
                        frame_height * layout.rows,
                        image::Rgba([0, 0, 0, 0]),
                    );

                    let start_frame = sheet_idx * layout.frames_per_sheet;
                    let end_frame =
                        ((sheet_idx + 1) * layout.frames_per_sheet).min(final_frame_count);

                    let frame_positions: Vec<_> = frame_indices
                        .iter()
                        .enumerate()
                        .filter_map(|(batch_idx, &frame_index)| {
                            let frame_idx = start_frame + batch_idx as u32;

                            if frame_idx >= end_frame {
                                return None;
                            }

                            let offset = frame_idx - start_frame;
                            let row = (offset / layout.cols) as u32;
                            let col = (offset % layout.cols) as u32;

                            Some((col, row, frame_index))
                        })
                        .collect();

                    let frame_results: Vec<_> = frame_positions
                        .par_iter()
                        .map(|&(col, row, frame_index)| {
                            let rgba_frame = &rgba_frames_arc[frame_index];
                            (col, row, rgba_frame)
                        })
                        .collect();

                    for (col, row, rgba_frame) in frame_results {
                        let x = col * frame_width;
                        let y = row * frame_height;

                        let spritesheet_width = spritesheet.width() as usize;
                        let frame_width_usize = frame_width as usize;
                        let frame_height_usize = frame_height as usize;

                        let target_start = (y as usize * spritesheet_width + x as usize) * 4;

                        let source_data = rgba_frame.as_raw();
                        let target_data = spritesheet.as_mut();

                        for fy in 0..frame_height_usize {
                            let source_start = fy * frame_width_usize * 4;
                            let target_row_start = target_start + fy * spritesheet_width * 4;

                            unsafe {
                                fast_copy(
                                    source_data.as_ptr().add(source_start),
                                    target_data.as_mut_ptr().add(target_row_start),
                                    frame_width_usize * 4,
                                );
                            }
                        }
                    }

                    let mut buffer = Vec::with_capacity(
                        (spritesheet.width() * spritesheet.height() * 4) as usize,
                    );
                    {
                        let encoder = image::codecs::png::PngEncoder::new(&mut buffer);
                        encoder
                            .write_image(
                                spritesheet.as_raw(),
                                spritesheet.width(),
                                spritesheet.height(),
                                image::ColorType::Rgba8.into(),
                            )
                            .map_err(|e| {
                                let msg = format!("Failed to encode spritesheet: {}", e);
                                tracing::error!("{}", msg);
                                msg
                            })?;
                    }

                    Ok((sheet_idx, buffer))
                })
                .collect::<Vec<_>>()
        });

        for result in results {
            let (sheet_idx, buffer) = result?;

            let spritesheet_path = self
                .trait_spritesheet_dir
                .join(format!("spritesheet_{}.png", sheet_idx));

            let write_result = tokio::fs::write(&spritesheet_path, &buffer)
                .await
                .map_err(|e| {
                    let msg = format!(
                        "Failed to save spritesheet to {}: {}",
                        spritesheet_path.display(),
                        e
                    );
                    tracing::error!("{}", msg);
                    msg
                });

            match &write_result {
                Ok(_) => {
                    tracing::info!("Spritesheet {} saved successfully", sheet_idx);
                }
                Err(e) => {
                    tracing::error!("Spritesheet {} failed to save: {}", sheet_idx, e);
                }
            }

            write_result?;
        }

        Ok(())
    }
}
