use rayon::prelude::*;
use std::{
    fs::read,
    iter::once,
    path::{Path, PathBuf},
    sync::{mpsc::channel, Arc},
    thread::sleep,
    time::{Duration, Instant},
};

use anyhow::Result;
use dashmap::DashMap;
use image::{load_from_memory, load_from_memory_with_format, DynamicImage, ImageFormat, RgbaImage};
use once_cell::sync::{Lazy, OnceCell};

use crate::effects::core::{
    cpu::resize_cpu::ResizeConfig,
    gpu::{
        blend_modes_gpu::{clear_blend_caches, GpuBlendProcessor},
        common::{clear_staging_buffer, GpuTexture},
        resize_gpu::ResizeGpu,
        shaders, GpuEffectManager, GpuImage,
    },
};
use crate::generation::generate::layers::blend::LayerBlendProperties;
use crate::types::{NFTTrait, RarityConfig};
static BLEND_PROPERTIES_CACHE: Lazy<DashMap<String, LayerBlendProperties>> =
    Lazy::new(|| DashMap::new());

static RESIZE_TEXTURES: Lazy<DashMap<(u32, u32), Arc<GpuTexture>>> = Lazy::new(|| DashMap::new());

static STAGING_BUFFERS_CACHE: Lazy<DashMap<u64, Arc<wgpu::Buffer>>> = Lazy::new(|| DashMap::new());

static SHARED_GPU_PIPELINE: once_cell::sync::OnceCell<Arc<StaticGpuPipeline>> = OnceCell::new();
static SHARED_RESIZE_GPU: once_cell::sync::OnceCell<Arc<ResizeGpu>> = OnceCell::new();

pub async fn get_or_init_shared_gpu_pipeline() -> Result<Arc<StaticGpuPipeline>, anyhow::Error> {
    if let Some(pipeline) = SHARED_GPU_PIPELINE.get() {
        return Ok(pipeline.clone());
    }

    let pipeline = Arc::new(StaticGpuPipeline::new().await?);
    let _ = SHARED_GPU_PIPELINE.set(pipeline.clone());

    Ok(pipeline)
}

pub async fn get_or_init_shared_resize_gpu() -> Result<Arc<ResizeGpu>, anyhow::Error> {
    if let Some(resize_gpu) = SHARED_RESIZE_GPU.get() {
        return Ok(resize_gpu.clone());
    }

    let device = shaders::get_global_device()
        .ok_or_else(|| anyhow::anyhow!("Global device not initialized"))?;
    let queue = shaders::get_global_queue()
        .ok_or_else(|| anyhow::anyhow!("Global queue not initialized"))?;

    let resize_gpu = Arc::new(
        ResizeGpu::new(&device, &queue)
            .map_err(|e| anyhow::anyhow!("Failed to create ResizeGpu: {}", e))?,
    );
    let _ = SHARED_RESIZE_GPU.set(resize_gpu.clone());

    tracing::info!("✅ [GPU RESIZE] Initialized on-demand");

    Ok(resize_gpu)
}

pub fn get_shared_gpu_pipeline() -> Arc<StaticGpuPipeline> {
    SHARED_GPU_PIPELINE
        .get()
        .expect("GPU pipeline not initialized. Call get_or_init_shared_gpu_pipeline first")
        .clone()
}

pub fn reset_shared_gpu_pipeline() -> Result<(), Box<dyn std::error::Error>> {
    tracing::info!("🧹 [GPU RESET] Reset complet du pipeline partagé...");

    clear_thread_local_caches();
    RESIZE_TEXTURES.clear();
    STAGING_BUFFERS_CACHE.clear();
    shaders::clear_shader_cache();

    clear_staging_buffer();

    clear_blend_caches();

    tracing::info!("✅ [GPU RESET] Caches CPU et pools de buffers nettoyés");

    if let Some(device) = shaders::get_global_device() {
        device.poll(wgpu::Maintain::Poll);
        tracing::info!("✅ [GPU RESET] Ressources GPU libérées");
    }

    tracing::info!("🎯 [GPU RESET] Pipeline en état ULTRA PROPRE ✓");
    Ok(())
}
pub fn get_shared_resize_gpu() -> Option<Arc<ResizeGpu>> {
    SHARED_RESIZE_GPU.get().cloned()
}

