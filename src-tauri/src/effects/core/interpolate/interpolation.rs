use crate::effects::core::interpolate::{
    InterpolationMethod, InterpolationOptions, WgpuEngine, GLOBAL_INTERPOLATION_ENGINE,
};
use anyhow::Result;
use dashmap::DashMap;
use image::{DynamicImage, GenericImageView};
use parking_lot::{Mutex, RwLock};
use std::{
    mem::size_of,
    sync::Arc,
    time::{Duration, Instant},
};
use wgpu::{
    BindGroup, BindGroupLayout, BindGroupLayoutDescriptor, BindGroupLayoutEntry, BindingType,
    Buffer, BufferBindingType, BufferUsages, ComputePipeline, Device, ShaderStages,
    StorageTextureAccess, Texture, TextureDescriptor, TextureDimension, TextureFormat,
    TextureSampleType, TextureUsages, TextureViewDimension,
};

use crate::effects::core::interpolate::methods::phase_based;
use phase_based::FftCache;

#[repr(C)]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
pub struct InterpolationUniforms {
    pub alpha: f32,
    pub factor: f32,
    pub _padding: [f32; 2],
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct BindGroupKey {
    pub width: u32,
    pub height: u32,
    pub method: u32,
    pub factor: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct MotionFlowBindGroupKey {
    pub width: u32,
    pub height: u32,
    pub method: u32,
    pub factor: u32,
    pub flow_scale: u64,
    pub block_size: u64,
}

pub struct TexturePool {
    pub textures: DashMap<(u32, u32), Vec<Texture>>,
    pub max_pool_size: usize,
    pub adaptive_growth: bool,
    pub total_textures: usize,
}

impl TexturePool {
    fn new_adaptive() -> Self {
        Self {
            textures: DashMap::new(),
            max_pool_size: 100,
            adaptive_growth: true,
            total_textures: 0,
        }
    }

    pub fn acquire(&mut self, device: &Device, width: u32, height: u32) -> Texture {
        let key = (width, height);

        if let Some(mut textures) = self.textures.get_mut(&key) {
            if let Some(texture) = textures.value_mut().pop() {
                self.total_textures -= 1;
                return texture;
            }
        }

        if self.adaptive_growth && self.total_textures < self.max_pool_size / 2 {
            self.grow_pool(device, width, height, 5);
        }

        self.create_texture(device, width, height)
    }

    pub fn release(&mut self, texture: Texture) {
        let size = texture.size();
        let key = (size.width, size.height);

        let mut textures = self.textures.entry(key).or_insert_with(Vec::new);

        if textures.len() < 10 && self.total_textures < self.max_pool_size {
            textures.push(texture);
            self.total_textures += 1;
        }
    }

    fn grow_pool(&mut self, device: &Device, width: u32, height: u32, count: usize) {
        for _ in 0..count {
            let texture = self.create_texture(device, width, height);
            let key = (width, height);
            let mut textures = self.textures.entry(key).or_insert_with(Vec::new);
            textures.push(texture);
            self.total_textures += 1;
        }
    }

    fn create_texture(&self, device: &Device, width: u32, height: u32) -> Texture {
        device.create_texture(&TextureDescriptor {
            label: Some("Pooled Texture"),
            size: wgpu::Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING
                | TextureUsages::STORAGE_BINDING
                | TextureUsages::COPY_DST
                | TextureUsages::COPY_SRC,
            view_formats: &[],
        })
    }
}

pub struct UniformBufferPool {
    pub buffers: Vec<Buffer>,
    pub preallocated: bool,
}

impl UniformBufferPool {
    fn new() -> Self {
        Self {
            buffers: Vec::new(),
            preallocated: false,
        }
    }

    pub fn acquire(&mut self, device: &Device) -> Buffer {
        if let Some(buffer) = self.buffers.pop() {
            return buffer;
        }

        if !self.preallocated {
            self.preallocate_buffers(device, 10);
            self.preallocated = true;
        }

        if let Some(buffer) = self.buffers.pop() {
            return buffer;
        }

        self.create_buffer(device)
    }

    pub fn release(&mut self, buffer: Buffer) {
        if self.buffers.len() < 20 {
            self.buffers.push(buffer);
        }
    }

    fn preallocate_buffers(&mut self, device: &Device, count: usize) {
        for _ in 0..count {
            let buffer = self.create_buffer(device);
            self.buffers.push(buffer);
        }
    }

    fn create_buffer(&self, device: &Device) -> Buffer {
        device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("Pooled Uniform Buffer"),
            size: size_of::<InterpolationUniforms>() as u64,
            usage: BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        })
    }

