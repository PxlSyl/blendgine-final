use crate::effects::core::gpu::{common::GpuTexture, shaders, GpuImage};
use image::DynamicImage;
use serde::{Deserialize, Serialize};
use std::error::Error;
use wgpu::{Device, Queue};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum ResizeAlgorithm {
    Nearest,
    Convolution,
    Interpolation,
    SuperSampling,
}

impl Default for ResizeAlgorithm {
    fn default() -> Self {
        Self::Convolution
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum ResizeFilter {
    Nearest,
    Bilinear,
    Bicubic,
    Lanczos,
    Hamming,
    Mitchell,
    Gaussian,
}

impl Default for ResizeFilter {
    fn default() -> Self {
        Self::Lanczos
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResizeConfig {
    pub algorithm: ResizeAlgorithm,
    pub filter: Option<ResizeFilter>,
    pub super_sampling_factor: Option<u8>,
}

impl Default for ResizeConfig {
    fn default() -> Self {
        Self {
            algorithm: ResizeAlgorithm::Convolution,
            filter: Some(ResizeFilter::Lanczos),
            super_sampling_factor: None,
        }
    }
}

#[repr(C, align(16))]
#[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    src_width: f32,
    src_height: f32,
    dst_width: f32,
    dst_height: f32,
    algorithm: u32,
    filter_type: u32,
    super_sampling_factor: u32,
    _padding: u32,
}

pub struct ResizeGpu {
    pipeline: wgpu::ComputePipeline,
    bind_group_layout: wgpu::BindGroupLayout,
    uniform_buffer: wgpu::Buffer,
}

impl Drop for ResizeGpu {
    fn drop(&mut self) {}
}

impl ResizeGpu {
    pub fn map_resize_algorithm(config: &Option<ResizeConfig>) -> u32 {
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

    pub fn map_resize_filter(config: &Option<ResizeConfig>) -> u32 {
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

    pub fn map_super_sampling_factor(config: &Option<ResizeConfig>) -> u32 {
        if let Some(config) = config {
            config.super_sampling_factor.unwrap_or(2) as u32
        } else {
            2
        }
    }

    pub fn resize_images(
        &self,
        device: &Device,
        queue: &Queue,
        frames: &[DynamicImage],
        width: u32,
        height: u32,
        resize_config: &Option<ResizeConfig>,
    ) -> Result<Vec<DynamicImage>, Box<dyn Error>> {
        if width == 0 || height == 0 {
            return Err(format!("Invalid dimensions: {}x{}", width, height).into());
        }

        if frames.is_empty() {
            return Ok(Vec::new());
        }

        let algorithm = Self::map_resize_algorithm(resize_config);
        let filter_type = Self::map_resize_filter(resize_config);
        let super_sampling_factor = Self::map_super_sampling_factor(resize_config);

        let mut results = Vec::with_capacity(frames.len());

        for frame in frames {
            let input_texture = GpuTexture::from_image(device, queue, frame)?;
            let output_texture = GpuTexture::new(device, width, height, input_texture.format());

            let input_gpu_image = GpuImage::new(
                input_texture.texture(),
                input_texture.texture().size().width,
                input_texture.texture().size().height,
            );
            let output_gpu_image = GpuImage::new(output_texture.texture(), width, height);

            self.apply_resize(
                device,
                queue,
                &input_gpu_image,
                &output_gpu_image,
                algorithm,
                filter_type,
                super_sampling_factor,
            )?;

            let result_dynamic = output_texture.to_image(device, queue)?;
            results.push(result_dynamic);
        }

        Ok(results)
    }

    pub fn new(device: &Device, _queue: &Queue) -> Result<Self, Box<dyn Error>> {
        let shader = shaders::load_shader(device, "resize");

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("Resize Bind Group Layout"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::COMPUTE,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
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
            ],
        });

        let pipeline_layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("Resize Pipeline Layout"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
            label: Some("Resize Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        });

        let uniform_buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("Resize Uniform Buffer"),
            size: std::mem::size_of::<Uniforms>() as u64,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        Ok(Self {
            pipeline,
            bind_group_layout,
            uniform_buffer,
        })
    }

    pub fn apply_resize(
        &self,
        device: &Device,
        queue: &Queue,
        input: &GpuImage,
        output: &GpuImage,
        algorithm: u32,
        filter_type: u32,
        super_sampling_factor: u32,
    ) -> Result<(), Box<dyn Error>> {
        let uniforms = Uniforms {
            src_width: input.width as f32,
            src_height: input.height as f32,
            dst_width: output.width as f32,
            dst_height: output.height as f32,
            algorithm,
            filter_type,
            super_sampling_factor,
            _padding: 0,
        };

        queue.write_buffer(&self.uniform_buffer, 0, bytemuck::cast_slice(&[uniforms]));

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("Resize Bind Group"),
            layout: &self.bind_group_layout,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: self.uniform_buffer.as_entire_binding(),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::TextureView(
                        &input
                            .texture
                            .create_view(&wgpu::TextureViewDescriptor::default()),
                    ),
                },
                wgpu::BindGroupEntry {
                    binding: 2,
                    resource: wgpu::BindingResource::TextureView(
                        &output
                            .texture
                            .create_view(&wgpu::TextureViewDescriptor::default()),
                    ),
                },
            ],
        });

        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("Resize Command Encoder"),
        });

        let mut compute_pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
            label: Some("Resize Compute Pass"),
        });

        compute_pass.set_pipeline(&self.pipeline);
        compute_pass.set_bind_group(0, &bind_group, &[]);

        let workgroup_size = 16;
        let dispatch_x = (output.width + workgroup_size - 1) / workgroup_size;
        let dispatch_y = (output.height + workgroup_size - 1) / workgroup_size;

        compute_pass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
        drop(compute_pass);

        queue.submit(std::iter::once(encoder.finish()));
        device.poll(wgpu::Maintain::Wait);

        Ok(())
    }
}