fn clear_thread_local_caches() {
    BLEND_PROPERTIES_CACHE.clear();
    tracing::info!("🧹 [SHARED CACHES] Caches partagés nettoyés");
}

fn submit_gpu_command_safe<I>(queue: &wgpu::Queue, command_buffers: I, operation_name: &str)
where
    I: IntoIterator<Item = wgpu::CommandBuffer>,
{
    tracing::debug!("🚀 [GPU FAST] Submitting {} (parallel)", operation_name);
    queue.submit(command_buffers);
}

fn get_texture(pipeline: &Arc<StaticGpuPipeline>, path: &Path) -> Result<Arc<GpuTexture>> {
    tracing::debug!("🔨 [TEXTURE] Création directe pour: {}", path.display());
    let texture = pipeline.process_layer_native(path)?;
    let arc_texture = Arc::new(texture);
    tracing::debug!("✅ [TEXTURE] Texture créée avec succès");
    Ok(arc_texture)
}

pub struct StaticGpuPipeline {
    gpu_manager: GpuEffectManager,
    blend_processor: Arc<GpuBlendProcessor>,
}

impl Drop for StaticGpuPipeline {
    fn drop(&mut self) {}
}

impl StaticGpuPipeline {
    async fn new() -> Result<Self, anyhow::Error> {
        let gpu_manager = GpuEffectManager::new()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create GPU manager: {}", e))?;

        shaders::initialize_global_device(&gpu_manager.device, &gpu_manager.queue);

        let blend_processor = Arc::new(
            GpuBlendProcessor::new()
                .await
                .map_err(|e| anyhow::anyhow!("Failed to create GPU blend processor: {}", e))?,
        );

        Ok(Self {
            gpu_manager,
            blend_processor,
        })
    }

    fn process_layer_native(&self, image_path: &Path) -> Result<GpuTexture> {
        let image = decode_image_from_path(image_path)?;

        let input_texture =
            GpuTexture::from_image(self.gpu_manager.device(), self.gpu_manager.queue(), &image)
                .map_err(|e| anyhow::anyhow!("Failed to create input GPU texture: {}", e))?;

        Ok(input_texture)
    }

    fn resize_final_image(
        &self,
        texture: &GpuTexture,
        final_width: u32,
        final_height: u32,
        resize_config: Option<&ResizeConfig>,
        resize_gpu: &ResizeGpu,
    ) -> Result<GpuTexture> {
        let resized_texture = GpuTexture::new(
            self.gpu_manager.device(),
            final_width,
            final_height,
            texture.format(),
        );

        let input_gpu_image = GpuImage::new(
            texture.texture(),
            texture.texture().size().width,
            texture.texture().size().height,
        );
        let output_gpu_image = GpuImage::new(resized_texture.texture(), final_width, final_height);

        let algorithm = ResizeGpu::map_resize_algorithm(&resize_config.map(|c| c.clone()));
        let filter_type = ResizeGpu::map_resize_filter(&resize_config.map(|c| c.clone()));
        let super_sampling_factor =
            ResizeGpu::map_super_sampling_factor(&resize_config.map(|c| c.clone()));

        resize_gpu
            .apply_resize(
                self.gpu_manager.device(),
                self.gpu_manager.queue(),
                &input_gpu_image,
                &output_gpu_image,
                algorithm,
                filter_type,
                super_sampling_factor,
            )
            .map_err(|e| anyhow::anyhow!("GPU resize failed: {}", e))?;

        Ok(resized_texture)
    }

