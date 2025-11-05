use dashmap::DashMap;
use image::{DynamicImage, Rgba, RgbaImage};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use std::{error::Error, fmt, sync::Arc};

use crate::effects::core::{
    cpu::simd::apply_blend_simd,
    gpu::{blend_modes_gpu::GpuBlendContext, common::GpuTexture},
};
use crate::renderer::get_current_renderer_preference;
use crate::types::BlendMode;
use wgpu;

static GLOBAL_GPU_CONTEXT: Lazy<Mutex<Option<Arc<GpuBlendContext>>>> =
    Lazy::new(|| Mutex::new(None));

static TEMP_TEXTURE_POOL: Lazy<DashMap<(u32, u32), Vec<GpuTexture>>> = Lazy::new(|| DashMap::new());

#[derive(Debug)]
pub enum BlendError {
    ImageCreation(String),
}

impl fmt::Display for BlendError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            BlendError::ImageCreation(msg) => write!(f, "Failed to create image: {}", msg),
        }
    }
}

impl Error for BlendError {}

pub struct BlendConverter {
    image_buffer: Option<RgbaImage>,
    gpu_context: Option<Arc<GpuBlendContext>>,
    user_preferred_renderer: String,
}

impl Drop for BlendConverter {
    fn drop(&mut self) {
        if let Some(gpu_ctx) = self.gpu_context.take() {
            gpu_ctx.manager.device().poll(wgpu::Maintain::Poll);
            drop(gpu_ctx);
        }
        self.image_buffer.take();
        Self::cleanup_temp_texture_pool();
        println!("✅ [BLEND] BlendConverter cleanup completed");
    }
}

