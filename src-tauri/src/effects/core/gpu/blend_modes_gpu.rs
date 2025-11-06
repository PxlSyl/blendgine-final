use super::{common::GpuTexture, shaders, GpuEffectManager};
use crate::types::BlendMode;
use bytemuck::cast_slice;
use dashmap::DashMap;
use image::{DynamicImage, GenericImageView};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use rayon::prelude::*;
use std::{
    collections::{HashMap, HashSet},
    error::Error,
    iter,
    sync::Arc,
    time::Instant,
};
use wgpu::{BindGroupLayout, ComputePipeline, Device, Queue};
static PIPELINE_CACHE: Lazy<DashMap<BlendMode, Arc<ComputePipeline>>> =
    Lazy::new(|| DashMap::new());
static VIEW_CACHE: Lazy<DashMap<u64, Arc<wgpu::TextureView>>> = Lazy::new(|| DashMap::new());

static TEMP_TEXTURE_POOL: Lazy<DashMap<(u32, u32), Vec<GpuTexture>>> = Lazy::new(|| DashMap::new());

static GLOBAL_GPU_BLEND_CONTEXT: Lazy<Mutex<Option<Arc<GpuBlendContext>>>> =
    Lazy::new(|| Mutex::new(None));

fn get_texture_key(texture: &wgpu::Texture) -> u64 {
    std::ptr::addr_of!(*texture) as u64
}

fn get_or_create_view(texture: &wgpu::Texture) -> Arc<wgpu::TextureView> {
    let key = get_texture_key(texture);

    if let Some(cached_view) = VIEW_CACHE.get(&key) {
        return Arc::clone(cached_view.value());
    }

    let view = Arc::new(texture.create_view(&wgpu::TextureViewDescriptor::default()));
    VIEW_CACHE.insert(key, Arc::clone(&view));
    view
}

pub fn clear_blend_caches() {
    PIPELINE_CACHE.clear();
    VIEW_CACHE.clear();
    cleanup_temp_texture_pool();
}

fn get_or_create_temp_texture(device: &Device, width: u32, height: u32) -> GpuTexture {
    let key = (width, height);

    if let Some(mut textures) = TEMP_TEXTURE_POOL.get_mut(&key) {
        if let Some(texture) = textures.pop() {
            return texture;
        }
    }

    GpuTexture::new(device, width, height, wgpu::TextureFormat::Rgba8Unorm)
}

fn return_temp_texture_to_pool(texture: GpuTexture) {
    let key = (
        texture.texture().size().width,
        texture.texture().size().height,
    );

    TEMP_TEXTURE_POOL
        .entry(key)
        .or_insert_with(Vec::new)
        .push(texture);
}

fn cleanup_temp_texture_pool() {
    let mut keys_to_remove = Vec::new();

    for entry in TEMP_TEXTURE_POOL.iter() {
        keys_to_remove.push(entry.key().clone());
    }

    for key in keys_to_remove {
        if let Some((_, textures)) = TEMP_TEXTURE_POOL.remove(&key) {
            for texture in textures {
                texture.texture().destroy();
                tracing::debug!(
                    "🗑️ [GPU POOL] Texture temporaire {}x{} détruite",
                    texture.texture().size().width,
                    texture.texture().size().height
                );
            }
        }
    }
}

pub struct GpuBlendContext {
    pub manager: GpuEffectManager,
    pub processor: Arc<GpuBlendProcessor>,
}

impl Drop for GpuBlendContext {
    fn drop(&mut self) {}
}

impl GpuBlendContext {
    pub async fn new() -> Result<Self, Box<dyn Error>> {
        let device =
            shaders::get_global_device().ok_or_else(|| "Global GPU device not initialized")?;
        let queue =
            shaders::get_global_queue().ok_or_else(|| "Global GPU queue not initialized")?;

        let manager = GpuEffectManager::from_existing(device, queue);
        let processor = Arc::new(GpuBlendProcessor::new().await?);

        Ok(Self { manager, processor })
    }

