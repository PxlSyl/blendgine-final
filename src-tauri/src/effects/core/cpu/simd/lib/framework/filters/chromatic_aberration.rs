use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};
use image;
use std::marker::PhantomData;

pub struct ChromaticAberrationFilter<A: SimdArchitecture> {
    pub red_offset: f32,
    pub blue_offset: f32,
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> ChromaticAberrationFilter<A> {
    pub fn new(red_offset: f32, blue_offset: f32) -> Self {
        Self {
            red_offset,
            blue_offset,
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for ChromaticAberrationFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let simd_width = A::chunk_size();
        let width = input.width() as i32;
        let y_i32 = y as i32;
        let mut r = vec![0.0f32; simd_width];
        let mut g = vec![0.0f32; simd_width];
        let mut b = vec![0.0f32; simd_width];
        let mut a = vec![0.0f32; simd_width];
        let mut valid_pixels = 0;
        for i in 0..simd_width {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }
            let r_x = ((x as f32 + self.red_offset).round() as i32)
                .max(0)
                .min(width - 1);
            let b_x = ((x as f32 + self.blue_offset).round() as i32)
                .max(0)
                .min(width - 1);
            let r_pixel = input.get_pixel(r_x as u32, y_i32 as u32);
            let g_pixel = input.get_pixel(x as u32, y as u32);
            let b_pixel = input.get_pixel(b_x as u32, y_i32 as u32);
            r[i] = r_pixel[0] as f32;
            g[i] = g_pixel[1] as f32;
            b[i] = b_pixel[2] as f32;
            a[i] = g_pixel[3] as f32;
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
        let mut result_buffer = [0u8; 32];
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
        let x = x as i32;
        let y = y as i32;
        let r_x = (x as f32 + self.red_offset).round() as i32;
        let b_x = (x as f32 + self.blue_offset).round() as i32;
        let width = input.width() as i32;
        let clamp = |v: i32| v.max(0).min(width - 1);
        let r_pixel = input.get_pixel(clamp(r_x) as u32, y as u32);
        let g_pixel = input.get_pixel(x as u32, y as u32);
        let b_pixel = input.get_pixel(clamp(b_x) as u32, y as u32);
        let local_idx = (local_y * width_usize + x as usize) * 4;
        local_output[local_idx] = r_pixel[0];
        local_output[local_idx + 1] = g_pixel[1];
        local_output[local_idx + 2] = b_pixel[2];
        local_output[local_idx + 3] = g_pixel[3];
    }
}

pub fn chromatic_aberration<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    red_offset: f32,
    blue_offset: f32,
) -> image::RgbaImage {
    let filter = ChromaticAberrationFilter::<A>::new(red_offset, blue_offset);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
