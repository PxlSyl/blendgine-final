pub mod interpolation;
pub mod methods;
pub mod pipelines;
pub mod utils;

pub use interpolation::*;

use crate::types::InterpolationMethod;
use anyhow::Result;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use std::sync::Arc;
use wgpu::{
    Backends, Device, DeviceDescriptor, Features, Instance, InstanceDescriptor, Limits,
    PowerPreference, Queue, RequestAdapterOptions,
};

pub struct WgpuEngine {
    device: Device,
    queue: Queue,
}

impl WgpuEngine {
    pub fn new() -> Result<Self> {
        let rt = tokio::runtime::Runtime::new()
            .map_err(|e| anyhow::anyhow!("Failed to create runtime: {}", e))?;

        rt.block_on(async {
            let instance = Instance::new(InstanceDescriptor {
                backends: Backends::all(),
                dx12_shader_compiler: Default::default(),
            });

            let adapter = instance
                .request_adapter(&RequestAdapterOptions {
                    power_preference: PowerPreference::default(),
                    compatible_surface: None,
                    force_fallback_adapter: false,
                })
                .await
                .ok_or_else(|| anyhow::anyhow!("Failed to find an appropriate adapter"))?;

            let (device, queue) = adapter
                .request_device(
                    &DeviceDescriptor {
                        label: Some("WGPU Engine Device"),
                        features: Features::empty(),
                        limits: Limits::default(),
                    },
                    None,
                )
                .await?;

            Ok(Self { device, queue })
        })
    }

    pub fn device(&self) -> &Device {
        &self.device
    }

    pub fn queue(&self) -> &Queue {
        &self.queue
    }
}

static GLOBAL_INTERPOLATION_ENGINE: Lazy<Mutex<Option<Arc<InterpolationEngine>>>> =
    Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone)]
pub struct InterpolationOptions {
    pub method: InterpolationMethod,
    pub factor: u32,
}
