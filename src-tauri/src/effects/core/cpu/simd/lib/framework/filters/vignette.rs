use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};
use image;
use std::marker::PhantomData;

pub struct VignetteFilter<A: SimdArchitecture> {
    pub center_x: f32,
    pub center_y: f32,
    pub max_radius: f32,
    pub vignette_strength: f32,
    pub vignette_width: f32,
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> VignetteFilter<A> {
    pub fn new(
        center_x: f32,
        center_y: f32,
        max_radius: f32,
        vignette_strength: f32,
        vignette_width: f32,
    ) -> Self {
        Self {
            center_x,
            center_y,
            max_radius,
            vignette_strength,
            vignette_width,
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for VignetteFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let width = input.width() as f32;
        let height = input.height() as f32;
        let mut result_buffer = [0u8; 32];
        let mut valid_pixels = 0;
        for i in 0..A::chunk_size() {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }
            let y_f = y as f32;
            let dx = x as f32 - self.center_x * width;
            let dy = y_f - self.center_y * height;
            let distance = (dx * dx + dy * dy).sqrt();
            let vignette = if distance > self.max_radius {
                1.0 - self.vignette_strength
            } else {
                1.0 - self.vignette_strength
                    * ((distance / self.max_radius).powf(self.vignette_width))
            };
            let pixel = input.get_pixel(x as u32, y as u32);
            for c in 0..4 {
                let val = pixel[c] as f32 * vignette;
                result_buffer[valid_pixels * 4 + c] = val.clamp(0.0, 255.0) as u8;
            }
            valid_pixels += 1;
        }
        let base_idx = (local_y * width_usize + x_base) * 4;
        let copy_len = valid_pixels * 4;
        if base_idx + copy_len <= local_output.len() {
            local_output[base_idx..base_idx + copy_len].copy_from_slice(&result_buffer[..copy_len]);
        }
    }
    fn process_scalar_pixel(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let width = input.width() as f32;
        let height = input.height() as f32;
        let dx = x as f32 - self.center_x * width;
        let dy = y as f32 - self.center_y * height;
        let distance = (dx * dx + dy * dy).sqrt();
        let vignette = if distance > self.max_radius {
            1.0 - self.vignette_strength
        } else {
            1.0 - self.vignette_strength * ((distance / self.max_radius).powf(self.vignette_width))
        };
        let pixel = input.get_pixel(x as u32, y as u32);
        let local_idx = (local_y * width_usize + x) * 4;
        for c in 0..4 {
            let val = pixel[c] as f32 * vignette;
            local_output[local_idx + c] = val.clamp(0.0, 255.0) as u8;
        }
    }
}

pub fn vignette<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    center_x: f32,
    center_y: f32,
    max_radius: f32,
    vignette_strength: f32,
    vignette_width: f32,
) -> image::RgbaImage {
    let filter = VignetteFilter::<A>::new(
        center_x,
        center_y,
        max_radius,
        vignette_strength,
        vignette_width,
    );
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
