use crate::effects::core::interpolate::interpolation::{InterpolationEngine, TexturePool};
use anyhow::Result;
use image::{DynamicImage, RgbaImage};
use std::{
    iter::once,
    sync::{Arc, Mutex},
};
use wgpu::{
    BufferDescriptor, BufferUsages, CommandEncoderDescriptor, Extent3d, ImageCopyBuffer,
    ImageCopyTexture, ImageDataLayout, Maintain, MapMode, Origin3d, Texture, TextureAspect,
};

impl InterpolationEngine {
    pub fn create_texture_from_image_pooled(
        &self,
        image: &DynamicImage,
        texture_pool: &mut TexturePool,
    ) -> Result<Texture> {
        let rgba_image = image.to_rgba8();
        let (width, height) = rgba_image.dimensions();

        let texture = texture_pool.acquire(self.engine.device(), width, height);

        self.engine.queue().write_texture(
            ImageCopyTexture {
                texture: &texture,
                mip_level: 0,
                origin: Origin3d::ZERO,
                aspect: TextureAspect::All,
            },
            &rgba_image,
            ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(4 * width),
                rows_per_image: Some(height),
            },
            Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
        );

        Ok(texture)
    }

    pub fn read_texture_to_image(&self, texture: &Texture) -> Result<DynamicImage> {
        let width = texture.width();
        let height = texture.height();

        let bytes_per_pixel = 4;
        let bytes_per_row = width * bytes_per_pixel;
        let alignment = 256;
        let aligned_bytes_per_row = ((bytes_per_row + alignment - 1) / alignment) * alignment;

        let buffer_size = aligned_bytes_per_row as u64 * height as u64;
        let buffer = self.engine.device().create_buffer(&BufferDescriptor {
            label: Some("Texture Read Buffer"),
            size: buffer_size,
            usage: BufferUsages::COPY_DST | BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        let mut encoder = self
            .engine
            .device()
            .create_command_encoder(&CommandEncoderDescriptor::default());
        encoder.copy_texture_to_buffer(
            ImageCopyTexture {
                texture,
                mip_level: 0,
                origin: Origin3d::ZERO,
                aspect: TextureAspect::All,
            },
            ImageCopyBuffer {
                buffer: &buffer,
                layout: ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(aligned_bytes_per_row),
                    rows_per_image: Some(height),
                },
            },
            Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
        );

        self.engine.queue().submit(once(encoder.finish()));

        self.engine.device().poll(Maintain::Wait);

        let buffer_slice = buffer.slice(..);

        let mapping_complete = Arc::new(Mutex::new(false));
        let mapping_error = Arc::new(Mutex::new(None::<wgpu::BufferAsyncError>));

        let mapping_complete_clone = Arc::clone(&mapping_complete);
        let mapping_error_clone = Arc::clone(&mapping_error);

        buffer_slice.map_async(MapMode::Read, move |result| {
            let mut complete = mapping_complete_clone.lock().unwrap();
            *complete = true;

            if let Err(e) = result {
                let mut error = mapping_error_clone.lock().unwrap();
                *error = Some(e);
            }
        });

        loop {
            {
                let complete = mapping_complete.lock().unwrap();
                if *complete {
                    break;
                }
            }
            self.engine.device().poll(Maintain::Wait);
        }

        {
            let error = mapping_error.lock().unwrap();
            if let Some(ref error) = *error {
                return Err(anyhow::anyhow!("Failed to map buffer: {}", error));
            }
        }

        let data = buffer_slice.get_mapped_range();

        let mut image_data = Vec::with_capacity((width * height * 4) as usize);
        for row in 0..height {
            let row_start = (row * aligned_bytes_per_row) as usize;
            let row_end = row_start + bytes_per_row as usize;
            image_data.extend_from_slice(&data[row_start..row_end]);
        }

        // Validate buffer size before creating image
        let expected_size = (width * height * 4) as usize;
        let actual_size = image_data.len();
        if actual_size != expected_size {
            return Err(anyhow::anyhow!(
                "Buffer size mismatch: expected {} bytes for {}x{} image, got {} bytes. bytes_per_row={}, aligned={}",
                expected_size, width, height, actual_size, bytes_per_row, aligned_bytes_per_row
            ));
        }

        let rgba = RgbaImage::from_raw(width, height, image_data)
            .ok_or_else(|| anyhow::anyhow!("Failed to create image from raw data"))?;

        Ok(DynamicImage::ImageRgba8(rgba))
    }
}