    pub async fn initialize_global() -> Option<Arc<Self>> {
        {
            let ctx = GLOBAL_GPU_BLEND_CONTEXT.lock();
            if let Some(ref existing) = *ctx {
                return Some(existing.clone());
            }
        }

        match Self::new().await {
            Ok(ctx) => {
                let arc_ctx = Arc::new(ctx);
                let mut global_ctx = GLOBAL_GPU_BLEND_CONTEXT.lock();
                *global_ctx = Some(arc_ctx.clone());
                tracing::info!("✅ [GPU BLEND] Global context initialized");
                Some(arc_ctx)
            }
            Err(e) => {
                tracing::error!("Failed to create GPU blend context: {}", e);
                None
            }
        }
    }

    pub fn get_global() -> Option<Arc<Self>> {
        GLOBAL_GPU_BLEND_CONTEXT.lock().clone()
    }

    pub fn clear_global() {
        cleanup_temp_texture_pool();

        let mut global_ctx = GLOBAL_GPU_BLEND_CONTEXT.lock();
        if let Some(ctx) = global_ctx.take() {
            drop(ctx);
        }
        tracing::info!("✅ [GPU BLEND] Global context cleared");
    }
}

pub type BlendGpuError = String;

pub struct GpuBlendProcessor {
    bind_group_layout: Arc<BindGroupLayout>,
}

impl Drop for GpuBlendProcessor {
    fn drop(&mut self) {}
}

impl GpuBlendProcessor {
    pub async fn new() -> Result<Self, BlendGpuError> {
        let bind_group_layout = shaders::get_or_create_bind_group_layout("blend_modes");
        Ok(Self { bind_group_layout })
    }

    pub fn blend_images(
        &self,
        device: &Device,
        queue: &Queue,
        base_image: &DynamicImage,
        overlay_image: &DynamicImage,
        blend_mode: BlendMode,
        opacity: f32,
    ) -> Result<DynamicImage, Box<dyn Error>> {
        let (width, height) = base_image.dimensions();

        if overlay_image.dimensions() != (width, height) {
            return Err(format!(
                "Image dimensions mismatch: base {}x{}, overlay {}x{}",
                width,
                height,
                overlay_image.width(),
                overlay_image.height()
            )
            .into());
        }

        let base_rgba = base_image.to_rgba8();
        let overlay_rgba = overlay_image.to_rgba8();

        let base_dynamic = DynamicImage::ImageRgba8(base_rgba);
        let overlay_dynamic = DynamicImage::ImageRgba8(overlay_rgba);

        let base_texture = GpuTexture::from_image(device, queue, &base_dynamic)?;
        let overlay_texture = GpuTexture::from_image(device, queue, &overlay_dynamic)?;
        let mut output_texture = get_or_create_temp_texture(device, width, height);

        self.apply_blend(
            device,
            queue,
            &base_texture,
            &overlay_texture,
            &mut output_texture,
            blend_mode,
            opacity,
        )?;

        let result = output_texture.to_image(device, queue)?;

        return_temp_texture_to_pool(output_texture);
        base_texture.texture().destroy();
        overlay_texture.texture().destroy();
        device.poll(wgpu::Maintain::Poll);

        Ok(result)
    }

