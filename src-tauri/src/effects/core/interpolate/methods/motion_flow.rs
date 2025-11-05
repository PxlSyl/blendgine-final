use crate::effects::core::interpolate::interpolation::InterpolationEngine;
use anyhow::Result;
use image::DynamicImage;
use std::{cmp::max, iter};
use wgpu::{BindGroup, Texture};

impl InterpolationEngine {
    pub fn motion_flow_interpolation(
        &self,
        frame1: &DynamicImage,
        frame2: &DynamicImage,
        alpha: f32,
    ) -> Result<DynamicImage> {
        let texture1 = {
            let mut texture_pool = self.texture_pool.lock();
            self.create_texture_from_image_pooled(frame1, &mut texture_pool)?
        };

        let texture2 = {
            let mut texture_pool = self.texture_pool.lock();
            self.create_texture_from_image_pooled(frame2, &mut texture_pool)?
        };

        let pyramid1 = self.create_gaussian_pyramid(&texture1, 3)?;
        let pyramid2 = self.create_gaussian_pyramid(&texture2, 3)?;

        let output_texture = {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.acquire(self.engine.device(), frame1.width(), frame1.height())
        };

        let (bind_group, uniform_buffer) = self.create_motion_flow_bind_group_with_pyramids(
            &texture1,
            &texture2,
            &output_texture,
            &pyramid1,
            &pyramid2,
            alpha,
        )?;

        self.execute_motion_flow_pipeline(&bind_group, frame1.width(), frame1.height())?;

        let result_image = self.read_texture_to_image(&output_texture)?;

        {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.release(texture1);
            texture_pool.release(texture2);
            texture_pool.release(output_texture);

            for texture in pyramid1 {
                texture_pool.release(texture);
            }
            for texture in pyramid2 {
                texture_pool.release(texture);
            }
        }

        {
            let mut uniform_pool = self.uniform_buffer_pool.lock();
            uniform_pool.release(uniform_buffer);
        }

        Ok(result_image)
    }

    pub fn execute_motion_flow_pipeline(
        &self,
        bind_group: &BindGroup,
        width: u32,
        height: u32,
    ) -> Result<()> {
        let mut encoder = self
            .engine
            .device()
            .create_command_encoder(&wgpu::CommandEncoderDescriptor::default());

        {
            let mut compute_pass =
                encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());
            compute_pass.set_pipeline(&self.motion_flow_pipeline);
            compute_pass.set_bind_group(0, bind_group, &[]);
            compute_pass.dispatch_workgroups((width + 15) / 16, (height + 15) / 16, 1);
        }

        self.engine.queue().submit(iter::once(encoder.finish()));
        self.engine.device().poll(wgpu::Maintain::Wait);

