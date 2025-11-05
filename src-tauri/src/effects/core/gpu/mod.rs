use std::error::Error;
use std::sync::Arc;
use wgpu::{Backends, Device, Instance, Queue, Texture};

pub mod blend_modes_gpu;
pub mod common;
pub mod resize_gpu;
pub mod shaders;

#[derive(Debug)]
pub enum GpuError {
    InitializationError(String),
    DeviceError(String),
}

impl std::fmt::Display for GpuError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GpuError::InitializationError(msg) => write!(f, "GPU initialization error: {}", msg),
            GpuError::DeviceError(msg) => write!(f, "GPU device error: {}", msg),
        }
    }
}

impl Error for GpuError {}

pub struct GpuImage<'a> {
    pub texture: &'a Texture,
    pub width: u32,
    pub height: u32,
}

impl<'a> GpuImage<'a> {
    pub fn new(texture: &'a Texture, width: u32, height: u32) -> Self {
        Self {
            texture,
            width,
            height,
        }
    }
}

pub struct GpuEffectManager {
    pub device: Arc<Device>,
    pub queue: Arc<Queue>,
}

impl Drop for GpuEffectManager {
    fn drop(&mut self) {}
}

impl GpuEffectManager {
    pub async fn new() -> Result<Self, GpuError> {
        let instance = Instance::new(wgpu::InstanceDescriptor {
            backends: Backends::all(),
            dx12_shader_compiler: Default::default(),
        });

        let adapter = match instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                force_fallback_adapter: false,
                compatible_surface: None,
            })
            .await
        {
            Some(adapter) => adapter,
            _none => {
                return Err(GpuError::InitializationError(
                    "No GPU adapter found".to_string(),
                ));
            }
        };

        let (device, queue) = match adapter
            .request_device(
                &wgpu::DeviceDescriptor {
                    label: Some("GPU Effect Device"),
                    features: wgpu::Features::TEXTURE_ADAPTER_SPECIFIC_FORMAT_FEATURES,
                    limits: wgpu::Limits::default(),
                },
                None,
            )
            .await
        {
            Ok((device, queue)) => (device, queue),
            Err(e) => {
                return Err(GpuError::DeviceError(format!(
                    "Failed to create GPU device: {}",
                    e
                )));
            }
        };

        let device = Arc::new(device);
        let queue = Arc::new(queue);

        // Initialize global device for shader cache
        shaders::initialize_global_device(&device, &queue);

        let manager = Self { device, queue };

        if !manager.is_available() {
            return Err(GpuError::InitializationError(
                "GPU is not capable of running effects".to_string(),
            ));
        }

        Ok(manager)
    }

    pub fn is_available(&self) -> bool {
        let limits = self.device.limits();

        if limits.max_texture_dimension_2d < 512 {
            return false;
        }

        if limits.max_compute_workgroups_per_dimension < 1024 {
            return false;
        }

        if limits.max_bind_groups < 3 {
            return false;
        }

        true
    }

    pub fn device(&self) -> &Device {
        &self.device
    }

    pub fn queue(&self) -> &Queue {
        &self.queue
    }
}