    pub fn clear(&mut self) {
        self.buffers.clear();
        self.preallocated = false;
    }
}

pub struct BindGroupCache {
    pub cache: DashMap<BindGroupKey, (Arc<BindGroup>, Instant)>,
    pub ttl: Duration,
}

impl BindGroupCache {
    fn new() -> Self {
        Self {
            cache: DashMap::new(),
            ttl: Duration::from_secs(300),
        }
    }

    pub fn cleanup_expired(&mut self) {
        let now = Instant::now();
        self.cache
            .retain(|_, (_, created)| now.duration_since(*created) < self.ttl);
    }
}

pub struct MotionFlowBindGroupCache {
    pub cache: DashMap<MotionFlowBindGroupKey, (Arc<BindGroup>, Instant)>,
    pub ttl: Duration,
}

impl MotionFlowBindGroupCache {
    fn new() -> Self {
        Self {
            cache: DashMap::new(),
            ttl: Duration::from_secs(300),
        }
    }

    pub fn cleanup_expired(&mut self) {
        let now = Instant::now();
        self.cache
            .retain(|_, (_, created)| now.duration_since(*created) < self.ttl);
    }
}

pub struct InterpolationEngine {
    pub engine: WgpuEngine,
    pub bind_group_layout: BindGroupLayout,
    pub motion_flow_bind_group_layout: BindGroupLayout,
    pub lucas_kanade_pipeline: ComputePipeline,
    pub blend_pipeline: ComputePipeline,
    pub motion_flow_pipeline: ComputePipeline,
    pub bidirectional_pipeline: ComputePipeline,
    pub dissolve_pipeline: ComputePipeline,
    pub block_based_pipeline: ComputePipeline,
    pub displacement_map_pipeline: ComputePipeline,
    pub gaussian_reduction_pipeline: ComputePipeline,
    pub texture_pool: Arc<Mutex<TexturePool>>,
    pub uniform_buffer_pool: Arc<Mutex<UniformBufferPool>>,
    pub fft_cache: Arc<RwLock<FftCache>>,

    pub bind_group_cache: Arc<Mutex<BindGroupCache>>,
    pub motion_flow_bind_group_cache: Arc<Mutex<MotionFlowBindGroupCache>>,
}

impl InterpolationEngine {
    pub async fn new() -> Result<Self> {
        let engine = WgpuEngine::new().await?;

        let bind_group_layout = Self::create_bind_group_layout(&engine.device());
        let motion_flow_bind_group_layout =
            Self::create_motion_flow_bind_group_layout(&engine.device());

        let lucas_kanade_pipeline =
            InterpolationEngine::create_lucas_kanade_pipeline(&engine.device(), &bind_group_layout);
        let blend_pipeline =
            InterpolationEngine::create_blend_pipeline(&engine.device(), &bind_group_layout);
        let motion_flow_pipeline = InterpolationEngine::create_motion_flow_pipeline(
            &engine.device(),
            &motion_flow_bind_group_layout,
        );
        let bidirectional_pipeline =
            Self::create_bidirectional_pipeline(&engine.device(), &bind_group_layout);
        let dissolve_pipeline =
            Self::create_dissolve_pipeline(&engine.device(), &bind_group_layout);
        let block_based_pipeline =
            Self::create_block_based_pipeline(&engine.device(), &bind_group_layout);
        let displacement_map_pipeline =
            Self::create_displacement_map_pipeline(&engine.device(), &bind_group_layout);
        let gaussian_reduction_pipeline =
            Self::create_gaussian_reduction_pipeline(&engine.device(), &bind_group_layout);

        let texture_pool = Arc::new(Mutex::new(TexturePool::new_adaptive()));
        let uniform_buffer_pool = Arc::new(Mutex::new(UniformBufferPool::new()));
        let bind_group_cache = Arc::new(Mutex::new(BindGroupCache::new()));
        let motion_flow_bind_group_cache = Arc::new(Mutex::new(MotionFlowBindGroupCache::new()));
        let fft_cache = Arc::new(RwLock::new(FftCache::new(100)));

        Ok(Self {
            engine,
            bind_group_layout,
            motion_flow_bind_group_layout,
            lucas_kanade_pipeline,
            blend_pipeline,
            motion_flow_pipeline,
            bidirectional_pipeline,
            dissolve_pipeline,
            block_based_pipeline,
            displacement_map_pipeline,
            gaussian_reduction_pipeline,
            texture_pool,
            uniform_buffer_pool,
            fft_cache,
            bind_group_cache,
            motion_flow_bind_group_cache,
        })
    }

