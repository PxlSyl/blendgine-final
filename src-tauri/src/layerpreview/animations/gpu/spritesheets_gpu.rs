use std::{
    collections::VecDeque, fs, path::PathBuf, slice::from_raw_parts, sync::Arc, time::Duration,
};

use bytemuck::cast_slice;
use futures::future::join_all;
use image::{
    codecs::png::{CompressionType, FilterType, PngEncoder},
    ColorType, DynamicImage, ImageEncoder,
};
use tokio::{
    sync::oneshot,
    task::{spawn_blocking, JoinHandle},
    time::{sleep, timeout},
};
use wgpu::*;

use crate::{
    layerpreview::animations::{
        gpu::renderer::{FrameData, GpuSpritesheetRenderer},
        FrameProcessor, CURRENT_LAYOUT, FRAME_DIMENSIONS, MAX_TEXTURE_SIZE,
    },
    types::SpritesheetLayout,
};

impl FrameProcessor {
    pub async fn create_spritesheets_gpu(
        &self,
        frames: &[DynamicImage],
        frame_indices: &[usize],
        final_frame_count: u32,
    ) -> Result<(), String> {
        let fw = frames[0].width();
        let fh = frames[0].height();
        *FRAME_DIMENSIONS.write().await = Some((fw, fh));

        let layout = SpritesheetLayout::calculate(fw, fh, final_frame_count, MAX_TEXTURE_SIZE);
        *CURRENT_LAYOUT.write().await = Some(layout.clone());

        let rgba_frames: Vec<_> = frames.iter().map(|f| f.to_rgba8()).collect();

        let (mut renderer, max_in_flight) =
            GpuSpritesheetRenderer::new_with_max_in_flight(frames).await?;
        tracing::info!("Using dynamic MAX_IN_FLIGHT: {}", max_in_flight);
        let out_dir = Arc::new(self.trait_spritesheet_dir.clone());

        struct Pending {
            staging: Buffer,
            recv: oneshot::Receiver<Result<(), wgpu::BufferAsyncError>>,
            width: u32,
            height: u32,
            path: PathBuf,
            retry_count: u32,
        }

        struct FailedTask {
            width: u32,
            height: u32,
            path: PathBuf,
            retry_count: u32,
        }
        let mut pending: VecDeque<Pending> = VecDeque::new();
        let mut failed_tasks: VecDeque<FailedTask> = VecDeque::new();

        let mut encode_handles = vec![];

        let create_sheet_data = |sheet_idx: u32,
                                 layout: &SpritesheetLayout,
                                 final_frame_count: u32,
                                 frame_indices: &[usize],
                                 fw: u32,
                                 fh: u32,
                                 rgba_frames: &[image::RgbaImage]|
         -> (Vec<FrameData>, Vec<u32>) {
            let start = sheet_idx * layout.frames_per_sheet;
            let end = ((sheet_idx + 1) * layout.frames_per_sheet).min(final_frame_count);

            let mut frame_data_vec: Vec<FrameData> = Vec::with_capacity((end - start) as usize);
            let mut needed_u32s = 0usize;

            for (i, &src_idx) in frame_indices.iter().enumerate() {
                let fi = start + i as u32;
                if fi >= end {
                    break;
                }
                let off = fi - start;
                let row = off / layout.cols;
                let col = off % layout.cols;
                frame_data_vec.push(FrameData {
                    frame_index: src_idx as u32,
                    col,
                    row,
                    frame_width: fw,
                    frame_height: fh,
                    spritesheet_width: fw * layout.cols,
                    spritesheet_height: fh * layout.rows,
                });
                needed_u32s += (fw * fh) as usize;
            }

            if frame_data_vec.is_empty() {
                return (frame_data_vec, Vec::new());
            }

            let mut input_u32: Vec<u32> = Vec::with_capacity(needed_u32s);
            for fd in &frame_data_vec {
                let fr = &rgba_frames[fd.frame_index as usize];
                let raw = fr.as_raw();
                let u32s = unsafe { from_raw_parts(raw.as_ptr() as *const u32, raw.len() / 4) };
                input_u32.extend_from_slice(u32s);
            }

            let mut remapped = frame_data_vec.clone();
            for (i, fd) in remapped.iter_mut().enumerate() {
                fd.frame_index = i as u32;
            }

            (remapped, input_u32)
        };

        async fn consume_oldest(
            renderer: &mut GpuSpritesheetRenderer,
            pending: &mut VecDeque<Pending>,
            failed_tasks: &mut VecDeque<FailedTask>,
            encode_handles: &mut Vec<JoinHandle<Result<(), String>>>,
        ) -> Result<(), String> {
            if let Some(p) = pending.pop_front() {
                tracing::debug!("Consuming pending job, remaining: {}", pending.len());
                renderer.device.poll(Maintain::Wait);

                let map_res = match timeout(Duration::from_secs(5), p.recv).await {
                    Ok(recv_result) => {
                        recv_result.map_err(|e| format!("map channel closed: {:?}", e))
                    }
                    Err(_) => {
                        tracing::warn!(
                            "GPU operation timeout for {}, will retry...",
                            p.path.display()
                        );
                        Err("map_async timeout".to_string())
                    }
                };

                match map_res {
                    Ok(_) => {
                        let slice = p.staging.slice(..);
                        let data = slice.get_mapped_range();
                        let bytes = data.to_vec();
                        drop(data);
                        p.staging.unmap();

                        let path = p.path.clone();
                        let handle = spawn_blocking(move || -> Result<(), String> {
                            let mut out = Vec::with_capacity((p.width * p.height * 4) as usize);
                            let encoder = PngEncoder::new_with_quality(
                                &mut out,
                                CompressionType::Fast,
                                FilterType::NoFilter,
                            );
                            encoder
                                .write_image(&bytes, p.width, p.height, ColorType::Rgba8.into())
                                .map_err(|e| format!("PNG encode failed: {}", e))?;
                            fs::write(&path, out)
                                .map_err(|e| format!("write {}: {}", path.display(), e))?;
                            Ok(())
                        });
                        encode_handles.push(handle);
                    }
                    Err(e) => {
                        if p.retry_count < 3 {
                            tracing::warn!(
                                "GPU operation failed for {} (attempt {}), will retry later: {}",
                                p.path.display(),
                                p.retry_count + 1,
                                e
                            );
                            failed_tasks.push_back(FailedTask {
                                width: p.width,
                                height: p.height,
                                path: p.path,
                                retry_count: p.retry_count + 1,
                            });
                        } else {
                            tracing::error!(
                                "GPU operation failed for {} after {} attempts: {}",
                                p.path.display(),
                                p.retry_count + 1,
                                e
                            );
                            return Err(format!(
                                "GPU operation failed for {} after {} attempts: {}",
                                p.path.display(),
                                p.retry_count + 1,
                                e
                            ));
                        }
                    }
                }
            }
            Ok(())
        }

        for sheet_idx in 0..layout.total_sheets {
            tracing::info!(
                "Processing spritesheet {}/{}",
                sheet_idx + 1,
                layout.total_sheets
            );

            let (remapped, input_u32) = create_sheet_data(
                sheet_idx,
                &layout,
                final_frame_count,
                frame_indices,
                fw,
                fh,
                &rgba_frames,
            );

            if remapped.is_empty() {
                continue;
            }

            let frame_bytes: &[u8] = cast_slice(&remapped);

            let out_w = fw * layout.cols;
            let out_h = fh * layout.rows;
            let output_pixels_count = (out_w * out_h) as usize;

            let (staging, rx) = renderer.dispatch_and_stage(
                fw,
                fh,
                remapped.len() as u32,
                frame_bytes,
                &input_u32,
                output_pixels_count,
            );

            let path = out_dir.join(format!("spritesheet_{}.png", sheet_idx));
            pending.push_back(Pending {
                staging,
                recv: rx,
                width: out_w,
                height: out_h,
                path,
                retry_count: 0,
            });

            while pending.len() >= max_in_flight {
                consume_oldest(
                    &mut renderer,
                    &mut pending,
                    &mut failed_tasks,
                    &mut encode_handles,
                )
                .await?;
            }
        }

        while !pending.is_empty() {
            consume_oldest(
                &mut renderer,
                &mut pending,
                &mut failed_tasks,
                &mut encode_handles,
            )
            .await?;
        }

        while !failed_tasks.is_empty() {
            tracing::info!("Retrying {} failed tasks...", failed_tasks.len());

            sleep(Duration::from_millis(2000)).await;

            let mut retry_tasks = Vec::new();
            while let Some(failed) = failed_tasks.pop_front() {
                let sheet_idx = failed
                    .path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .and_then(|s| s.strip_prefix("spritesheet_"))
                    .and_then(|s| s.parse::<u32>().ok())
                    .unwrap_or(0);

                let (remapped, input_u32) = create_sheet_data(
                    sheet_idx,
                    &layout,
                    final_frame_count,
                    frame_indices,
                    fw,
                    fh,
                    &rgba_frames,
                );

                if !remapped.is_empty() {
                    let frame_bytes: &[u8] = cast_slice(&remapped);
                    let output_pixels_count = (failed.width * failed.height) as usize;

                    let (staging, rx) = renderer.dispatch_and_stage(
                        fw,
                        fh,
                        remapped.len() as u32,
                        frame_bytes,
                        &input_u32,
                        output_pixels_count,
                    );

                    retry_tasks.push(Pending {
                        staging,
                        recv: rx,
                        width: failed.width,
                        height: failed.height,
                        path: failed.path,
                        retry_count: failed.retry_count,
                    });
                }
            }

            for task in retry_tasks {
                pending.push_back(task);
            }

            while !pending.is_empty() {
                consume_oldest(
                    &mut renderer,
                    &mut pending,
                    &mut failed_tasks,
                    &mut encode_handles,
                )
                .await?;
            }
        }

        let join_results = join_all(encode_handles.into_iter().map(|h| async move {
            h.await
                .map_err(|e| format!("spawn_blocking join error: {:?}", e))
        }))
        .await;

        for jr in join_results {
            let _ = jr.map_err(|e| e)?;
        }

        renderer.device.poll(Maintain::Wait);

        Ok(())
    }
}
