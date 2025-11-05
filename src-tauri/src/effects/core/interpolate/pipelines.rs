use crate::effects::core::interpolate::InterpolationEngine;
use wgpu::{
    BindGroupLayout, BindGroupLayoutDescriptor, BindGroupLayoutEntry, BindingType,
    BufferBindingType, ComputePipeline, ComputePipelineDescriptor, Device,
    PipelineLayoutDescriptor, ShaderModuleDescriptor, ShaderSource, ShaderStages,
    StorageTextureAccess, TextureFormat, TextureSampleType, TextureViewDimension,
};

impl InterpolationEngine {
    pub fn create_lucas_kanade_pipeline(
        device: &Device,
        layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Lucas-Kanade Interpolation Shader"),
            source: wgpu::ShaderSource::Wgsl(
                include_str!("shaders/lucas_kanade_interpolation.wgsl").into(),
            ),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Lucas-Kanade Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Lucas-Kanade Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_blend_pipeline(device: &Device, layout: &BindGroupLayout) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Blend Interpolation Shader"),
            source: ShaderSource::Wgsl(include_str!("shaders/blend_interpolation.wgsl").into()),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Blend Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Blend Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_motion_flow_pipeline(
        device: &Device,
        layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Motion Flow Interpolation Shader"),
            source: ShaderSource::Wgsl(
                include_str!("shaders/motion_flow_interpolation.wgsl").into(),
            ),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Motion Flow Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Motion Flow Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_bidirectional_pipeline(
        device: &Device,
        layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Bidirectional Interpolation Shader"),
            source: ShaderSource::Wgsl(
                include_str!("shaders/bidirectional_interpolation.wgsl").into(),
            ),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Bidirectional Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Bidirectional Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_dissolve_pipeline(device: &Device, layout: &BindGroupLayout) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Dissolve Interpolation Shader"),
            source: ShaderSource::Wgsl(include_str!("shaders/dissolve_interpolation.wgsl").into()),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Dissolve Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Dissolve Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_block_based_pipeline(
        device: &Device,
        layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Block Based Interpolation Shader"),
            source: ShaderSource::Wgsl(
                include_str!("shaders/block_based_interpolation.wgsl").into(),
            ),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Block Based Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Block Based Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_displacement_map_pipeline(
        device: &Device,
        layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Displacement Map Interpolation Shader"),
            source: ShaderSource::Wgsl(
                include_str!("shaders/displacement_map_interpolation.wgsl").into(),
            ),
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Displacement Map Interpolation Pipeline Layout"),
            bind_group_layouts: &[layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Displacement Map Interpolation Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }

    pub fn create_gaussian_reduction_pipeline(
        device: &Device,
        _layout: &BindGroupLayout,
    ) -> ComputePipeline {
        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("Gaussian Reduction Shader"),
            source: ShaderSource::Wgsl(include_str!("shaders/gaussian_reduction.wgsl").into()),
        });

        let gaussian_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("Gaussian Reduction Bind Group Layout"),
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
                    ty: BindingType::StorageTexture {
                        access: StorageTextureAccess::WriteOnly,
                        format: TextureFormat::Rgba8Unorm,
                        view_dimension: TextureViewDimension::D2,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("Gaussian Reduction Pipeline Layout"),
            bind_group_layouts: &[&gaussian_layout],
            push_constant_ranges: &[],
        });

        device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("Gaussian Reduction Pipeline"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        })
    }
}
