use crate::effects::core::interpolate::interpolation::InterpolationEngine;
use anyhow::Result;
use image::DynamicImage;
use std::iter;
use wgpu::BindGroup;

impl InterpolationEngine {
    pub fn bidirectional_interpolation(
        &self,
        frame1: &DynamicImage,
        frame2: &DynamicImage,
        alpha: f32,
    ) -> Result<DynamicImage> {
        let texture1 = {
            let mut texture_pool = self.texture_pool.lock();
            let texture = self.create_texture_from_image_pooled(frame1, &mut texture_pool)?;
            drop(texture_pool);
            texture
        };

        let texture2 = {
            let mut texture_pool = self.texture_pool.lock();
            let texture = self.create_texture_from_image_pooled(frame2, &mut texture_pool)?;
            drop(texture_pool);
            texture
        };

        let output_texture = {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.acquire(self.engine.device(), frame1.width(), frame1.height())
        };

        let (bind_group, uniform_buffer) =
            self.create_interpolation_bind_group(&texture1, &texture2, &output_texture, alpha)?;

        self.execute_bidirectional_pipeline(&bind_group, frame1.width(), frame1.height())?;

        let result_image = self.read_texture_to_image(&output_texture)?;

        {
            let mut texture_pool = self.texture_pool.lock();
            texture_pool.release(texture1);
            texture_pool.release(texture2);
            texture_pool.release(output_texture);
        }

        {
            let mut uniform_pool = self.uniform_buffer_pool.lock();
            uniform_pool.release(uniform_buffer);
        }

        Ok(result_image)
    }

    pub fn execute_bidirectional_pipeline(
        &self,
        bind_group: &BindGroup,
        width: u32,
        height: u32,
    ) -> Result<()> {
        let (workgroup_x, workgroup_y) = self.calculate_optimal_workgroup_size(width, height);

        let mut encoder = self
            .engine
            .device()
            .create_command_encoder(&wgpu::CommandEncoderDescriptor::default());

        {
            let mut compute_pass =
                encoder.begin_compute_pass(&wgpu::ComputePassDescriptor::default());
            compute_pass.set_pipeline(&self.bidirectional_pipeline);
            compute_pass.set_bind_group(0, bind_group, &[]);
            compute_pass.dispatch_workgroups(workgroup_x, workgroup_y, 1);
        }

        self.engine.queue().submit(iter::once(encoder.finish()));

        self.engine.device().poll(wgpu::Maintain::Wait);

        Ok(())
    }
}
