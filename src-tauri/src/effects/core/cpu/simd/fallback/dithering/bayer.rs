use crate::effects::core::cpu::simd::quantize_colors_fallback;
use rayon::prelude::*;

pub fn apply_bayer_dithering_fallback(
    input: &mut image::RgbaImage,
    bayer_matrix: &[Vec<u8>],
    quantization_factor: f32,
    matrix_size_squared: f32,
    matrix_size: usize,
) {
    let width = input.width() as usize;
    let row_len = width * 4;
    let buf = input.as_flat_samples_mut().samples;
    let rows: Vec<_> = buf.chunks_mut(row_len).collect();

    rows.into_par_iter().enumerate().for_each(|(y, row)| {
        for x in 0..width {
            let pixel_idx = x * 4;

            let bayer_x = x % matrix_size;
            let bayer_y = y % matrix_size;
            let threshold = bayer_matrix[bayer_y][bayer_x] as f32 / matrix_size_squared;

            let r = row[pixel_idx] as f32;
            let g = row[pixel_idx + 1] as f32;
            let b = row[pixel_idx + 2] as f32;

            let [r_quantized, g_quantized, b_quantized] =
                quantize_colors_fallback([r, g, b], quantization_factor);

            let r_final: f32 = if r_quantized / 255.0 > threshold {
                255.0
            } else {
                0.0
            };
            let g_final: f32 = if g_quantized / 255.0 > threshold {
                255.0
            } else {
                0.0
            };
            let b_final: f32 = if b_quantized / 255.0 > threshold {
                255.0
            } else {
                0.0
            };

            row[pixel_idx] = r_final.clamp(0.0, 255.0) as u8;
            row[pixel_idx + 1] = g_final.clamp(0.0, 255.0) as u8;
            row[pixel_idx + 2] = b_final.clamp(0.0, 255.0) as u8;
        }
    });
}
