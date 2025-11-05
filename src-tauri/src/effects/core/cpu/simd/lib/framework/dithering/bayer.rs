use crate::effects::core::cpu::simd::lib::framework::simd_processor::SimdProcessor;
use crate::effects::core::cpu::simd::traits::*;
use image;
use std::marker::PhantomData;

pub struct BayerDitheringFilter<A: SimdArchitecture> {
    pub bayer_matrix: Vec<Vec<u8>>,
    pub quantization_factor: f32,
    pub matrix_size: usize,
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> BayerDitheringFilter<A> {
    pub fn new(bayer_matrix: Vec<Vec<u8>>, quantization_factor: f32) -> Self {
        let matrix_size = bayer_matrix.len();
        Self {
            bayer_matrix,
            quantization_factor,
            matrix_size,
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for BayerDitheringFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        for i in 0..A::chunk_size() {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }
            let y = y;
            let matrix_x = x % self.matrix_size;
            let matrix_y = y % self.matrix_size;
            let threshold = self.bayer_matrix[matrix_y][matrix_x] as f32 / 255.0;
            let pixel = input.get_pixel(x as u32, y as u32);
            let mut out_pixel = [0u8; 4];
            for c in 0..3 {
                let quantized = ((pixel[c] as f32 / self.quantization_factor).round()
                    * self.quantization_factor) as u8;
                out_pixel[c] = if (pixel[c] as f32 / 255.0) > threshold {
                    quantized
                } else {
                    0
                };
            }
            out_pixel[3] = pixel[3];
            let idx = (local_y * width_usize + x) * 4;
            if idx + 4 > local_output.len() {
                continue;
            }
            local_output[idx..idx + 4].copy_from_slice(&out_pixel);
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
        let matrix_x = x % self.matrix_size;
        let matrix_y = y % self.matrix_size;
        let threshold = self.bayer_matrix[matrix_y][matrix_x] as f32 / 255.0;
        let pixel = input.get_pixel(x as u32, y as u32);
        let mut out_pixel = [0u8; 4];
        for c in 0..3 {
            let quantized = ((pixel[c] as f32 / self.quantization_factor).round()
                * self.quantization_factor) as u8;
            out_pixel[c] = if (pixel[c] as f32 / 255.0) > threshold {
                quantized
            } else {
                0
            };
        }
        out_pixel[3] = pixel[3];
        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx..local_idx + 4].copy_from_slice(&out_pixel);
    }
}

pub fn bayer_dithering<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    bayer_matrix: Vec<Vec<u8>>,
    quantization_factor: f32,
) -> image::RgbaImage {
    let filter = BayerDitheringFilter::<A>::new(bayer_matrix, quantization_factor);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