    pub fn texture_to_image_optimized(&self, texture: &GpuTexture) -> Result<RgbaImage> {
        tracing::debug!("🚀 [GPU READBACK OPTIMIZED] Starting ultra-optimized readback");
        let total_start = Instant::now();

        let texture_size = texture.texture().size();
        let buffer_size = (texture_size.width * texture_size.height * 4) as u64;

        let staging_buffer = STAGING_BUFFERS_CACHE
            .entry(buffer_size)
            .or_insert_with(|| {
                tracing::trace!(
                    "🔄 [GPU CACHE] Creating new staging buffer of size {} bytes",
                    buffer_size
                );
                Arc::new(
                    self.gpu_manager
                        .device()
                        .create_buffer(&wgpu::BufferDescriptor {
                            label: Some("Cached Readback Staging Buffer"),
                            size: buffer_size,
                            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
                            mapped_at_creation: false,
                        }),
                )
            })
            .clone();

        let mut encoder =
            self.gpu_manager
                .device()
                .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                    label: Some("Optimized Readback Encoder"),
                });

        encoder.copy_texture_to_buffer(
            wgpu::ImageCopyTexture {
                texture: texture.texture(),
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::ImageCopyBuffer {
                buffer: &staging_buffer,
                layout: wgpu::ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(4 * texture_size.width),
                    rows_per_image: Some(texture_size.height),
                },
            },
            texture_size,
        );

        self.gpu_manager.queue().submit(once(encoder.finish()));

        let copy_duration = total_start.elapsed();
        tracing::trace!(
            "📋 [GPU READBACK] Copy commands submitted in {:?}",
            copy_duration
        );

        let buffer_slice = staging_buffer.slice(..);
        let (sender, receiver) = channel();

        buffer_slice.map_async(wgpu::MapMode::Read, move |result| {
            sender.send(result).unwrap();
        });

        let mut poll_count = 0;
        const MAX_POLLS: u32 = 1000;
        const POLL_INTERVAL: Duration = Duration::from_micros(100);

        loop {
            self.gpu_manager.device().poll(wgpu::Maintain::Poll);

            if let Ok(result) = receiver.try_recv() {
                result.map_err(|e| anyhow::anyhow!("Buffer mapping failed: {:?}", e))?;
                break;
            }

            poll_count += 1;
            if poll_count >= MAX_POLLS {
                tracing::warn!(
                    "🐌 [GPU READBACK] Falling back to blocking poll after {} attempts",
                    MAX_POLLS
                );
                self.gpu_manager.device().poll(wgpu::Maintain::Wait);
                receiver
                    .recv()
                    .unwrap()
                    .map_err(|e| anyhow::anyhow!("Buffer mapping failed: {:?}", e))?;
                break;
            }

            sleep(POLL_INTERVAL);
        }

        let map_duration = total_start.elapsed() - copy_duration;
        tracing::trace!(
            "🗺️ [GPU READBACK] Buffer mapping completed in {:?} ({} polls)",
            map_duration,
            poll_count
        );

        let data = buffer_slice.get_mapped_range();
        let rgba_image =
            RgbaImage::from_raw(texture_size.width, texture_size.height, data.to_vec())
                .ok_or_else(|| anyhow::anyhow!("Failed to create RgbaImage from buffer data"))?;

        drop(data);
        staging_buffer.unmap();

        let total_duration = total_start.elapsed();
        tracing::debug!(
            "⚡ [GPU READBACK OPTIMIZED] Ultra-optimized readback completed in {:?} (copy: {:?}, map: {:?}, {}x{})",
            total_duration,
            copy_duration,
            map_duration,
            texture_size.width,
            texture_size.height
        );

        Ok(rgba_image)
    }
}

