use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};
use image;
use std::marker::PhantomData;

pub struct PixelateFilter<A: SimdArchitecture> {
    pub block_size: u32,
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> PixelateFilter<A> {
    pub fn new(block_size: u32) -> Self {
        Self {
            block_size,
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for PixelateFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let block_size = self.block_size as usize;
        let width = input.width() as usize;
        let height = input.height() as usize;
        let simd_width = A::chunk_size();
        let mut result_buffer = [0u8; 32];
        let mut valid_pixels = 0;

        if block_size == 1 {
            let mut r = vec![0.0f32; simd_width];
            let mut g = vec![0.0f32; simd_width];
            let mut b = vec![0.0f32; simd_width];
            let mut a = vec![0.0f32; simd_width];
            for i in 0..simd_width {
                let x = x_base + i;
                if x >= width_usize {
                    continue;
                }
                let pixel = input.get_pixel(x as u32, y as u32);
                r[i] = pixel[0] as f32;
                g[i] = pixel[1] as f32;
                b[i] = pixel[2] as f32;
                a[i] = pixel[3] as f32;
                valid_pixels += 1;
            }
            let r_vec = A::load_ps(r.as_ptr());
            let g_vec = A::load_ps(g.as_ptr());
            let b_vec = A::load_ps(b.as_ptr());
            let a_vec = A::load_ps(a.as_ptr());
            let mut r_arr = vec![0.0f32; simd_width];
            let mut g_arr = vec![0.0f32; simd_width];
            let mut b_arr = vec![0.0f32; simd_width];
            let mut a_arr = vec![0.0f32; simd_width];
            A::store_ps(r_arr.as_mut_ptr(), &r_vec);
            A::store_ps(g_arr.as_mut_ptr(), &g_vec);
            A::store_ps(b_arr.as_mut_ptr(), &b_vec);
            A::store_ps(a_arr.as_mut_ptr(), &a_vec);
            for i in 0..simd_width {
                let x = x_base + i;
                if x >= width_usize {
                    continue;
                }
                result_buffer[i * 4] = r_arr[i].clamp(0.0, 255.0) as u8;
                result_buffer[i * 4 + 1] = g_arr[i].clamp(0.0, 255.0) as u8;
                result_buffer[i * 4 + 2] = b_arr[i].clamp(0.0, 255.0) as u8;
                result_buffer[i * 4 + 3] = a_arr[i].clamp(0.0, 255.0) as u8;
            }
        } else {
            for i in 0..simd_width {
                let x = x_base + i;
                if x >= width_usize {
                    continue;
                }
                let y = y;
                let block_x = (x / block_size) * block_size;
                let block_y = (y / block_size) * block_size;
                let mut r_sum = 0u32;
                let mut g_sum = 0u32;
                let mut b_sum = 0u32;
                let mut a_sum = 0u32;
                let mut count = 0u32;
                for by in block_y..(block_y + block_size).min(height) {
                    for bx in block_x..(block_x + block_size).min(width) {
                        let pixel = input.get_pixel(bx as u32, by as u32);
                        r_sum += pixel[0] as u32;
                        g_sum += pixel[1] as u32;
                        b_sum += pixel[2] as u32;
                        a_sum += pixel[3] as u32;
                        count += 1;
                    }
                }
                result_buffer[valid_pixels * 4] = (r_sum / count) as u8;
                result_buffer[valid_pixels * 4 + 1] = (g_sum / count) as u8;
                result_buffer[valid_pixels * 4 + 2] = (b_sum / count) as u8;
                result_buffer[valid_pixels * 4 + 3] = (a_sum / count) as u8;
                valid_pixels += 1;
            }
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
        let block_size = self.block_size as usize;
        let width = input.width() as usize;
        let height = input.height() as usize;
        let block_x = (x / block_size) * block_size;
        let block_y = (y / block_size) * block_size;
        let mut r_sum = 0u32;
        let mut g_sum = 0u32;
        let mut b_sum = 0u32;
        let mut a_sum = 0u32;
        let mut count = 0u32;
        for by in block_y..(block_y + block_size).min(height) {
            for bx in block_x..(block_x + block_size).min(width) {
                let pixel = input.get_pixel(bx as u32, by as u32);
                r_sum += pixel[0] as u32;
                g_sum += pixel[1] as u32;
                b_sum += pixel[2] as u32;
                a_sum += pixel[3] as u32;
                count += 1;
            }
        }
        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx] = (r_sum / count) as u8;
        local_output[local_idx + 1] = (g_sum / count) as u8;
        local_output[local_idx + 2] = (b_sum / count) as u8;
        local_output[local_idx + 3] = (a_sum / count) as u8;
    }
}

pub fn pixelate<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    block_size: u32,
) -> image::RgbaImage {
    let filter = PixelateFilter::<A>::new(block_size);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
