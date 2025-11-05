use image::DynamicImage;
use once_cell::sync::Lazy;
use parking_lot::RwLock;
use std::{error::Error, fmt, sync::Arc};

use crate::effects::core::{
    cpu::resize_cpu::{
        resize_images, resize_single_image, ResizeAlgorithm, ResizeConfig, ResizeFilter,
    },
    gpu::{common::GpuTexture, resize_gpu::ResizeGpu, GpuEffectManager, GpuImage},
};

use crate::renderer::get_current_renderer_preference;

static GLOBAL_GPU_MANAGER: Lazy<RwLock<Option<Arc<GpuEffectManager>>>> =
    Lazy::new(|| RwLock::new(None));

#[derive(Debug)]
pub enum ResizeError {
    ImageCreation(String),
    InvalidDimensions(String),
    GpuError(String),
}

impl fmt::Display for ResizeError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ResizeError::ImageCreation(msg) => write!(f, "Failed to create image: {}", msg),
            ResizeError::InvalidDimensions(msg) => write!(f, "Invalid dimensions: {}", msg),
            ResizeError::GpuError(msg) => write!(f, "GPU error: {}", msg),
        }
    }
}

impl Error for ResizeError {}

pub struct ResizeConverter {
    gpu_manager: Option<Arc<GpuEffectManager>>,
    resize_gpu: Option<ResizeGpu>,
    user_preferred_renderer: String,
}

impl ResizeConverter {
    pub fn new() -> Result<Self, ResizeError> {
        Self::new_with_renderer_preference(None)
    }

    pub fn new_with_renderer_preference(
        renderer_preference: Option<String>,
    ) -> Result<Self, ResizeError> {
        let preferred_renderer =
            renderer_preference.unwrap_or_else(|| get_current_renderer_preference());

        let gpu_manager = if preferred_renderer == "gpu" {
            match Self::get_or_create_gpu_manager() {
                Some(manager) => {
                    println!("GPU resize manager ready");
                    Some(manager)
                }
                None => {
                    println!("Failed to get GPU resize manager. Falling back to CPU.");
                    None
                }
            }
        } else {
            None
        };

        let resize_gpu = if let Some(manager) = gpu_manager.as_ref() {
            match ResizeGpu::new(manager.device(), manager.queue()) {
                Ok(gpu) => {
                    println!("GPU resize effect created successfully");
                    Some(gpu)
                }
                Err(e) => {
                    println!("Failed to create GPU resize effect: {}", e);
                    None
                }
            }
        } else {
            None
        };

        Ok(Self {
            gpu_manager,
            resize_gpu,
            user_preferred_renderer: preferred_renderer,
        })
    }

    fn get_or_create_gpu_manager() -> Option<Arc<GpuEffectManager>> {
        // 🎯 Optimisation: Lecture d'abord pour éviter l'écriture si possible
        {
            let read_guard = GLOBAL_GPU_MANAGER.read();
            if let Some(ref manager) = *read_guard {
                return Some(manager.clone());
            }
        } // read_guard est libéré ici

        // 🎯 Écriture seulement si nécessaire (création)
        let mut global_manager = if let Some(manager) = GLOBAL_GPU_MANAGER.try_write() {
            manager
        } else {
            eprintln!(
                "⚠️ [RESIZE] Failed to acquire write lock on global GPU manager, returning None"
            );
            return None;
        };

        // 🎯 Double-check: vérifier à nouveau après avoir acquis l'écriture
        if let Some(ref manager) = *global_manager {
            return Some(manager.clone());
        }

        match GpuEffectManager::new() {
            Ok(manager) => {
                let arc_manager = Arc::new(manager);
                *global_manager = Some(arc_manager.clone());
                println!("GPU resize manager created and cached");
                Some(arc_manager)
            }
            Err(e) => {
                println!("Failed to create GPU resize manager: {}", e);
                None
            }
        }
    }

    pub fn clear_global_gpu_manager() {
        if let Some(mut global_manager) = GLOBAL_GPU_MANAGER.try_write() {
            *global_manager = None;
            println!("Global GPU resize manager cleared");
        } else {
            eprintln!("⚠️ [RESIZE] Failed to acquire write lock on global GPU manager for cleanup");
        }
    }

    pub fn resize_single_image(
        &self,
        image: &DynamicImage,
        width: u32,
        height: u32,
        resize_config: &Option<ResizeConfig>,
    ) -> Result<DynamicImage, Box<dyn Error>> {
        if width == 0 || height == 0 {
            return Err(Box::new(ResizeError::InvalidDimensions(format!(
                "Invalid dimensions: {}x{}",
                width, height
            ))));
        }

        if self.user_preferred_renderer == "cpu" || self.gpu_manager.is_none() {
            return resize_single_image(image, width, height, resize_config).map_err(|e| {
                Box::new(ResizeError::ImageCreation(e.to_string())) as Box<dyn Error>
            });
        }

        match self.try_gpu_resize_single(image, width, height, resize_config) {
            Ok(result) => Ok(result),
            Err(e) => {
                println!("GPU resize failed, falling back to CPU: {}", e);
                Self::clear_global_gpu_manager();
                resize_single_image(image, width, height, resize_config).map_err(|e| {
                    Box::new(ResizeError::ImageCreation(e.to_string())) as Box<dyn Error>
                })
            }
        }
    }

