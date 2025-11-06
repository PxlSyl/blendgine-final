use dashmap::DashMap;
use once_cell::sync::Lazy;
use parking_lot::RwLock;
use std::fs;
use std::sync::Arc;
use wgpu::{BindGroupLayout, ComputePipeline, Device, Queue};

static GLOBAL_DEVICE: Lazy<RwLock<Option<Arc<Device>>>> = Lazy::new(|| RwLock::new(None));
static GLOBAL_QUEUE: Lazy<RwLock<Option<Arc<Queue>>>> = Lazy::new(|| RwLock::new(None));

pub static SHADER_CACHE: Lazy<DashMap<String, Arc<ComputePipeline>>> = Lazy::new(|| DashMap::new());

pub static BIND_GROUP_LAYOUT_CACHE: Lazy<DashMap<String, Arc<BindGroupLayout>>> =
    Lazy::new(|| DashMap::new());

pub fn initialize_global_device(device: &Arc<Device>, queue: &Arc<Queue>) {
    *GLOBAL_DEVICE.write() = Some(device.clone());
    *GLOBAL_QUEUE.write() = Some(queue.clone());
    println!("🚀 [SHADER CACHE] Global device initialized");
}

pub fn get_global_device() -> Option<Arc<Device>> {
    GLOBAL_DEVICE.read().clone()
}

pub fn get_global_queue() -> Option<Arc<Queue>> {
    GLOBAL_QUEUE.read().clone()
}

pub fn load_shader(device: &Device, shader_name: &str) -> wgpu::ShaderModule {
    let shader_source = load_shader_source(shader_name);

    device.create_shader_module(wgpu::ShaderModuleDescriptor {
        label: Some(&format!("{} Shader", shader_name)),
        source: wgpu::ShaderSource::Wgsl(std::borrow::Cow::Borrowed(&shader_source)),
    })
}

pub fn get_or_create_compute_pipeline(
    shader_name: &str,
    bind_group_layout: &BindGroupLayout,
) -> Arc<ComputePipeline> {
    if let Some(cached_pipeline) = SHADER_CACHE.get(shader_name) {
        println!(
            "🚀 [SHADER CACHE] HIT: Pipeline '{}' récupéré du cache",
            shader_name
        );
        return cached_pipeline.clone();
    }

    let device = get_global_device()
        .expect("Global device not initialized. Call initialize_global_device first!");

    println!(
        "🔨 [SHADER CACHE] MISS: Création pipeline '{}' et ajout au cache",
        shader_name
    );

    let shader_module = load_shader(&device, shader_name);
    let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
        label: Some(&format!("{} Pipeline", shader_name)),
        layout: Some(
            &device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some(&format!("{} Layout", shader_name)),
                bind_group_layouts: &[bind_group_layout],
                push_constant_ranges: &[],
            }),
        ),
        module: &shader_module,
        entry_point: "main",
    });

    let pipeline_arc = Arc::new(pipeline);
    SHADER_CACHE.insert(shader_name.to_string(), pipeline_arc.clone());

    println!(
        "✅ [SHADER CACHE] Pipeline '{}' ajouté au cache",
        shader_name
    );
    pipeline_arc
}

pub fn get_or_create_bind_group_layout(layout_name: &str) -> Arc<BindGroupLayout> {
    if let Some(cached_layout) = BIND_GROUP_LAYOUT_CACHE.get(layout_name) {
        println!(
            "🚀 [SHADER CACHE] HIT: Bind group layout '{}' récupéré du cache",
            layout_name
        );
        return cached_layout.clone();
    }

    let device = get_global_device()
        .expect("Global device not initialized. Call initialize_global_device first!");

    println!(
        "🔨 [SHADER CACHE] MISS: Création bind group layout '{}' et ajout au cache",
        layout_name
    );

    let layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some(&format!("{} Bind Group Layout", layout_name)),
        entries: &[
            wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Texture {
                    sample_type: wgpu::TextureSampleType::Float { filterable: false },
                    view_dimension: wgpu::TextureViewDimension::D2,
                    multisampled: false,
                },
                count: None,
            },
            wgpu::BindGroupLayoutEntry {
                binding: 1,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Texture {
                    sample_type: wgpu::TextureSampleType::Float { filterable: false },
                    view_dimension: wgpu::TextureViewDimension::D2,
                    multisampled: false,
                },
                count: None,
            },
            wgpu::BindGroupLayoutEntry {
                binding: 2,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::StorageTexture {
                    access: wgpu::StorageTextureAccess::WriteOnly,
                    format: wgpu::TextureFormat::Rgba8Unorm,
                    view_dimension: wgpu::TextureViewDimension::D2,
                },
                count: None,
            },
            wgpu::BindGroupLayoutEntry {
                binding: 3,
                visibility: wgpu::ShaderStages::COMPUTE,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: Some(std::num::NonZeroU64::new(16).unwrap()), // f32 = 4 bytes, we need 4 bytes for opacity + padding
                },
                count: None,
            },
        ],
    });

    let layout_arc = Arc::new(layout);
    BIND_GROUP_LAYOUT_CACHE.insert(layout_name.to_string(), layout_arc.clone());

    println!(
        "✅ [SHADER CACHE] Bind group layout '{}' ajouté au cache",
        layout_name
    );
    layout_arc
}

pub fn clear_shader_cache() {
    println!("🧹 [SHADER CACHE] Nettoyage du cache des shaders...");

    let shader_count = SHADER_CACHE.len();
    let layout_count = BIND_GROUP_LAYOUT_CACHE.len();

    SHADER_CACHE.clear();
    BIND_GROUP_LAYOUT_CACHE.clear();

    println!(
        "🧹 [SHADER CACHE] Cache nettoyé: {} shaders, {} layouts supprimés",
        shader_count, layout_count
    );
}

pub fn load_shader_source(shader_name: &str) -> String {
    // Try multiple possible paths for the shader files
    let possible_paths = [
        // When running from project root
        format!(
            "src-tauri/src/effects/core/gpu/shaders/{}.wgsl",
            shader_name
        ),
        // When running from src-tauri directory
        format!("src/effects/core/gpu/shaders/{}.wgsl", shader_name),
        // When running from the executable directory
        format!("shaders/{}.wgsl", shader_name),
    ];

    for path in &possible_paths {
        if let Ok(content) = fs::read_to_string(path) {
            return content;
        }
    }

    // If none of the paths work, panic with a helpful error message
    panic!(
        "Failed to load shader: {}. Tried paths: {:?}",
        shader_name, possible_paths
    );
}
