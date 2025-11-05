use crate::effects::core::cpu::simd::lib::framework::simd_processor::SimdProcessor;
use crate::effects::core::cpu::simd::traits::*;
use image;
use std::marker::PhantomData;

pub struct NormalizeFilter<A: SimdArchitecture> {
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> NormalizeFilter<A> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for NormalizeFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let mut result_buffer = [0u8; 32];
        let mut valid_pixels = 0;
        for i in 0..A::chunk_size() {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }
            let pixel = input.get_pixel(x as u32, y as u32);
            let max_val = pixel[0].max(pixel[1]).max(pixel[2]);
            for c in 0..3 {
                result_buffer[valid_pixels * 4 + c] = if max_val == 0 {
                    0
                } else {
                    (pixel[c] as u16 * 255 / max_val as u16) as u8
                };
            }
            result_buffer[valid_pixels * 4 + 3] = pixel[3];
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
        let pixel = input.get_pixel(x as u32, y as u32);
        let max_val = pixel[0].max(pixel[1]).max(pixel[2]);
        let mut out_pixel = [0u8; 4];
        for c in 0..3 {
            out_pixel[c] = if max_val == 0 {
                0
            } else {
                (pixel[c] as u16 * 255 / max_val as u16) as u8
            };
        }
        out_pixel[3] = pixel[3];
        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx..local_idx + 4].copy_from_slice(&out_pixel);
    }
}

pub fn normalize<A: SimdArchitecture + Sync>(input: &image::RgbaImage) -> image::RgbaImage {
    let filter = NormalizeFilter::<A>::new();
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
