use crate::effects::core::cpu::simd::traits::*;
use rayon::prelude::*;

pub fn process_ascii_block<A: SimdArchitecture>(
    block_data: &[u8],
    block_size: usize,
) -> (u32, u8, u8) {
    let mut sum = 0u32;
    let mut min_val = 255u8;
    let mut max_val = 0u8;
    let simd_width = A::chunk_size();
    let pixel_count = block_size * block_size;
    let chunks = pixel_count / simd_width;

    for i in 0..chunks {
        let base = i * simd_width * 4;
        let mut r = vec![0.0f32; simd_width];
        let mut g = vec![0.0f32; simd_width];
        let mut b = vec![0.0f32; simd_width];
        for j in 0..simd_width {
            r[j] = block_data[base + j * 4] as f32;
            g[j] = block_data[base + j * 4 + 1] as f32;
            b[j] = block_data[base + j * 4 + 2] as f32;
        }
        let r_vec = unsafe { A::load_ps(r.as_ptr()) };
        let g_vec = unsafe { A::load_ps(g.as_ptr()) };
        let b_vec = unsafe { A::load_ps(b.as_ptr()) };
        let gray_vec = unsafe {
            let r_part = A::mul_ps(&r_vec, &A::set1_ps(0.299));
            let g_part = A::mul_ps(&g_vec, &A::set1_ps(0.587));
            let b_part = A::mul_ps(&b_vec, &A::set1_ps(0.114));
            A::add_ps(&A::add_ps(&r_part, &g_part), &b_part)
        };
        let mut gray = vec![0.0f32; simd_width];
        unsafe {
            A::store_ps(gray.as_mut_ptr(), &gray_vec);
        }
        for j in 0..simd_width {
            let gray_val = gray[j].round().clamp(0.0, 255.0) as u8;
            let contrast = ((gray_val as f32 - 128.0) * 1.5 + 128.0).clamp(0.0, 255.0) as u8;
            sum += contrast as u32;
            min_val = min_val.min(contrast);
            max_val = max_val.max(contrast);
        }
    }

    for i in (chunks * simd_width)..pixel_count {
        let base = i * 4;
        let r = block_data[base] as f32;
        let g = block_data[base + 1] as f32;
        let b = block_data[base + 2] as f32;
        let gray_val = (r * 0.299 + g * 0.587 + b * 0.114) as u8;
        let contrast = ((gray_val as f32 - 128.0) * 1.5 + 128.0).clamp(0.0, 255.0) as u8;
        sum += contrast as u32;
        min_val = min_val.min(contrast);
        max_val = max_val.max(contrast);
    }
    (sum, min_val, max_val)
}

pub fn process_ascii_blocks_parallel<A: SimdArchitecture>(
    blocks_data: &[&[u8]],
    block_size: usize,
) -> Vec<(u32, u8, u8)> {
    blocks_data
        .par_iter()
        .map(|block_data| process_ascii_block::<A>(block_data, block_size))
        .collect()
}