impl BlendConverter {
    fn get_or_create_temp_texture(device: &wgpu::Device, width: u32, height: u32) -> GpuTexture {
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
                    println!(
                        "🗑️ [GPU POOL] Texture temporaire {}x{} détruite",
                        texture.texture().size().width,
                        texture.texture().size().height
                    );
                }
            }
        }
    }

    pub fn new(image_data: &[u8], width: u32, height: u32) -> Result<Self, BlendError> {
        Self::new_with_renderer_preference(image_data, width, height, None)
    }

    pub fn new_with_renderer_preference(
        image_data: &[u8],
        width: u32,
        height: u32,
        renderer_preference: Option<String>,
    ) -> Result<Self, BlendError> {
        if image_data.len() != (width * height * 4) as usize {
            return Err(BlendError::ImageCreation(format!(
                "Invalid image data length. Expected {} bytes, got {} bytes",
                width * height * 4,
                image_data.len()
            )));
        }

        for i in (0..image_data.len()).step_by(4) {
            if i + 3 >= image_data.len() {
                return Err(BlendError::ImageCreation(
                    "Invalid RGBA data length".to_string(),
                ));
            }
        }

        let image_buffer = Self::create_rgba_image(image_data, width, height)?;

        let preferred_renderer =
            renderer_preference.unwrap_or_else(|| get_current_renderer_preference());

        let gpu_context = if preferred_renderer == "gpu" {
            match Self::get_or_create_gpu_context() {
                Some(ctx) => {
                    println!("GPU blend context ready");
                    Some(ctx)
                }
                None => {
                    println!("Failed to get GPU blend context. Falling back to CPU.");
                    None
                }
            }
        } else {
            None
        };

        Ok(Self {
            image_buffer: Some(image_buffer),
            gpu_context,
            user_preferred_renderer: preferred_renderer,
        })
    }

    pub async fn initialize_global_gpu_context() -> Option<Arc<GpuBlendContext>> {
        // First check if already initialized
        {
            let global_ctx = if let Some(ctx) = GLOBAL_GPU_CONTEXT.try_lock() {
                ctx
            } else {
                eprintln!("⚠️ [BLEND] Failed to lock global GPU context, returning None");
                return None;
            };

            if let Some(ref ctx) = *global_ctx {
                return Some(ctx.clone());
            }
            // Lock is dropped here
        }

        // Create context without holding the lock (await is outside the lock)
        match GpuBlendContext::new().await {
            Ok(ctx) => {
                let arc_ctx = Arc::new(ctx);

                // Now lock again to store the result
                if let Some(mut global_ctx) = GLOBAL_GPU_CONTEXT.try_lock() {
                    *global_ctx = Some(arc_ctx.clone());
                    println!("GPU blend context created and cached");
                    Some(arc_ctx)
                } else {
                    eprintln!("⚠️ [BLEND] Failed to lock global GPU context for storing");
                    Some(arc_ctx)
                }
            }
            Err(e) => {
                println!("Failed to create GPU blend context: {}", e);
                None
            }
        }
    }

    fn get_or_create_gpu_context() -> Option<Arc<GpuBlendContext>> {
        let global_ctx = if let Some(ctx) = GLOBAL_GPU_CONTEXT.try_lock() {
            ctx
        } else {
            eprintln!("⚠️ [BLEND] Failed to lock global GPU context, returning None");
            return None;
        };

        if let Some(ref ctx) = *global_ctx {
            return Some(ctx.clone());
        }

        // GPU context must be initialized via initialize_global_gpu_context() first
        None
    }

    pub fn clear_global_gpu_context() {
        Self::cleanup_temp_texture_pool();

        if let Some(mut global_ctx) = GLOBAL_GPU_CONTEXT.try_lock() {
            if let Some(ctx) = global_ctx.take() {
                drop(ctx);
            }
            println!("✅ [BLEND] Global GPU blend context cleared");
        } else {
            eprintln!("⚠️ [BLEND] Failed to lock global GPU context for cleanup");
        }

        println!("✅ [BLEND] Comprehensive GPU context cleanup completed");
    }

    pub fn apply_blend_mode(
        &mut self,
        overlay: &[u8],
        blend_mode: BlendMode,
        opacity: f32,
    ) -> Result<(), Box<dyn Error>> {
        self.validate_blend_mode(blend_mode)?;

        if self.user_preferred_renderer == "cpu" || self.gpu_context.is_none() {
            return self.apply_cpu_blend(overlay, blend_mode, opacity);
        }

        match self.try_gpu_blend(overlay, blend_mode, opacity) {
            Ok(result) => Ok(result),
            Err(e) => {
                println!(
                    "GPU {:?} blend failed, falling back to CPU: {}",
                    blend_mode, e
                );
                Self::clear_global_gpu_context();
                self.apply_cpu_blend(overlay, blend_mode, opacity)
            }
        }
    }

    fn try_gpu_blend(
        &mut self,
        overlay: &[u8],
        blend_mode: BlendMode,
        opacity: f32,
    ) -> Result<(), Box<dyn Error>> {
        if let (Some(gpu_ctx), Some(base)) = (self.gpu_context.as_ref(), self.image_buffer.as_mut())
        {
            let width = base.width();
            let height = base.height();
            let overlay_image = Self::create_rgba_image(overlay, width, height)?;

            let base_for_blend = base.clone();
            let mut overlay_for_blend = overlay_image.clone();

            if opacity < 1.0 {
                Self::apply_opacity(&mut overlay_for_blend, opacity);
            }

            let base_dynamic = DynamicImage::ImageRgba8(base_for_blend);
            let overlay_dynamic = DynamicImage::ImageRgba8(overlay_for_blend);

            let base_texture = GpuTexture::from_image(
                gpu_ctx.manager.device(),
                gpu_ctx.manager.queue(),
                &base_dynamic,
            )?;

            let overlay_texture = GpuTexture::from_image(
                gpu_ctx.manager.device(),
                gpu_ctx.manager.queue(),
                &overlay_dynamic,
            )?;

            let mut output_texture =
                Self::get_or_create_temp_texture(gpu_ctx.manager.device(), width, height);

            gpu_ctx.processor.apply_blend(
                gpu_ctx.manager.device(),
                gpu_ctx.manager.queue(),
                &base_texture,
                &overlay_texture,
                &mut output_texture,
                blend_mode,
            )?;

            let result_dynamic =
                output_texture.to_image(gpu_ctx.manager.device(), gpu_ctx.manager.queue())?;

            if let DynamicImage::ImageRgba8(result_image) = result_dynamic {
                *base = result_image;
            } else {
                return Err("GPU blend result conversion failed".into());
            }

            Self::return_temp_texture_to_pool(output_texture);

            base_texture.texture().destroy();
            overlay_texture.texture().destroy();

            gpu_ctx.manager.device().poll(wgpu::Maintain::Poll);
        }

        Ok(())
    }

    fn apply_cpu_blend(
        &mut self,
        overlay: &[u8],
        blend_mode: BlendMode,
        opacity: f32,
    ) -> Result<(), Box<dyn Error>> {
        if let Some(base) = &mut self.image_buffer {
            let width = base.width();
            let height = base.height();
            let mut overlay_image = Self::create_rgba_image(overlay, width, height)?;

            if opacity < 1.0 {
                Self::apply_opacity(&mut overlay_image, opacity);
            }

            let result = apply_blend_simd(blend_mode, &overlay_image, base);
            *base = result;
        }

        Ok(())
    }

    fn create_rgba_image(data: &[u8], width: u32, height: u32) -> Result<RgbaImage, BlendError> {
        if width == 0 || height == 0 {
            return Err(BlendError::ImageCreation(
                "Invalid image dimensions".to_string(),
            ));
        }

        let mut image = RgbaImage::new(width, height);
        let stride = width as usize * 4;
        let mut valid_pixels = 0;
        let mut _invalid_pixels = 0;

        for y in 0..height {
            for x in 0..width {
                let offset = (y as usize * stride + x as usize * 4) as usize;
                if offset + 3 >= data.len() {
                    _invalid_pixels += 1;
                    continue;
                }

                let r = data[offset];
                let g = data[offset + 1];
                let b = data[offset + 2];
                let a = data[offset + 3];

                image.put_pixel(x, y, Rgba([r, g, b, a]));
                valid_pixels += 1;
            }
        }

        if valid_pixels == 0 {
            return Err(BlendError::ImageCreation(
                "No valid pixels were converted".to_string(),
            ));
        }

        Ok(image)
    }

    fn apply_opacity(image: &mut RgbaImage, opacity: f32) {
        if opacity == 1.0 {
            return;
        }

        for (_, _, pixel) in image.enumerate_pixels_mut() {
            pixel[0] = (pixel[0] as f32 * opacity) as u8;
            pixel[1] = (pixel[1] as f32 * opacity) as u8;
            pixel[2] = (pixel[2] as f32 * opacity) as u8;
            pixel[3] = (pixel[3] as f32 * opacity) as u8;
        }
    }

    pub fn validate_blend_mode(&self, blend_mode: BlendMode) -> Result<(), BlendError> {
        match blend_mode {
            BlendMode::SourceOver
            | BlendMode::Multiply
            | BlendMode::Screen
            | BlendMode::Overlay
            | BlendMode::Darken
            | BlendMode::Lighten
            | BlendMode::HardLight
            | BlendMode::SoftLight
            | BlendMode::Difference
            | BlendMode::Exclusion
            | BlendMode::ColorDodge
            | BlendMode::ColorBurn
            | BlendMode::Xor
            | BlendMode::SourceIn
            | BlendMode::SourceOut
            | BlendMode::SourceAtop
            | BlendMode::DestinationOver
            | BlendMode::DestinationIn
            | BlendMode::DestinationOut
            | BlendMode::DestinationAtop
            | BlendMode::Lighter
            | BlendMode::Copy
            | BlendMode::Hue
            | BlendMode::Saturation
            | BlendMode::Color
            | BlendMode::Luminosity => Ok(()),
        }
    }

    pub fn get_image(&self) -> Option<&RgbaImage> {
        self.image_buffer.as_ref()
    }
}