    fn create_bind_group_layout(device: &Device) -> BindGroupLayout {
        device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("Interpolation Bind Group Layout"),
            entries: &[
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::StorageTexture {
                        access: StorageTextureAccess::WriteOnly,
                        format: TextureFormat::Rgba8Unorm,
                        view_dimension: TextureViewDimension::D2,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 3,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        })
    }

    fn create_motion_flow_bind_group_layout(device: &Device) -> BindGroupLayout {
        device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("Motion Flow Bind Group Layout"),
            entries: &[
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::StorageTexture {
                        access: StorageTextureAccess::WriteOnly,
                        format: TextureFormat::Rgba8Unorm,
                        view_dimension: TextureViewDimension::D2,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 3,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 4,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 5,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 6,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 7,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 8,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 9,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Texture {
                        sample_type: TextureSampleType::Float { filterable: false },
                        view_dimension: TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
            ],
        })
    }

    pub fn interpolate_frames(
        &self,
        frames: Vec<DynamicImage>,
        options: InterpolationOptions,
    ) -> Result<Vec<DynamicImage>> {
        if frames.len() < 2 {
            return Ok(frames);
        }

        let first_frame = &frames[0];
        let (input_width, input_height) = first_frame.dimensions();

        println!(
            "🎯 Interpolation GPU : Taille d'entrée {}x{} (seule taille nécessaire)",
            input_width, input_height
        );

        self.prewarm_texture_pool(&[(input_width, input_height)]);

        let batch_size = self.calculate_optimal_batch_size(frames.len());
        println!("🎯 Optimisation GPU : Batch size optimal = {}", batch_size);

        println!("{}", self.analyze_gpu_performance());

        let mut interpolated_frames = Vec::new();

        for batch_start in (0..frames.len()).step_by(batch_size) {
            let batch_end = (batch_start + batch_size).min(frames.len());
            let batch_frames = &frames[batch_start..batch_end];

            println!(
                "🚀 Traitement batch {}-{} ({} frames)",
                batch_start,
                batch_end - 1,
                batch_frames.len()
            );

            for (i, frame) in batch_frames.iter().enumerate() {
                let global_index = batch_start + i;
                interpolated_frames.push(frame.clone());

                if global_index == frames.len() - 1 {
                    continue;
                }

                let frame1 = frame;
                let frame2 = &frames[global_index + 1];

                for f in 1..=options.factor {
                    let alpha = f as f32 / (options.factor + 1) as f32;
                    let interpolated =
                        self.interpolate_single_pair(frame1, frame2, alpha, options.method)?;
                    interpolated_frames.push(interpolated);
                }
            }

            if batch_start % (batch_size * 2) == 0 {
                self.smart_cache_cleanup();
            }

            if batch_start % (batch_size * 4) == 0 {
                self.optimize_memory_usage();
            }
        }

        self.clear_cache();

        println!("{}", self.get_memory_stats());

        println!(
            "✅ Interpolation terminée : {} → {} frames",
            frames.len(),
            interpolated_frames.len()
        );
        Ok(interpolated_frames)
    }

    fn interpolate_single_pair(
        &self,
        frame1: &DynamicImage,
        frame2: &DynamicImage,
        alpha: f32,
        method: InterpolationMethod,
    ) -> Result<DynamicImage> {
        match method {
            InterpolationMethod::LucasKanade => {
                self.lucas_kanade_interpolation(frame1, frame2, alpha)
            }
            InterpolationMethod::Blend => self.blend_interpolation(frame1, frame2, alpha),
            InterpolationMethod::MotionFlow => {
                self.motion_flow_interpolation(frame1, frame2, alpha)
            }
            InterpolationMethod::PhaseBased => {
                self.phase_based_interpolation_hybrid(frame1, frame2, alpha)
            }
            InterpolationMethod::Bidirectional => {
                self.bidirectional_interpolation(frame1, frame2, alpha)
            }
            InterpolationMethod::Dissolve => self.dissolve_interpolation(frame1, frame2, alpha),
            InterpolationMethod::BlockBased => {
                self.block_based_interpolation(frame1, frame2, alpha)
            }
            InterpolationMethod::DisplacementMap => {
                self.displacement_map_interpolation(frame1, frame2, alpha)
            }
        }
    }

