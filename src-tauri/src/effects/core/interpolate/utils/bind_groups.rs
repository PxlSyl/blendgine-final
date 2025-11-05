use crate::effects::core::interpolate::interpolation::{
    InterpolationEngine, InterpolationUniforms,
};
use anyhow::Result;
use bytemuck::cast_slice;
use wgpu::{
    BindGroup, BindGroupDescriptor, BindGroupEntry, BindingResource, Texture, TextureViewDescriptor,
};

impl InterpolationEngine {
    pub fn create_interpolation_bind_group(
        &self,
        texture1: &Texture,
        texture2: &Texture,
        output: &Texture,
        alpha: f32,
    ) -> Result<(BindGroup, wgpu::Buffer)> {
        let uniform_buffer = {
            let mut pool = self.uniform_buffer_pool.lock();
            let buffer = pool.acquire(self.engine.device());
            drop(pool);
            buffer
        };

        let uniforms = InterpolationUniforms {
            alpha,
            factor: 1.0,
            _padding: [0.0, 0.0],
        };

        self.engine
            .queue()
            .write_buffer(&uniform_buffer, 0, cast_slice(&[uniforms]));

        let texture1_view = texture1.create_view(&TextureViewDescriptor {
            label: Some("Input Texture 1 View"),
            format: Some(wgpu::TextureFormat::Rgba8Unorm),
            dimension: Some(wgpu::TextureViewDimension::D2),
            aspect: wgpu::TextureAspect::All,
            base_mip_level: 0,
            mip_level_count: None,
            base_array_layer: 0,
            array_layer_count: None,
        });

        let texture2_view = texture2.create_view(&TextureViewDescriptor {
            label: Some("Input Texture 2 View"),
            format: Some(wgpu::TextureFormat::Rgba8Unorm),
            dimension: Some(wgpu::TextureViewDimension::D2),
            aspect: wgpu::TextureAspect::All,
            base_mip_level: 0,
            mip_level_count: None,
            base_array_layer: 0,
            array_layer_count: None,
        });

        let output_view = output.create_view(&TextureViewDescriptor {
            label: Some("Output Texture View"),
            format: Some(wgpu::TextureFormat::Rgba8Unorm),
            dimension: Some(wgpu::TextureViewDimension::D2),
            aspect: wgpu::TextureAspect::All,
            base_mip_level: 0,
            mip_level_count: None,
            base_array_layer: 0,
            array_layer_count: None,
        });

        let bind_group = self
            .engine
            .device()
            .create_bind_group(&BindGroupDescriptor {
                label: Some("Interpolation Bind Group"),
                layout: &self.bind_group_layout,
                entries: &[
                    BindGroupEntry {
                        binding: 0,
                        resource: BindingResource::TextureView(&texture1_view),
                    },
                    BindGroupEntry {
                        binding: 1,
                        resource: BindingResource::TextureView(&texture2_view),
                    },
                    BindGroupEntry {
                        binding: 2,
                        resource: BindingResource::TextureView(&output_view),
                    },
                    BindGroupEntry {
                        binding: 3,
                        resource: uniform_buffer.as_entire_binding(),
                    },
                ],
            });

        Ok((bind_group, uniform_buffer))
    }
}