        Ok(())
    }

    pub fn create_gaussian_pyramid(&self, texture: &Texture, levels: u32) -> Result<Vec<Texture>> {
        let mut pyramid = Vec::new();

        let first_texture = {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.acquire(self.engine.device(), texture.width(), texture.height())
        };
        pyramid.push(first_texture);

        for level in 1..levels {
            let prev_texture = &pyramid[(level - 1) as usize];
            let prev_width = prev_texture.width();
            let prev_height = prev_texture.height();

            let new_width = max(1, prev_width / 2);
            let new_height = max(1, prev_height / 2);

            let next_texture = {
                let mut texture_pool = self.texture_pool.lock();
                texture_pool.acquire(self.engine.device(), new_width, new_height)
            };

            self.apply_gaussian_reduction(
                prev_texture,
                &next_texture,
                prev_width,
                prev_height,
                new_width,
                new_height,
            )?;

            pyramid.push(next_texture);
        }

        Ok(pyramid)
    }

    pub fn apply_gaussian_reduction(
        &self,
        input_texture: &Texture,
        output_texture: &Texture,
        input_width: u32,
        input_height: u32,
        output_width: u32,
        output_height: u32,
    ) -> Result<()> {
        #[repr(C)]
        #[derive(Copy, Clone, Debug, bytemuck::Pod, bytemuck::Zeroable)]
        struct GaussianReductionUniforms {
            input_width: u32,
            input_height: u32,
            output_width: u32,
            output_height: u32,
            _padding: [f32; 3],
        }

        let uniforms = GaussianReductionUniforms {
            input_width,
            input_height,
            output_width,
            output_height,
            _padding: [0.0; 3],
        };

        let uniform_buffer = self.engine.device().create_buffer(&wgpu::BufferDescriptor {
            label: Some("Gaussian Reduction Uniforms"),
            size: 32,
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: true,
        });

        {
            let mut view = uniform_buffer.slice(..).get_mapped_range_mut();
            view[..std::mem::size_of::<GaussianReductionUniforms>()]
                .copy_from_slice(bytemuck::cast_slice(&[uniforms]));
        }
        uniform_buffer.unmap();

        let gaussian_layout =
            self.engine
                .device()
                .create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                    label: Some("Gaussian Reduction Bind Group Layout"),
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
                            ty: wgpu::BindingType::StorageTexture {
                                access: wgpu::StorageTextureAccess::WriteOnly,
                                format: wgpu::TextureFormat::Rgba8Unorm,
                                view_dimension: wgpu::TextureViewDimension::D2,
                            },
                            count: None,
                        },
                        wgpu::BindGroupLayoutEntry {
                            binding: 2,
                            visibility: wgpu::ShaderStages::COMPUTE,
                            ty: wgpu::BindingType::Buffer {
                                ty: wgpu::BufferBindingType::Uniform,
                                has_dynamic_offset: false,
                                min_binding_size: None,
                            },
                            count: None,
                        },
                    ],
                });

        let bind_group = self
            .engine
            .device()
            .create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("Gaussian Reduction Bind Group"),
                layout: &gaussian_layout,
                entries: &[
                    wgpu::BindGroupEntry {
                        binding: 0,
                        resource: wgpu::BindingResource::TextureView(
                            &input_texture.create_view(&wgpu::TextureViewDescriptor::default()),
                        ),
                    },
                    wgpu::BindGroupEntry {
                        binding: 1,
                        resource: wgpu::BindingResource::TextureView(
                            &output_texture.create_view(&wgpu::TextureViewDescriptor::default()),
                        ),
                    },
                    wgpu::BindGroupEntry {
                        binding: 2,
                        resource: uniform_buffer.as_entire_binding(),
                    },
                ],
            });

        let mut encoder =
            self.engine
                .device()
                .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                    label: Some("Gaussian Reduction Encoder"),
                });

        let mut compute_pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
            label: Some("Gaussian Reduction Pass"),
        });

        compute_pass.set_pipeline(&self.gaussian_reduction_pipeline);
        compute_pass.set_bind_group(0, &bind_group, &[]);

        let workgroup_size = 16;
        let dispatch_x = (output_width + workgroup_size - 1) / workgroup_size;
        let dispatch_y = (output_height + workgroup_size - 1) / workgroup_size;

        compute_pass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
        drop(compute_pass);

        self.engine
            .queue()
            .submit(std::iter::once(encoder.finish()));
        self.engine.device().poll(wgpu::Maintain::Wait);

        Ok(())
    }

    pub fn create_motion_flow_bind_group_with_pyramids(
        &self,
        texture1: &Texture,
        texture2: &Texture,
        output_texture: &Texture,
        pyramid1: &[Texture],
        pyramid2: &[Texture],
        alpha: f32,
    ) -> Result<(BindGroup, wgpu::Buffer)> {
        let uniform_buffer = {
            let mut pool = self.uniform_buffer_pool.lock();
            let buffer = pool.acquire(self.engine.device());
            drop(pool);
            buffer
        };

        let uniforms = crate::effects::core::interpolate::interpolation::InterpolationUniforms {
            alpha,
            factor: 1.0,
            _padding: [0.0; 2],
        };

        self.engine
            .queue()
            .write_buffer(&uniform_buffer, 0, bytemuck::cast_slice(&[uniforms]));

        self.engine.device().poll(wgpu::Maintain::Wait);

        let texture1_view = texture1.create_view(&wgpu::TextureViewDescriptor::default());
        let texture2_view = texture2.create_view(&wgpu::TextureViewDescriptor::default());
        let output_texture_view =
            output_texture.create_view(&wgpu::TextureViewDescriptor::default());

        let mut entries = vec![
            wgpu::BindGroupEntry {
                binding: 0,
                resource: wgpu::BindingResource::TextureView(&texture1_view),
            },
            wgpu::BindGroupEntry {
                binding: 1,
                resource: wgpu::BindingResource::TextureView(&texture2_view),
            },
            wgpu::BindGroupEntry {
                binding: 2,
                resource: wgpu::BindingResource::TextureView(&output_texture_view),
            },
            wgpu::BindGroupEntry {
                binding: 3,
                resource: uniform_buffer.as_entire_binding(),
            },
        ];

        let mut pyramid1_views = Vec::new();
        for texture in pyramid1.iter() {
            pyramid1_views.push(texture.create_view(&wgpu::TextureViewDescriptor::default()));
        }

        let mut pyramid2_views = Vec::new();
        for texture in pyramid2.iter() {
            pyramid2_views.push(texture.create_view(&wgpu::TextureViewDescriptor::default()));
        }

        for (i, view) in pyramid1_views.iter().enumerate() {
            entries.push(wgpu::BindGroupEntry {
                binding: 4 + i as u32,
                resource: wgpu::BindingResource::TextureView(view),
            });
        }

        for (i, view) in pyramid2_views.iter().enumerate() {
            entries.push(wgpu::BindGroupEntry {
                binding: 7 + i as u32,
                resource: wgpu::BindingResource::TextureView(view),
            });
        }

        let bind_group = self
            .engine
            .device()
            .create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some("Motion Flow with Pyramids Bind Group"),
                layout: &self.motion_flow_bind_group_layout,
                entries: &entries,
            });

        Ok((bind_group, uniform_buffer))
    }
}