    pub async fn get_or_create_global() -> Option<Arc<InterpolationEngine>> {
        {
            let global_engine = GLOBAL_INTERPOLATION_ENGINE.lock().await;
            if let Some(ref engine) = *global_engine {
                return Some(engine.clone());
            }
        }

        match Self::new().await {
            Ok(engine) => {
                let arc_engine = Arc::new(engine);
                {
                    let mut global_engine = GLOBAL_INTERPOLATION_ENGINE.lock().await;
                    *global_engine = Some(arc_engine.clone());
                }
                println!("Interpolation engine created and cached");
                Some(arc_engine)
            }
            Err(e) => {
                println!("Failed to create interpolation engine: {}", e);
                None
            }
        }
    }

    pub async fn clear_global_context() {
        let mut global_engine = GLOBAL_INTERPOLATION_ENGINE.lock().await;
        *global_engine = None;
        println!("Global interpolation engine cleared");
    }

    pub fn calculate_optimal_workgroup_size(&self, width: u32, height: u32) -> (u32, u32) {
        let device = self.engine.device();
        let limits = device.limits();
        let features = device.features();

        let max_compute_workgroup_size_x = limits.max_compute_workgroup_size_x;
        let max_compute_workgroup_size_y = limits.max_compute_workgroup_size_y;

        let optimal_x = if features.contains(wgpu::Features::SHADER_F16) {
            ((width + 31) / 32).min(max_compute_workgroup_size_x)
        } else if features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC) {
            ((width + 15) / 16).min(max_compute_workgroup_size_x)
        } else {
            ((width + 7) / 8).min(max_compute_workgroup_size_x)
        };

