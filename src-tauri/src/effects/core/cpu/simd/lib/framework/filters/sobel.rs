use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};
use image;
use std::marker::PhantomData;

pub struct SobelFilter<A: SimdArchitecture> {
    pub threshold: f32,
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> SobelFilter<A> {
    pub fn new(threshold: f32) -> Self {
        Self {
            threshold,
            _phantom: PhantomData,
        }
    }
    fn is_likely_uniform_area(&self, input: &image::RgbaImage, x_base: usize, y: usize) -> bool {
        if y == 0
            || y >= input.height() as usize - 1
            || x_base == 0
            || x_base >= input.width() as usize - 1
        {
            return false;
        }
        let center_pixel = input.get_pixel(x_base as u32, y as u32);
        let mut variance = 0u32;
        for ky in -1..=1 {
            for kx in -1..=1 {
                let nx = (x_base as i32 + kx) as u32;
                let ny = (y as i32 + ky) as u32;
                let pixel = input.get_pixel(nx, ny);
                let diff_r = (pixel[0] as i32 - center_pixel[0] as i32).abs() as u32;
                let diff_g = (pixel[1] as i32 - center_pixel[1] as i32).abs() as u32;
                let diff_b = (pixel[2] as i32 - center_pixel[2] as i32).abs() as u32;
                variance += diff_r + diff_g + diff_b;
            }
        }
        variance < 100
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for SobelFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        if self.is_likely_uniform_area(input, x_base, y) {
            let base_idx = (local_y * width_usize + x_base) * 4;
            for i in 0..A::chunk_size() {
                let idx = base_idx + i * 4;
                local_output[idx..idx + 4].fill(0);
            }
            return;
        }
        let sobel_x = [[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]];
        let sobel_y = [[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]];
        let mut gx_r = A::set1_ps(0.0);
        let mut gx_g = A::set1_ps(0.0);
        let mut gx_b = A::set1_ps(0.0);
        let mut gy_r = A::set1_ps(0.0);
        let mut gy_g = A::set1_ps(0.0);
        let mut gy_b = A::set1_ps(0.0);
        let mut result_buffer = [0u8; 32];
        let mut valid_pixels = 0;
        for i in 0..A::chunk_size() {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }
            let (r, g, b, _) = A::load_rgba_with_alpha(input, x, y, 0, 0);
            let kx_val = A::set1_ps(sobel_x[(0 + 1) as usize][(0 + 1) as usize]);
            let ky_val = A::set1_ps(sobel_y[(0 + 1) as usize][(0 + 1) as usize]);
            gx_r = A::fmadd_ps(&r, &kx_val, &gx_r);
            gx_g = A::fmadd_ps(&g, &kx_val, &gx_g);
            gx_b = A::fmadd_ps(&b, &kx_val, &gx_b);
            gy_r = A::fmadd_ps(&r, &ky_val, &gy_r);
            gy_g = A::fmadd_ps(&g, &ky_val, &gy_g);
            gy_b = A::fmadd_ps(&b, &ky_val, &gy_b);
            let mag_r = A::sqrt_ps(&A::add_ps(
                &A::mul_ps(&gx_r, &gx_r),
                &A::mul_ps(&gy_r, &gy_r),
            ));
            let mag_g = A::sqrt_ps(&A::add_ps(
                &A::mul_ps(&gx_g, &gx_g),
                &A::mul_ps(&gy_g, &gy_g),
            ));
            let mag_b = A::sqrt_ps(&A::add_ps(
                &A::mul_ps(&gx_b, &gx_b),
                &A::mul_ps(&gy_b, &gy_b),
            ));
            let mut float_buffer = [0.0f32; 32];
            A::store_ps(float_buffer.as_mut_ptr(), &mag_r);
            A::store_ps(float_buffer.as_mut_ptr().add(8), &mag_g);
            A::store_ps(float_buffer.as_mut_ptr().add(16), &mag_b);
            for j in 0..4 {
                let r = if float_buffer[j] > self.threshold {
                    255
                } else {
                    0
                };
                let g = if float_buffer[j + 8] > self.threshold {
                    255
                } else {
                    0
                };
                let b = if float_buffer[j + 16] > self.threshold {
                    255
                } else {
                    0
                };
                result_buffer[j * 4] = r;
                result_buffer[j * 4 + 1] = g;
                result_buffer[j * 4 + 2] = b;
                result_buffer[j * 4 + 3] = 255;
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
        let sobel_x = [[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]];
        let sobel_y = [[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]];
        let mut gx_r = 0.0;
        let mut gx_g = 0.0;
        let mut gx_b = 0.0;
        let mut gy_r = 0.0;
        let mut gy_g = 0.0;
        let mut gy_b = 0.0;
        for ky in -1..=1 {
            for kx in -1..=1 {
                let nx = (x as i32 + kx).clamp(0, input.width() as i32 - 1) as u32;
                let ny = (y as i32 + ky).clamp(0, input.height() as i32 - 1) as u32;
                let pixel = input.get_pixel(nx, ny);
                let kx_val = sobel_x[(ky + 1) as usize][(kx + 1) as usize];
                let ky_val = sobel_y[(ky + 1) as usize][(kx + 1) as usize];
                gx_r += pixel[0] as f32 * kx_val;
                gx_g += pixel[1] as f32 * kx_val;
                gx_b += pixel[2] as f32 * kx_val;
                gy_r += pixel[0] as f32 * ky_val;
                gy_g += pixel[1] as f32 * ky_val;
                gy_b += pixel[2] as f32 * ky_val;
            }
        }
        let mag_r = (gx_r * gx_r + gy_r * gy_r).sqrt();
        let mag_g = (gx_g * gx_g + gy_g * gy_g).sqrt();
        let mag_b = (gx_b * gx_b + gy_b * gy_b).sqrt();
        let r = if mag_r > self.threshold { 255 } else { 0 };
        let g = if mag_g > self.threshold { 255 } else { 0 };
        let b = if mag_b > self.threshold { 255 } else { 0 };
        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx] = r;
        local_output[local_idx + 1] = g;
        local_output[local_idx + 2] = b;
        local_output[local_idx + 3] = 255;
    }
}

pub fn sobel<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    threshold: f32,
) -> image::RgbaImage {
    let filter = SobelFilter::<A>::new(threshold);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