    fn get_shader_name(blend_mode: BlendMode) -> &'static str {
        match blend_mode {
            BlendMode::SourceOver => "blend_modes/source_over",
            BlendMode::Lighter => "blend_modes/lighter",
            BlendMode::Multiply => "blend_modes/multiply",
            BlendMode::Screen => "blend_modes/screen",
            BlendMode::Overlay => "blend_modes/overlay",
            BlendMode::Darken => "blend_modes/darken",
            BlendMode::Lighten => "blend_modes/lighten",
            BlendMode::ColorDodge => "blend_modes/color_dodge",
            BlendMode::ColorBurn => "blend_modes/color_burn",
            BlendMode::HardLight => "blend_modes/hard_light",
            BlendMode::SoftLight => "blend_modes/soft_light",
            BlendMode::Difference => "blend_modes/difference",
            BlendMode::Exclusion => "blend_modes/exclusion",
            BlendMode::Hue => "blend_modes/hue",
            BlendMode::Saturation => "blend_modes/saturation",
            BlendMode::Color => "blend_modes/color",
            BlendMode::Luminosity => "blend_modes/luminosity",
        }
    }

    pub fn get_or_create_pipeline(
        &self,
        _device: &Device,
        blend_mode: BlendMode,
    ) -> Result<Arc<ComputePipeline>, BlendGpuError> {
        if let Some(pipeline) = PIPELINE_CACHE.get(&blend_mode) {
            println!(
                "🚀 [SHADER CACHE] HIT global: Pipeline {:?} récupéré du cache global",
                blend_mode
            );
            return Ok(Arc::clone(pipeline.value()));
        }

        let shader_name = Self::get_shader_name(blend_mode);
        println!(
            "🔨 [SHADER CACHE] MISS global: Création pipeline {:?} (shader: {})",
            blend_mode, shader_name
        );

        let pipeline =
            shaders::get_or_create_compute_pipeline(&shader_name, &self.bind_group_layout);

        PIPELINE_CACHE.insert(blend_mode, Arc::clone(&pipeline));

        println!(
            "✅ [SHADER CACHE] Pipeline {:?} ajouté au cache global",
            blend_mode
        );

        Ok(pipeline)
    }

    pub fn apply_blend(
        &self,
        device: &Device,
        queue: &Queue,
        base_texture: &GpuTexture,
        layer_texture: &GpuTexture,
        output_texture: &mut GpuTexture,
        blend_mode: BlendMode,
        opacity: f32,
    ) -> Result<(), BlendGpuError> {
        let pipeline = self.get_or_create_pipeline(device, blend_mode)?;

        let base_view = base_texture
            .texture()
            .create_view(&wgpu::TextureViewDescriptor::default());
        let layer_view = layer_texture
            .texture()
            .create_view(&wgpu::TextureViewDescriptor::default());
        let output_view = output_texture
            .texture()
            .create_view(&wgpu::TextureViewDescriptor::default());

        let opacity_data = [opacity as f32];
        let opacity_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("Blend Opacity Uniform"),
            size: 16,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        queue.write_buffer(&opacity_buffer, 0, bytemuck::cast_slice(&opacity_data));

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("Blend Bind Group"),
            layout: &self.bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&base_view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(&layer_view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::TextureView(&output_view),
                },
                wgpu::BindGroupEntry {
                    binding: 3,
                    resource: opacity_buffer.as_entire_binding(),
                },
            ],
        });

        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
        let mut compute_pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());

        compute_pass.set_pipeline(&pipeline);
        compute_pass.set_bind_group(0, &bind_group, &[]);

        let workgroup_size = 8;
        let workgroup_count_x =
            (base_texture.texture().size().width + workgroup_size - 1) / workgroup_size;
        let workgroup_count_y =
            (base_texture.texture().size().height + workgroup_size - 1) / workgroup_size;

        compute_pass.dispatch_workgroups(workgroup_count_x, workgroup_count_y, 1);
        drop(compute_pass);

        queue.submit(iter::once(encoder.finish()));
        println!("✅ [BLEND] Blend operation completed: {:?}", blend_mode);

        Ok(())
    }

    pub fn apply_multiple_blends_inplace(
        &self,
        device: &Device,
        base_texture: &mut GpuTexture,
        layers: &[(&GpuTexture, BlendMode, f32)],
        queue: &Queue,
    ) -> Result<(), String> {
        let start_time = Instant::now();
        println!(
            "🚀 [BLEND MULTI] Starting multiple blend operation ({} layers)",
            layers.len()
        );

        if layers.is_empty() {
            return Ok(());
        }

        let texture_size = base_texture.texture().size();

        let temp_a = GpuTexture::new(
            device,
            texture_size.width,
            texture_size.height,
            wgpu::TextureFormat::Rgba8Unorm,
        );
        let temp_b = GpuTexture::new(
            device,
            texture_size.width,
            texture_size.height,
            wgpu::TextureFormat::Rgba8Unorm,
        );

        let pipeline_start = Instant::now();
        let workgroup_size = 8u32;

        let unique_blend_modes: HashSet<_> = layers.iter().map(|(_, mode, _)| *mode).collect();
        let pipeline_cache: HashMap<_, _> = unique_blend_modes
            .into_iter()
            .map(|mode| {
                let pipeline = self.get_or_create_pipeline(device, mode)?;
                Ok((mode, pipeline))
            })
            .collect::<Result<_, String>>()?;

        let base_size = base_texture.texture().size();
        let dispatch_x = (base_size.width + workgroup_size - 1) / workgroup_size;
        let dispatch_y = (base_size.height + workgroup_size - 1) / workgroup_size;

        let ops: Vec<_> = layers
            .iter()
            .enumerate()
            .map(|(i, (layer_texture, blend_mode, opacity))| {
                let pipeline = pipeline_cache.get(blend_mode).unwrap().clone();
                let is_last = i == layers.len() - 1;

                let opacity_data = [*opacity as f32];
                let opacity_buffer = device.create_buffer(&wgpu::BufferDescriptor {
                    label: Some(&format!("Blend Opacity Uniform Layer {}", i)),
                    size: 16, // 4 bytes for f32 + 12 bytes padding for uniform buffer alignment
                    usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
                    mapped_at_creation: false,
                });
                queue.write_buffer(&opacity_buffer, 0, cast_slice(&opacity_data));

                (
                    pipeline,
                    *layer_texture,
                    (dispatch_x, dispatch_y),
                    is_last,
                    *blend_mode,
                    opacity_buffer,
                )
            })
            .collect();

        let pipeline_time = pipeline_start.elapsed();
        println!(
            "⏱️ [TIMING] Préparation pipelines optimisée: {:?}",
            pipeline_time
        );

        let view_start = Instant::now();
        println!(
            "🔧 [VIEWS] Création parallèle de {} vues de texture avec cache thread-local...",
            ops.len()
        );

        let all_views: Vec<_> = {
            let mut views = Vec::with_capacity(ops.len() + 3);

            let layer_views: Vec<_> = ops
                .par_iter()
                .map(|op| {
                    let (_, layer_tex, _, _, _, _) = op;
                    get_or_create_view(layer_tex.texture())
                })
                .collect();

            let temp_a_view = get_or_create_view(temp_a.texture());
            let temp_b_view = get_or_create_view(temp_b.texture());
            let base_view = get_or_create_view(base_texture.texture());

            views.push(temp_a_view);
            views.push(temp_b_view);
            views.push(base_view);
            views.extend(layer_views);

            views
        };

        let view_creation_time = view_start.elapsed();
        println!(
            "⚡ [VIEWS] {} vues créées en parallèle avec cache thread-local en {:?}",
            all_views.len(),
            view_creation_time
        );

        let temp_a_view = &all_views[0];
        let temp_b_view = &all_views[1];
        let base_view = &all_views[2];
        let all_layer_views = &all_views[3..];

        let copy_start = Instant::now();
        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor::default());
        encoder.copy_texture_to_texture(
            wgpu::ImageCopyTexture {
                texture: base_texture.texture(),
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::ImageCopyTexture {
                texture: temp_a.texture(),
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            texture_size,
        );
        let copy_time = copy_start.elapsed();
        println!("⏱️ [TIMING] Encoder + copie texture: {:?}", copy_time);

        let execution_start = Instant::now();

        let first_layer = ops.get(0).expect("layers non vides");
        let (pipeline, _layer_tex, dispatch, _is_last, blend_mode, opacity_buffer) = first_layer;
        let layer_view = &all_layer_views[0];

        let first_bind_start = Instant::now();
        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("Blend BG first"),
            layout: &self.bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&base_view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(layer_view),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::TextureView(&temp_a_view),
                },
                wgpu::BindGroupEntry {
                    binding: 3,
                    resource: opacity_buffer.as_entire_binding(),
                },
            ],
        });
        let first_bind_time = first_bind_start.elapsed();

        let first_compute_start = Instant::now();
        {
            let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                label: Some("Blend First Pass"),
            });
            pass.set_pipeline(pipeline);
            pass.set_bind_group(0, &bind_group, &[]);
            pass.dispatch_workgroups(dispatch.0, dispatch.1, 1);
        }
        let first_compute_time = first_compute_start.elapsed();

        println!(
            "⏱️ [BLEND] Layer 1 ({:?}): BindGroup={:?}, Compute={:?}, Total={:?}",
            blend_mode,
            first_bind_time,
            first_compute_time,
            first_bind_time + first_compute_time
        );

        let mut use_a_as_src = true;
        let intermediate_ops: Vec<_> = ops
            .iter()
            .skip(1)
            .take(ops.len().saturating_sub(2))
            .collect();

        for (i, op) in intermediate_ops.iter().enumerate() {
            let (pipeline, _layer_tex, dispatch, _is_last, blend_mode, opacity_buffer) = op;

            let (src_view, dst_view) = if use_a_as_src {
                (&temp_a_view, &temp_b_view)
            } else {
                (&temp_b_view, &temp_a_view)
            };

            let layer_view = &all_layer_views[i + 1];

            let bind_group_start = Instant::now();
            let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("Blend BG mid"),
                layout: &self.bind_group_layout,
                entries: &[
                    wgpu::BindGroupEntry {
                        binding: 0,
                        resource: wgpu::BindingResource::TextureView(src_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 1,
                        resource: wgpu::BindingResource::TextureView(layer_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 2,
                        resource: wgpu::BindingResource::TextureView(dst_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 3,
                        resource: opacity_buffer.as_entire_binding(),
                    },
                ],
            });
            let bind_group_time = bind_group_start.elapsed();

            let compute_start = Instant::now();
            {
                let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                    label: Some("Blend Mid Pass"),
                });
                pass.set_pipeline(pipeline);
                pass.set_bind_group(0, &bind_group, &[]);
                pass.dispatch_workgroups(dispatch.0, dispatch.1, 1);
            }
            let compute_time = compute_start.elapsed();

            println!(
                "⏱️ [BLEND] Layer {} ({:?}): BindGroup={:?}, Compute={:?}, Total={:?}",
                i + 2,
                blend_mode,
                bind_group_time,
                compute_time,
                bind_group_time + compute_time
            );

            use_a_as_src = !use_a_as_src;
        }

        if let Some(last_op) = ops.last() {
            let (pipeline, _layer_tex, dispatch, _is_last, blend_mode, opacity_buffer) = last_op;

            let src_view = if use_a_as_src {
                &temp_a_view
            } else {
                &temp_b_view
            };

            let layer_view = all_layer_views.last().expect("Vues non vides");

            let final_bind_start = Instant::now();
            let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("Blend BG final"),
                layout: &self.bind_group_layout,
                entries: &[
                    wgpu::BindGroupEntry {
                        binding: 0,
                        resource: wgpu::BindingResource::TextureView(src_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 1,
                        resource: wgpu::BindingResource::TextureView(layer_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 2,
                        resource: wgpu::BindingResource::TextureView(base_view),
                    },
                    wgpu::BindGroupEntry {
                        binding: 3,
                        resource: opacity_buffer.as_entire_binding(),
                    },
                ],
            });
            let final_bind_time = final_bind_start.elapsed();

            let final_compute_start = Instant::now();
            {
                let mut pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
                    label: Some("Blend Final Pass"),
                });
                pass.set_pipeline(pipeline);
                pass.set_bind_group(0, &bind_group, &[]);
                pass.dispatch_workgroups(dispatch.0, dispatch.1, 1);
            }
            let final_compute_time = final_compute_start.elapsed();

            println!(
                "⏱️ [BLEND] Layer {} ({:?}) [FINAL]: BindGroup={:?}, Compute={:?}, Total={:?}",
                layers.len(),
                blend_mode,
                final_bind_time,
                final_compute_time,
                final_bind_time + final_compute_time
            );
        }

        let execution_time = execution_start.elapsed();
        println!("⏱️ [TIMING] Exécution GPU optimisée: {:?}", execution_time);

        let submit_start = Instant::now();
        let cmd = encoder.finish();
        let _index = queue.submit(std::iter::once(cmd));
        let submit_time = submit_start.elapsed();
        println!("⏱️ [TIMING] Submit GPU: {:?}", submit_time);

        let poll_start = Instant::now();
        device.poll(wgpu::Maintain::Wait);
        let poll_time = poll_start.elapsed();
        println!("⏱️ [TIMING] Poll GPU (drain): {:?}", poll_time);

        let destroy_start = Instant::now();
        temp_a.destroy();
        temp_b.destroy();
        let destroy_time = destroy_start.elapsed();
        println!(
            "⏱️ [TIMING] Destruction textures temporaires: {:?}",
            destroy_time
        );

        let total = start_time.elapsed();
        println!(
            "✅ [BLEND MULTI] Completed in {:?} ({} layers) - ULTRA OPTIMIZED: Views={:?}, Pipelines={:?}, GPU={:?}, Poll={:?}, Destroy={:?}",
            total,
            layers.len(),
            view_creation_time,
            pipeline_time,
            execution_time,
            poll_time,
            destroy_time
        );
        Ok(())
    }
}