        let optimal_y = if features.contains(wgpu::Features::SHADER_F16) {
            ((height + 31) / 32).min(max_compute_workgroup_size_y)
        } else if features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC) {
            ((height + 15) / 16).min(max_compute_workgroup_size_y)
        } else {
            ((height + 7) / 8).min(max_compute_workgroup_size_y)
        };

        (optimal_x.max(1), optimal_y.max(1))
    }

    pub fn calculate_optimal_batch_size(&self, total_frames: usize) -> usize {
        let device = self.engine.device();
        let limits = device.limits();
        let features = device.features();

        let max_storage_buffers = limits.max_storage_buffers_per_shader_stage;
        let max_uniform_buffers = limits.max_uniform_buffers_per_shader_stage;

        let optimal_batch = if features.contains(wgpu::Features::SHADER_F16) {
            if total_frames >= 100 {
                (total_frames / 4).max(32).min(64)
            } else if total_frames >= 50 {
                (total_frames / 3).max(16).min(32)
            } else {
                (total_frames / 2).max(8).min(16)
            }
        } else if features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC) {
            if total_frames >= 100 {
                (total_frames / 4).max(16).min(32)
            } else if total_frames >= 50 {
                (total_frames / 3).max(8).min(16)
            } else {
                (total_frames / 2).max(4).min(8)
            }
        } else {
            if total_frames >= 100 {
                (total_frames / 6).max(8).min(16)
            } else if total_frames >= 50 {
                (total_frames / 4).max(4).min(8)
            } else {
                (total_frames / 3).max(2).min(4)
            }
        };

        optimal_batch
            .min(max_storage_buffers as usize)
            .min(max_uniform_buffers as usize)
    }

    pub fn analyze_gpu_performance(&self) -> String {
        let device = self.engine.device();
        let device_features = device.features();
        let device_limits = device.limits();

        let mut analysis = String::new();
        analysis.push_str("🎯 Analyse des performances GPU\n");
        analysis.push_str("🔧 Device WGPU initialisé\n");

        if device_features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC) {
            analysis.push_str("✅ Compression BC supportée\n");
        }
        if device_features.contains(wgpu::Features::TEXTURE_COMPRESSION_ETC2) {
            analysis.push_str("✅ Compression ETC2 supportée\n");
        }
        if device_features.contains(wgpu::Features::TEXTURE_COMPRESSION_ASTC) {
            analysis.push_str("✅ Compression ASTC supportée\n");
        }
        if device_features.contains(wgpu::Features::SHADER_F16) {
            analysis.push_str("✅ Shader Float16 supporté\n");
        }
        if device_features.contains(wgpu::Features::MULTI_DRAW_INDIRECT) {
            analysis.push_str("✅ Multi-draw indirect supporté\n");
        }

        analysis.push_str(&format!(
            "📏 Workgroup max: {}x{}x{}\n",
            device_limits.max_compute_workgroup_size_x,
            device_limits.max_compute_workgroup_size_y,
            device_limits.max_compute_workgroup_size_z
        ));
        analysis.push_str(&format!(
            "🔗 Bind groups max: {}\n",
            device_limits.max_bind_groups
        ));
        analysis.push_str(&format!(
            "📦 Storage buffers max: {}\n",
            device_limits.max_storage_buffers_per_shader_stage
        ));
        analysis.push_str(&format!(
            "📊 Uniform buffers max: {}\n",
            device_limits.max_uniform_buffers_per_shader_stage
        ));

        if device_features.contains(wgpu::Features::SHADER_F16) {
            analysis.push_str("🚀 GPU moderne détecté - Optimisations maximales activées\n");
            analysis.push_str("💡 Utilisation de workgroup sizes optimaux (32x32)\n");
            analysis.push_str("💡 Batch processing agressif (64 frames max)\n");
        } else if device_features.contains(wgpu::Features::TEXTURE_COMPRESSION_BC) {
            analysis.push_str("⚡ GPU moyen détecté - Optimisations équilibrées\n");
            analysis.push_str("💡 Utilisation de workgroup sizes moyens (16x16)\n");
            analysis.push_str("💡 Batch processing modéré (32 frames max)\n");
        } else {
            analysis.push_str("🔄 GPU basique détecté - Optimisations de compatibilité\n");
            analysis.push_str("💡 Utilisation de workgroup sizes petits (8x8)\n");
            analysis.push_str("💡 Batch processing conservateur (16 frames max)\n");
        }

        if device_limits.max_compute_workgroup_size_x >= 1024 {
            analysis.push_str("💪 GPU haute performance - Workgroup sizes élevés supportés\n");
        }
        if device_limits.max_storage_buffers_per_shader_stage >= 16 {
            analysis.push_str("💾 Mémoire GPU généreuse - Batching agressif possible\n");
        }

        analysis
    }

    pub fn prewarm_texture_pool(&self, common_sizes: &[(u32, u32)]) {
        println!("🔥 Préchauffage du pool de textures...");

        for &(width, height) in common_sizes {
            let mut texture_pool = self.texture_pool.lock();
            let key = (width, height);

            if !texture_pool.textures.contains_key(&key) {
                texture_pool.grow_pool(self.engine.device(), width, height, 5);
                println!("📏 Préalloué 5 textures {}x{}", width, height);
            }
        }

        println!("✅ Préchauffage terminé");
    }

    pub fn smart_cache_cleanup(&self) {
        println!("🧹 Nettoyage intelligent du cache...");

        {
            let mut bind_cache = self.bind_group_cache.lock();
            bind_cache.cleanup_expired();
            println!("🔗 Cache bind groups nettoyé");
        }

        {
            let mut motion_cache = self.motion_flow_bind_group_cache.lock();
            motion_cache.cleanup_expired();
            println!("🌊 Cache motion flow nettoyé");
        }

        println!("✅ Nettoyage intelligent terminé");
    }

    pub fn clear_cache(&self) {
        println!("🧹 Nettoyage des caches...");

        {
            let bind_cache = self.bind_group_cache.lock();
            bind_cache.cache.clear();
            println!("🔗 Cache bind groups vidé");
        }

        {
            let motion_cache = self.motion_flow_bind_group_cache.lock();
            motion_cache.cache.clear();
            println!("🌊 Cache motion flow vidé");
        }

        {
            let mut fft_cache = self.fft_cache.write();
            fft_cache.clear();
            println!("🧮 Cache FFT vidé");
        }

        {
            let mut uniform_pool = self.uniform_buffer_pool.lock();
            uniform_pool.clear();
            println!("📦 Pool de buffers uniformes vidé");
        }

        println!("✅ Tous les caches ont été nettoyés");
    }

    pub fn optimize_for_size(&self, input_width: u32, input_height: u32) {
        println!(
            "🎯 Optimisation pour la taille {}x{}",
            input_width, input_height
        );

        let mut texture_pool = self.texture_pool.lock();

        for _ in 0..5 {
            texture_pool.acquire(self.engine.device(), input_width, input_height);
        }

        println!(
            "✅ Optimisation pour la taille {}x{} terminée",
            input_width, input_height
        );
    }

    pub fn prewarm_pools(&self, common_sizes: &[(u32, u32)]) {
        println!("🔥 Préchauffage des pools...");

        let mut texture_pool = self.texture_pool.lock();

        for (width, height) in common_sizes {
            for _ in 0..2 {
                texture_pool.acquire(self.engine.device(), *width, *height);
            }
        }

        println!("✅ Préchauffage des pools terminé");
    }

    pub fn optimize_memory_usage(&self) {
        println!("🧠 Optimisation de l'usage mémoire...");

        {
            let texture_pool = self.texture_pool.lock();
            let max_textures_per_size = 10;

            let keys: Vec<_> = texture_pool
                .textures
                .iter()
                .map(|entry| *entry.key())
                .collect();
            for key in keys {
                if let Some(mut texture_list) = texture_pool.textures.get_mut(&key) {
                    if texture_list.len() > max_textures_per_size {
                        texture_list.truncate(max_textures_per_size);
                    }
                }
            }
        }

        {
            let mut uniform_pool = self.uniform_buffer_pool.lock();
            let max_uniform_buffers = 50;
            if uniform_pool.buffers.len() > max_uniform_buffers {
                uniform_pool.buffers.truncate(max_uniform_buffers);
            }
        }

        {
            let (current_cache_size, max_cache_size) = {
                let cache = self.fft_cache.read();
                (cache.results.len(), cache.max_cache_size)
            };

            if current_cache_size > max_cache_size * 80 / 100 {
                let mut cache = self.fft_cache.write();
                cache.clear();
            }
        }

        println!("✅ Optimisation mémoire terminée");
    }

    pub fn cleanup(&self) {
        println!("🧹 Nettoyage complet...");

        {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.textures.clear();
            texture_pool.total_textures = 0;
        }

        {
            let mut uniform_pool = self.uniform_buffer_pool.lock();
            uniform_pool.clear();
        }

        {
            let bind_cache = self.bind_group_cache.lock();
            bind_cache.cache.clear();
        }

        {
            let motion_cache = self.motion_flow_bind_group_cache.lock();
            motion_cache.cache.clear();
        }

        {
            let mut fft_cache = self.fft_cache.write();
            fft_cache.clear();
        }

        println!("✅ Nettoyage complet terminé");
    }

    pub fn get_memory_stats(&self) -> String {
        let mut stats = String::new();
        stats.push_str("📊 Statistiques mémoire du moteur d'interpolation\n");

        {
            let texture_pool = self.texture_pool.lock();
            stats.push_str(&format!(
                "🎨 Pool de textures: {} textures totales\n",
                texture_pool.total_textures
            ));
            stats.push_str(&format!(
                "📏 Tailles disponibles: {}\n",
                texture_pool.textures.len()
            ));
        }

        {
            let uniform_pool = self.uniform_buffer_pool.lock();
            stats.push_str(&format!(
                "📦 Buffers uniformes: {}\n",
                uniform_pool.buffers.len()
            ));
        }

        {
            let bind_cache = self.bind_group_cache.lock();
            stats.push_str(&format!(
                "🔗 Cache bind groups: {}\n",
                bind_cache.cache.len()
            ));

            let motion_cache = self.motion_flow_bind_group_cache.lock();
            stats.push_str(&format!(
                "🌊 Cache motion flow: {}\n",
                motion_cache.cache.len()
            ));
        }

        {
            let cache = self.fft_cache.read();
            stats.push_str(&format!(
                "🧮 Cache FFT: {} résultats\n",
                cache.results.len()
            ));
        }

        stats
    }
}