impl StaticGpuPipeline {
    fn process_layers_batch(&self, layer_paths: &[&Path]) -> Result<Vec<Arc<GpuTexture>>> {
        tracing::info!(
            "🔄 [GPU BATCH] Starting parallel image decoding for {} images",
            layer_paths.len()
        );
        let decode_start = Instant::now();

        let decoded_images: Result<Vec<(PathBuf, image::DynamicImage)>> = layer_paths
            .par_iter()
            .map(|path| {
                let path_buf = path.to_path_buf();
                let image = decode_image_from_path(path)?;
                Ok((path_buf, image))
            })
            .collect();

        let decoded_images = decoded_images?;
        let decode_duration = decode_start.elapsed();
        tracing::info!(
            "✅ [GPU BATCH] Parallel decoding completed in {:?}",
            decode_duration
        );

        tracing::info!("🎮 [GPU BATCH] Starting parallel GPU upload pipeline");
        let upload_start = Instant::now();

        const CHUNK_SIZE: usize = 4;
        let chunks: Vec<_> = decoded_images.chunks(CHUNK_SIZE).collect();

        tracing::info!(
            "🧵 [GPU PARALLEL] Processing {} chunks of up to {} images each",
            chunks.len(),
            CHUNK_SIZE
        );

        let texture_results: Result<Vec<_>> = chunks
            .par_iter()
            .enumerate()
            .map(|(chunk_idx, chunk)| {
                let chunk_start = Instant::now();
                let mut chunk_textures = Vec::with_capacity(chunk.len());

                for (path, image) in chunk.iter() {
                    let texture_start = Instant::now();

                    let texture = GpuTexture::new(
                        self.gpu_manager.device(),
                        image.width(),
                        image.height(),
                        wgpu::TextureFormat::Rgba8Unorm,
                    );

                    let rgba_data = image.to_rgba8();

                    self.gpu_manager.queue().write_texture(
                        wgpu::ImageCopyTexture {
                            texture: texture.texture(),
                            mip_level: 0,
                            origin: wgpu::Origin3d::ZERO,
                            aspect: wgpu::TextureAspect::All,
                        },
                        &rgba_data,
                        wgpu::ImageDataLayout {
                            offset: 0,
                            bytes_per_row: Some(4 * image.width()),
                            rows_per_image: Some(image.height()),
                        },
                        wgpu::Extent3d {
                            width: image.width(),
                            height: image.height(),
                            depth_or_array_layers: 1,
                        },
                    );

                    let texture_duration = texture_start.elapsed();
                    tracing::trace!(
                        "📸 [GPU PARALLEL] Chunk {} texture uploaded in {:?} for {}",
                        chunk_idx,
                        texture_duration,
                        path.display()
                    );

                    chunk_textures.push(Arc::new(texture));
                }

                let chunk_duration = chunk_start.elapsed();
                tracing::debug!(
                    "🧵 [GPU PARALLEL] Chunk {} ({} textures) completed in {:?}",
                    chunk_idx,
                    chunk.len(),
                    chunk_duration
                );

                Ok(chunk_textures)
            })
            .collect();

        let all_textures: Vec<Arc<GpuTexture>> = texture_results?.into_iter().flatten().collect();

        self.gpu_manager.device().poll(wgpu::Maintain::Poll);

        let upload_duration = upload_start.elapsed();
        tracing::info!(
            "✅ [GPU BATCH] Parallel GPU upload completed in {:?}",
            upload_duration
        );
        tracing::info!(
            "🎯 [GPU BATCH] Total batch processing: decode {:?} + upload {:?} = {:?}",
            decode_duration,
            upload_duration,
            decode_start.elapsed()
        );

        Ok(all_textures)
    }
}

fn decode_image_from_path(path: &Path) -> Result<image::DynamicImage> {
    let decode_start = Instant::now();

    let buffer =
        read(path).map_err(|e| anyhow::anyhow!("Failed to read file {}: {}", path.display(), e))?;

    let io_duration = decode_start.elapsed();

    let image = if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        match ext.to_lowercase().as_str() {
            "png" => load_from_memory_with_format(&buffer, image::ImageFormat::Png)?,
            "webp" => load_from_memory_with_format(&buffer, image::ImageFormat::WebP)?,
            "jpg" | "jpeg" => load_from_memory_with_format(&buffer, image::ImageFormat::Jpeg)?,
            _ => load_from_memory(&buffer)?,
        }
    } else {
        load_from_memory(&buffer)?
    };

    let decode_duration = decode_start.elapsed();
    tracing::trace!(
        "📁 [DECODE] File {} decoded in {:?} (IO: {:?})",
        path.display(),
        decode_duration,
        io_duration
    );

    Ok(image)
}