    pub fn resize_images(
        &self,
        frames: &[DynamicImage],
        width: u32,
        height: u32,
        resize_config: &Option<ResizeConfig>,
    ) -> Result<Vec<DynamicImage>, Box<dyn Error>> {
        if width == 0 || height == 0 {
            return Err(Box::new(ResizeError::InvalidDimensions(format!(
                "Invalid dimensions: {}x{}",
                width, height
            ))));
        }

        if frames.is_empty() {
            return Ok(Vec::new());
        }

        if self.user_preferred_renderer == "cpu" || self.gpu_manager.is_none() {
            return resize_images(frames, width, height, resize_config).map_err(|e| {
                Box::new(ResizeError::ImageCreation(e.to_string())) as Box<dyn Error>
            });
        }

        match self.try_gpu_resize_batch(frames, width, height, resize_config) {
            Ok(result) => Ok(result),
            Err(e) => {
                println!("GPU batch resize failed, falling back to CPU: {}", e);
                Self::clear_global_gpu_manager();
                resize_images(frames, width, height, resize_config).map_err(|e| {
                    Box::new(ResizeError::ImageCreation(e.to_string())) as Box<dyn Error>
                })
            }
        }
    }

    fn try_gpu_resize_single(
        &self,
        image: &DynamicImage,
        width: u32,
        height: u32,
        resize_config: &Option<ResizeConfig>,
    ) -> Result<DynamicImage, Box<dyn Error>> {
        if let (Some(gpu_manager), Some(resize_gpu)) =
            (self.gpu_manager.as_ref(), self.resize_gpu.as_ref())
        {
            let input_texture =
                GpuTexture::from_image(gpu_manager.device(), gpu_manager.queue(), image)?;

            let output_texture =
                GpuTexture::new(gpu_manager.device(), width, height, input_texture.format());

            let algorithm = Self::map_resize_algorithm(resize_config);
            let filter_type = Self::map_resize_filter(resize_config);
            let super_sampling_factor = Self::map_super_sampling_factor(resize_config);

            let input_gpu_image = GpuImage::new(
                input_texture.texture(),
                input_texture.texture().size().width,
                input_texture.texture().size().height,
            );
            let output_gpu_image = GpuImage::new(output_texture.texture(), width, height);

            resize_gpu.apply_resize(
                gpu_manager.device(),
                gpu_manager.queue(),
                &input_gpu_image,
                &output_gpu_image,
                algorithm,
                filter_type,
                super_sampling_factor,
            )?;

            let result_dynamic =
                output_texture.to_image(gpu_manager.device(), gpu_manager.queue())?;
            Ok(result_dynamic)
        } else {
            Err(Box::new(ResizeError::GpuError(
                "No GPU manager or resize effect available".to_string(),
            )))
        }
    }

    fn map_resize_algorithm(config: &Option<ResizeConfig>) -> u32 {
        if let Some(config) = config {
            match config.algorithm {
                ResizeAlgorithm::Nearest => 0,
                ResizeAlgorithm::Convolution => 1,
                ResizeAlgorithm::Interpolation => 1,
                ResizeAlgorithm::SuperSampling => 3,
            }
        } else {
            1
        }
    }

    fn map_resize_filter(config: &Option<ResizeConfig>) -> u32 {
        if let Some(config) = config {
            if let Some(filter) = &config.filter {
                match filter {
                    ResizeFilter::Nearest => 0,
                    ResizeFilter::Bilinear => 1,
                    ResizeFilter::Bicubic => 2,
                    ResizeFilter::Lanczos => 3,
                    ResizeFilter::Hamming => 4,
                    ResizeFilter::Mitchell => 5,
                    ResizeFilter::Gaussian => 6,
                }
            } else {
                3
            }
        } else {
            3
        }
    }

    fn map_super_sampling_factor(config: &Option<ResizeConfig>) -> u32 {
        if let Some(config) = config {
            if let Some(factor) = config.super_sampling_factor {
                factor as u32
            } else {
                2
            }
        } else {
            2
        }
    }

    fn try_gpu_resize_batch(
        &self,
        frames: &[DynamicImage],
        width: u32,
        height: u32,
        resize_config: &Option<ResizeConfig>,
    ) -> Result<Vec<DynamicImage>, Box<dyn Error>> {
        if let (Some(gpu_manager), Some(resize_gpu)) =
            (self.gpu_manager.as_ref(), self.resize_gpu.as_ref())
        {
            let algorithm = Self::map_resize_algorithm(resize_config);
            let filter_type = Self::map_resize_filter(resize_config);
            let super_sampling_factor = Self::map_super_sampling_factor(resize_config);

            let mut results = Vec::with_capacity(frames.len());

            for frame in frames {
                let input_texture =
                    GpuTexture::from_image(gpu_manager.device(), gpu_manager.queue(), frame)?;

                let output_texture =
                    GpuTexture::new(gpu_manager.device(), width, height, input_texture.format());

                let input_gpu_image = GpuImage::new(
                    input_texture.texture(),
                    input_texture.texture().size().width,
                    input_texture.texture().size().height,
                );
                let output_gpu_image = GpuImage::new(output_texture.texture(), width, height);

                resize_gpu.apply_resize(
                    gpu_manager.device(),
                    gpu_manager.queue(),
                    &input_gpu_image,
                    &output_gpu_image,
                    algorithm,
                    filter_type,
                    super_sampling_factor,
                )?;

                let result_dynamic =
                    output_texture.to_image(gpu_manager.device(), gpu_manager.queue())?;
                results.push(result_dynamic);
            }

            Ok(results)
        } else {
            Err(Box::new(ResizeError::GpuError(
                "No GPU manager or resize effect available".to_string(),
            )))
        }
    }
}
