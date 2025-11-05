use image::{DynamicImage, ImageBuffer, Rgba};
use std::cell::RefCell;
use std::error::Error;
use wgpu::{
    BufferDescriptor, BufferUsages, Device, Extent3d, Queue, Texture, TextureDescriptor,
    TextureFormat, TextureUsages,
};

thread_local! {
    static STAGING_BUFFERS: RefCell<Vec<Vec<u8>>> = RefCell::new(Vec::new());
}

fn get_or_create_staging_buffer(size: usize) -> Vec<u8> {
    STAGING_BUFFERS.with(|buffers| {
        let mut buffers = buffers.borrow_mut();

        for i in 0..buffers.len() {
            if buffers[i].len() >= size {
                return buffers.swap_remove(i);
            }
        }

        vec![0u8; size]
    })
}

fn return_staging_buffer(buffer: Vec<u8>) {
    STAGING_BUFFERS.with(|buffers| {
        let mut buffers = buffers.borrow_mut();

        if buffers.len() < 3 {
            buffers.push(buffer);
        }
    });
}

pub fn clear_staging_buffer() {
    STAGING_BUFFERS.with(|buffers| {
        buffers.borrow_mut().clear();
    });
}

pub struct GpuTexture {
    texture: Texture,
    format: TextureFormat,
}

impl Drop for GpuTexture {
    fn drop(&mut self) {}
}

impl GpuTexture {
    pub fn new(device: &Device, width: u32, height: u32, format: TextureFormat) -> Self {
        let texture = device.create_texture(&TextureDescriptor {
            label: Some("GPU Texture"),
            size: Extent3d {
                width,
                height,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format,
            usage: TextureUsages::TEXTURE_BINDING
                | TextureUsages::STORAGE_BINDING
                | TextureUsages::COPY_SRC
                | TextureUsages::COPY_DST
                | TextureUsages::RENDER_ATTACHMENT,
            view_formats: &[],
        });

        Self { texture, format }
    }

    pub fn destroy(&self) {
        self.texture.destroy();
    }

    pub fn from_image(
        device: &Device,
        queue: &Queue,
        image: &DynamicImage,
    ) -> Result<Self, Box<dyn Error>> {
        let rgba = image.to_rgba8();
        let dimensions = rgba.dimensions();

        let texture = device.create_texture(&TextureDescriptor {
            label: Some("GPU Texture"),
            size: Extent3d {
                width: dimensions.0,
                height: dimensions.1,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: TextureFormat::Rgba8Unorm,
            usage: TextureUsages::TEXTURE_BINDING
                | TextureUsages::STORAGE_BINDING
                | TextureUsages::COPY_DST
                | TextureUsages::COPY_SRC,
            view_formats: &[],
        });

        let bytes_per_row = dimensions.0 * 4;
        let aligned_bytes_per_row = ((bytes_per_row + 255) / 256) * 256;
        let buffer_size = (aligned_bytes_per_row * dimensions.1) as usize;

        let mut aligned_buffer = get_or_create_staging_buffer(buffer_size);

        for y in 0..dimensions.1 {
            let src_start = (y * bytes_per_row) as usize;
            let dst_start = (y * aligned_bytes_per_row) as usize;
            aligned_buffer[dst_start..dst_start + bytes_per_row as usize]
                .copy_from_slice(&rgba.as_raw()[src_start..src_start + bytes_per_row as usize]);
        }

        queue.write_texture(
            wgpu::ImageCopyTexture {
                texture: &texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &aligned_buffer,
            wgpu::ImageDataLayout {
                offset: 0,
                bytes_per_row: Some(aligned_bytes_per_row),
                rows_per_image: Some(dimensions.1),
            },
            Extent3d {
                width: dimensions.0,
                height: dimensions.1,
                depth_or_array_layers: 1,
            },
        );

        return_staging_buffer(aligned_buffer);

        Ok(Self {
            texture,
            format: TextureFormat::Rgba8Unorm,
        })
    }

    pub fn to_image(&self, device: &Device, queue: &Queue) -> Result<DynamicImage, Box<dyn Error>> {
        let size = self.texture.size();
        let bytes_per_row = size.width * 4;
        let aligned_bytes_per_row = ((bytes_per_row + 255) / 256) * 256;
        let buffer_size = (aligned_bytes_per_row * size.height) as u64;
        let safe_buffer_size = buffer_size + (256 * size.height) as u64;

        let buffer = device.create_buffer(&BufferDescriptor {
            label: Some("Texture Readback Buffer"),
            size: safe_buffer_size,
            usage: BufferUsages::COPY_DST | BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Texture Readback Encoder"),
        });

        encoder.copy_texture_to_buffer(
            wgpu::ImageCopyTexture {
                texture: &self.texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::ImageCopyBuffer {
                buffer: &buffer,
                layout: wgpu::ImageDataLayout {
                    offset: 0,
                    bytes_per_row: Some(aligned_bytes_per_row),
                    rows_per_image: Some(size.height),
                },
            },
            size,
        );

        queue.submit(std::iter::once(encoder.finish()));

        let buffer_slice = buffer.slice(..);
        let (tx, rx) = crossbeam::channel::bounded(1);
        buffer_slice.map_async(wgpu::MapMode::Read, move |result| {
            let _ = tx.send(result);
        });
        device.poll(wgpu::Maintain::Wait);
        let _ = rx
            .recv()
            .map_err(|e| format!("Failed to receive buffer data: {}", e))?;

        let data = buffer_slice.get_mapped_range();

        let final_size = (size.width * size.height * 4) as usize;

        let mut final_data = get_or_create_staging_buffer(final_size);

        if bytes_per_row % 256 == 0 {
            final_data.copy_from_slice(&data[..final_size]);
        } else {
            for y in 0..size.height {
                let src_start = (y * aligned_bytes_per_row) as usize;
                let dst_start = (y * bytes_per_row) as usize;
                let row_size = (size.width * 4) as usize;
                final_data[dst_start..dst_start + row_size]
                    .copy_from_slice(&data[src_start..src_start + row_size]);
            }
        }

        let image = ImageBuffer::<Rgba<u8>, _>::from_raw(size.width, size.height, final_data)
            .ok_or_else(|| "Failed to create image from buffer")?;

        Ok(DynamicImage::ImageRgba8(image))
    }

    pub fn texture(&self) -> &Texture {
        &self.texture
    }

    pub fn format(&self) -> TextureFormat {
        self.format
    }
}