fn is_empty_trait(trait_value: &str) -> bool {
    trait_value == "None" || trait_value == "none" || trait_value.is_empty()
}

pub async fn process_static_single_gpu(
    traits: &[NFTTrait],
    active_layer_order: &[String],
    input_folder: &Path,
    base_width: u32,
    base_height: u32,
    final_width: u32,
    final_height: u32,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    images_path: PathBuf,
    collection_name: &str,
    image_format: &str,
    index: u32,
    resize_config: Option<&ResizeConfig>,
) -> Result<()> {
    let _ = get_or_init_shared_gpu_pipeline().await?;

    if base_width != final_width || base_height != final_height {
        let _ = get_or_init_shared_resize_gpu().await?;
        tracing::debug!(
            "🎮 [GPU INIT] ResizeGpu initialized for {}x{} → {}x{}",
            base_width,
            base_height,
            final_width,
            final_height
        );
    } else {
        tracing::debug!(
            "⏭️ [GPU SKIP] ResizeGpu not needed - dimensions unchanged ({}x{})",
            base_width,
            base_height
        );
    }

    let traits_owned = traits.to_vec();
    let active_layer_order_owned = active_layer_order.to_vec();
    let input_folder_owned = input_folder.to_path_buf();
    let rarity_config_owned = rarity_config.clone();
    let current_set_id_owned = current_set_id.to_string();
    let collection_name_owned = collection_name.to_string();
    let image_format_owned = image_format.to_string();
    let resize_config_owned = resize_config.cloned();

    tokio::task::spawn_blocking(move || {
        process_static_single_gpu_blocking(
            &traits_owned,
            &active_layer_order_owned,
            &input_folder_owned,
            base_width,
            base_height,
            final_width,
            final_height,
            &rarity_config_owned,
            &current_set_id_owned,
            images_path,
            &collection_name_owned,
            &image_format_owned,
            index,
            resize_config_owned.as_ref(),
        )
    })
    .await
    .map_err(|e| anyhow::anyhow!("GPU task join error: {}", e))?
}

