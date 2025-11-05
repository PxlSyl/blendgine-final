use rayon::prelude::*;

pub fn process_ascii_block_fallback(block_data: &[u8], block_size: usize) -> (u32, u8, u8) {
    let mut sum = 0u32;
    let mut min_val = 255u8;
    let mut max_val = 0u8;

    for y in 0..block_size {
        for x in 0..block_size {
            let pixel_idx = (y * block_size + x) * 4;
            let r = block_data[pixel_idx] as f32;
            let g = block_data[pixel_idx + 1] as f32;
            let b = block_data[pixel_idx + 2] as f32;

            let gray_val = (r * 0.299 + g * 0.587 + b * 0.114) as u8;
            let contrast = ((gray_val as f32 - 128.0) * 1.5 + 128.0).clamp(0.0, 255.0) as u8;

            sum += contrast as u32;
            min_val = min_val.min(contrast);
            max_val = max_val.max(contrast);
        }
    }

    (sum, min_val, max_val)
}

pub fn process_ascii_blocks_fallback_parallel(
    blocks_data: &[&[u8]],
    block_size: usize,
) -> Vec<(u32, u8, u8)> {
    blocks_data
        .par_iter()
        .map(|block_data| process_ascii_block_fallback(block_data, block_size))
        .collect()
}
