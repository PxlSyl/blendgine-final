use crate::effects::core::cpu::simd::traits::*;
use rayon::prelude::*;

pub struct SimdProcessor;

impl SimdProcessor {
    pub fn process_filter<A, F>(filter: &F, input: &image::RgbaImage) -> image::RgbaImage
    where
        A: SimdArchitecture,
        F: SimdFilter<A> + Sync,
    {
        let (width, height) = input.dimensions();
        let mut output = image::RgbaImage::new(width, height);
        let width_usize = width as usize;
        let height_usize = height as usize;

        let num_threads = rayon::current_num_threads().max(1);
        let min_rows_per_thread = 16;
        let adjusted_threads = num_threads.min((height_usize / min_rows_per_thread).max(1));
        let chunk_size = height_usize / adjusted_threads;

        let row_ranges: Vec<_> = (0..adjusted_threads)
            .map(|i| {
                let start = i * chunk_size;
                let end = if i == adjusted_threads - 1 {
                    height_usize
                } else {
                    (i + 1) * chunk_size
                };
                (start, end)
            })
            .collect();

        let results: Vec<_> = row_ranges
            .into_par_iter()
            .map(|(start_y, end_y)| {
                let mut local_output = vec![0u8; (end_y - start_y) * width_usize * 4];
                for (local_y, y) in (start_y..end_y).enumerate() {
                    let width_chunks = width_usize / A::chunk_size();
                    for x_chunk in 0..width_chunks {
                        let x_base = x_chunk * A::chunk_size();
                        unsafe {
                            filter.process_simd_chunk(
                                input,
                                &mut local_output,
                                x_base,
                                y,
                                local_y,
                                width_usize,
                            );
                        }
                    }

                    for x in (width_chunks * A::chunk_size())..width_usize {
                        filter.process_scalar_pixel(
                            input,
                            &mut local_output,
                            x,
                            y,
                            local_y,
                            width_usize,
                        );
                    }
                }
                (start_y, end_y, local_output)
            })
            .collect();

        for (start_y, end_y, local_output) in results {
            for (local_y, global_y) in (start_y..end_y).enumerate() {
                for global_x in 0..width {
                    let local_idx = (local_y * width_usize + global_x as usize) * 4;
                    let pixel = image::Rgba([
                        local_output[local_idx],
                        local_output[local_idx + 1],
                        local_output[local_idx + 2],
                        local_output[local_idx + 3],
                    ]);
                    output.put_pixel(global_x, global_y as u32, pixel);
                }
            }
        }
        output
    }
}