fn process_static_single_gpu_blocking(
    traits: &[NFTTrait],
    active_layer_order: &[String],
    input_folder: &Path,
    base_width: u32,
    base_height: u32,
    final_width: u32,
    final_height: u32,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    images_path: PathBuf,
    collection_name: &str,
    image_format: &str,
    index: u32,
    resize_config: Option<&ResizeConfig>,
) -> Result<()> {
    let pipeline_arc = get_shared_gpu_pipeline().clone();

    let base_width_arc = Arc::new(base_width);
    let base_height_arc = Arc::new(base_height);
    let final_width_arc = Arc::new(final_width);
    let final_height_arc = Arc::new(final_height);
    let current_set_id_arc = Arc::new(current_set_id.to_string());
    let input_folder_arc = Arc::new(input_folder.to_path_buf());
    let rarity_config_arc = Arc::new(rarity_config);
    let active_layer_order_arc = Arc::new(active_layer_order.to_vec());
    let traits_arc = Arc::new(traits.to_vec());
    let resize_config_arc = Arc::new(resize_config);

    let result = {
        let base_texture = GpuTexture::new(
            pipeline_arc.gpu_manager.device(),
            *base_width_arc,
            *base_height_arc,
            wgpu::TextureFormat::Rgba8Unorm,
        );

        let transparent_data = vec![0u8; (*base_width_arc * *base_height_arc * 4) as usize];
        pipeline_arc.gpu_manager.queue().write_texture(
            wgpu::ImageCopyTexture {
                texture: base_texture.texture(),
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &transparent_data,
            wgpu::ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(*base_width_arc * 4),
                rows_per_image: Some(*base_height_arc),
            },
            wgpu::Extent3d {
                width: *base_width_arc,
                height: *base_height_arc,
                depth_or_array_layers: 1,
            },
        );

        if active_layer_order_arc.is_empty() {
            return Err(anyhow::anyhow!("No layers to process"));
        }

        let layer_count = active_layer_order_arc.len();
        let mut valid_layers: Vec<_> = Vec::with_capacity(layer_count);

        valid_layers.extend(active_layer_order_arc.iter().filter_map(|layer| {
            let trait_data = traits_arc.iter().find(|t| t.trait_type == *layer)?;
            if is_empty_trait(&trait_data.value) {
                return None;
            }
            let blend_key = format!("{}_{}_{}", current_set_id_arc, layer, trait_data.value);

            let _blend_properties = BLEND_PROPERTIES_CACHE
                .entry(blend_key.clone())
                .or_insert_with(|| {
                    LayerBlendProperties::from_config(
                        layer,
                        &trait_data.value,
                        &rarity_config_arc,
                        &current_set_id_arc,
                    )
                })
                .clone();

            let png_path = input_folder_arc
                .join(layer)
                .join(format!("{}.png", trait_data.value));
            let webp_path = input_folder_arc
                .join(layer)
                .join(format!("{}.webp", trait_data.value));

            let path = if png_path.exists() {
                png_path
            } else if webp_path.exists() {
                webp_path
            } else {
                return None;
            };
            Some((layer, blend_key, path))
        }));

        if valid_layers.is_empty() {
            return Err(anyhow::anyhow!("No valid layer found"));
        }

        let mut layer_textures: Vec<(&str, Arc<GpuTexture>)> =
            Vec::with_capacity(valid_layers.len());

        if valid_layers.len() > 3 {
            let layer_paths: Vec<&Path> = valid_layers
                .iter()
                .map(|(_, _, path)| path.as_ref())
                .collect();
            let batch_textures = pipeline_arc.process_layers_batch(&layer_paths)?;

            for (i, (layer, _, _)) in valid_layers.iter().enumerate() {
                layer_textures.push((layer, Arc::clone(&batch_textures[i])));
            }
        } else {
            for (layer, _, image_path) in &valid_layers {
                let layer_texture = get_texture(&pipeline_arc, image_path)?;
                layer_textures.push((layer, layer_texture));
            }
        }

        let mut base_texture_mutable: Option<GpuTexture> = None;

        if let Some((_first_layer_name, first_layer_texture)) = layer_textures.first() {
            base_texture_mutable = Some(GpuTexture::new(
                pipeline_arc.gpu_manager.device(),
                first_layer_texture.texture().size().width,
                first_layer_texture.texture().size().height,
                first_layer_texture.format(),
            ));

            let mut copy_encoder = pipeline_arc.gpu_manager.device().create_command_encoder(
                &wgpu::CommandEncoderDescriptor {
                    label: Some("Base Layer Copy"),
                },
            );
            copy_encoder.copy_texture_to_texture(
                wgpu::ImageCopyTexture {
                    texture: &first_layer_texture.texture(),
                    mip_level: 0,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                wgpu::ImageCopyTexture {
                    texture: &base_texture_mutable
                        .as_ref()
                        .ok_or_else(|| anyhow::anyhow!("Base texture not available"))?
                        .texture(),
                    mip_level: 0,
                    origin: wgpu::Origin3d::ZERO,
                    aspect: wgpu::TextureAspect::All,
                },
                first_layer_texture.texture().size(),
            );
            submit_gpu_command_safe(
                pipeline_arc.gpu_manager.queue(),
                once(copy_encoder.finish()),
                "base layer copy",
            );
        }

        if layer_textures.len() > 1 {
            tracing::info!(
                "🚀 [GPU OPTIM] Préparation du blending en lot de {} couches",
                layer_textures.len() - 1
            );

            let mut remaining_layers = Vec::new();

            for (layer_name, layer_texture) in layer_textures.iter().skip(1) {
                let found_layer = valid_layers
                    .iter()
                    .find(|(l, _, _)| l == layer_name)
                    .ok_or_else(|| {
                        anyhow::anyhow!("Blend key not found for layer: {}", layer_name)
                    })?;
                let (_, blend_key, _) = found_layer;
                let blend_key = format!("{}_{}_{}", current_set_id_arc, layer_name, blend_key);

                let blend_properties = BLEND_PROPERTIES_CACHE
                    .get(&blend_key)
                    .ok_or_else(|| {
                        anyhow::anyhow!("Blend properties not found for key: {}", blend_key)
                    })?
                    .value()
                    .clone();

                remaining_layers.push((
                    &**layer_texture,
                    blend_properties.mode,
                    blend_properties.opacity,
                ));
                tracing::debug!(
                    "🎨 [GPU] Couche '{}' ajoutée au blending en lot",
                    layer_name
                );
            }

            tracing::info!(
                "🎯 [GPU] {} couches prêtes pour le blending en lot",
                remaining_layers.len()
            );

            if let Some(ref mut base_mutable) = base_texture_mutable {
                if !remaining_layers.is_empty() {
                    let start_time = Instant::now();

                    pipeline_arc
                        .blend_processor
                        .apply_multiple_blends_inplace(
                            pipeline_arc.gpu_manager.device(),
                            base_mutable,
                            &remaining_layers,
                            pipeline_arc.gpu_manager.queue(),
                        )
                        .map_err(|e| anyhow::anyhow!("GPU multiple blend failed: {}", e))?;

                    pipeline_arc.gpu_manager.device().poll(wgpu::Maintain::Poll);

                    let blend_duration = start_time.elapsed();
                    tracing::info!(
                        "⚡ [GPU OPTIM] Blending en lot de {} couches terminé en {:?}",
                        remaining_layers.len(),
                        blend_duration
                    );
                } else {
                    tracing::info!("ℹ️ [GPU] Aucune couche supplémentaire à blender");
                }
            }
        }

        let final_blended_texture = base_texture_mutable
            .ok_or_else(|| anyhow::anyhow!("No final blended texture available"))?;

        tracing::info!(
            "🎯 [GPU] Traitement terminé : {} couches traitées sur {} attendues",
            layer_textures.len(),
            active_layer_order_arc.len()
        );

        let final_texture =
            if *base_width_arc != *final_width_arc || *base_height_arc != *final_height_arc {
                tracing::info!(
                    "🔄 [RESIZE] Resizing from {}x{} to {}x{}",
                    *base_width_arc,
                    *base_height_arc,
                    *final_width_arc,
                    *final_height_arc
                );

                let resize_gpu = get_shared_resize_gpu().ok_or_else(|| {
                    anyhow::anyhow!("ResizeGpu not initialized. This should not happen.")
                })?;

                let destination_texture = get_or_create_global_resize_texture(
                    pipeline_arc.gpu_manager.device(),
                    *final_width_arc,
                    *final_height_arc,
                );

                pipeline_arc.resize_final_image(
                    &final_blended_texture,
                    destination_texture.texture().size().width,
                    destination_texture.texture().size().height,
                    resize_config_arc.as_deref(),
                    &resize_gpu,
                )?
            } else {
                tracing::info!(
                    "✅ [RESIZE] Skipping resize - dimensions unchanged ({}x{})",
                    *base_width_arc,
                    *base_height_arc
                );
                final_blended_texture
            };

        let total_image_start = Instant::now();

        tracing::debug!("🔄 [GPU READBACK] Starting deferred texture readback");
        let readback_start = Instant::now();

        let final_image = pipeline_arc.texture_to_image_optimized(&final_texture)?;

        let readback_duration = readback_start.elapsed();

        if readback_duration.as_millis() > 1000 {
            tracing::error!(
                "🚨 [READBACK DIAGNOSTIC] EXTREMELY SLOW READBACK: {:?} - THIS IS ABNORMAL!",
                readback_duration
            );
        } else if readback_duration.as_millis() > 100 {
            tracing::warn!(
                "🐌 [READBACK DIAGNOSTIC] Slow readback: {:?} - could be optimized",
                readback_duration
            );
        } else {
            tracing::debug!(
                "⚡ [READBACK DIAGNOSTIC] Fast readback: {:?} - GOOD!",
                readback_duration
            );
        }

        let output_path = images_path.join(format!(
            "{}_{}.{}",
            collection_name,
            index + 1,
            image_format
        ));

        let save_start = Instant::now();

        tracing::info!(
            "💾 [SAVE DIAGNOSTIC] Starting save for {}x{} image to {}",
            final_image.width(),
            final_image.height(),
            output_path.display()
        );

        let save_result = match image_format.to_lowercase().as_str() {
            "png" => {
                tracing::debug!("🖼️ [SAVE] Saving as PNG with fast compression...");
                let rgb_image = DynamicImage::ImageRgba8(final_image.clone()).to_rgb8();
                rgb_image.save_with_format(&output_path, ImageFormat::Png)
            }
            "jpg" | "jpeg" => {
                tracing::debug!("🖼️ [SAVE] Saving as JPEG with optimized quality...");
                let rgb_image = DynamicImage::ImageRgba8(final_image.clone()).to_rgb8();
                rgb_image.save_with_format(&output_path, ImageFormat::Jpeg)
            }
            "webp" => {
                tracing::debug!("🖼️ [SAVE] Saving as WebP with fast preset...");
                final_image.save_with_format(&output_path, ImageFormat::WebP)
            }
            _ => {
                tracing::error!("⚠️ [SAVE] Unsupported image format: {}", image_format);
                return Err(anyhow::anyhow!(
                    "Unsupported image format: {}",
                    image_format
                ));
            }
        };

        let save_duration = save_start.elapsed();

        if save_duration.as_millis() > 1000 {
            tracing::error!(
                "🚨 [SAVE DIAGNOSTIC] EXTREMELY SLOW SAVE: {:?} for {}x{} {} - THIS IS ABNORMAL!",
                save_duration,
                final_image.width(),
                final_image.height(),
                image_format
            );
        } else if save_duration.as_millis() > 200 {
            tracing::warn!(
                "🐌 [SAVE DIAGNOSTIC] Slow save: {:?} for {}x{} {} - could be optimized",
                save_duration,
                final_image.width(),
                final_image.height(),
                image_format
            );
        } else {
            tracing::debug!(
                "⚡ [SAVE DIAGNOSTIC] Fast save: {:?} for {}x{} {} - GOOD!",
                save_duration,
                final_image.width(),
                final_image.height(),
                image_format
            );
        }

        match save_result {
            Ok(_) => {
                tracing::info!(
                    "✅ [SAVE] Image saved successfully to {}",
                    output_path.display()
                );
            }
            Err(e) => {
                tracing::error!(
                    "❌ [SAVE] Failed to save image {}: {}",
                    output_path.display(),
                    e
                );
                return Err(anyhow::anyhow!("Failed to save image: {}", e));
            }
        }

        let total_image_duration = total_image_start.elapsed();

        if total_image_duration.as_millis() > 5000 {
            tracing::error!(
                "🚨 [TOTAL DIAGNOSTIC] EXTREMELY SLOW TOTAL: {:?} for image {} - THIS IS ABNORMAL!",
                total_image_duration,
                index + 1
            );
        } else if total_image_duration.as_millis() > 1000 {
            tracing::warn!(
                "🐌 [TOTAL DIAGNOSTIC] Slow total: {:?} for image {} - could be optimized",
                total_image_duration,
                index + 1
            );
        } else {
            tracing::info!(
                "⚡ [TOTAL DIAGNOSTIC] Fast total: {:?} for image {} - GOOD!",
                total_image_duration,
                index + 1
            );
        }

        tracing::info!(
            "✅ [GPU] Processing completed successfully for image {} in {:?} (readback: {:?}, save: {:?})",
            index + 1,
            total_image_duration,
            readback_duration,
            save_duration
        );
        Ok(())
    };

    result
}

fn get_or_create_global_resize_texture(
    device: &wgpu::Device,
    width: u32,
    height: u32,
) -> Arc<GpuTexture> {
    RESIZE_TEXTURES
        .entry((width, height))
        .or_insert_with(|| {
            Arc::new(GpuTexture::new(
                device,
                width,
                height,
                wgpu::TextureFormat::Rgba8Unorm,
            ))
        })
        .clone()
}
