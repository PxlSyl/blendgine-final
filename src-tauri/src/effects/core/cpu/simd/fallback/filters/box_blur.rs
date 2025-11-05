use rayon::prelude::*;

pub fn box_blur_fallback_parallel(input: &image::RgbaImage, radius: i32) -> image::RgbaImage {
    let (width, height) = input.dimensions();
    let mut output = image::RgbaImage::new(width, height);

    let width_usize = width as usize;
    let height_usize = height as usize;
    let num_threads = rayon::current_num_threads().max(1);
    let chunk_size = height_usize / num_threads;

    let row_ranges: Vec<_> = (0..num_threads)
        .map(|i| {
            let start = i * chunk_size;
            let end = if i == num_threads - 1 {
                height_usize
            } else {
                (i + 1) * chunk_size
            };
            (start, end)
        })
        .collect();

    let blur_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_output = vec![0u8; (end_y - start_y) * width_usize * 4];

            for (local_y, y) in (start_y..end_y).enumerate() {
                for x in 0..width_usize {
                    let mut r_sum = 0u32;
                    let mut g_sum = 0u32;
                    let mut b_sum = 0u32;
                    let mut a_sum = 0u32;
                    let mut count = 0;

                    for ky in -radius..=radius {
                        for kx in -radius..=radius {
                            let nx = x as i32 + kx;
                            let ny = y as i32 + ky;

                            if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                                let pixel = input.get_pixel(nx as u32, ny as u32);
                                r_sum += pixel[0] as u32;
                                g_sum += pixel[1] as u32;
                                b_sum += pixel[2] as u32;
                                a_sum += pixel[3] as u32;
                                count += 1;
                            }
                        }
                    }

                    if count > 0 {
                        let local_idx = (local_y * width_usize + x) * 4;
                        local_output[local_idx] = (r_sum / count) as u8;
                        local_output[local_idx + 1] = (g_sum / count) as u8;
                        local_output[local_idx + 2] = (b_sum / count) as u8;
                        local_output[local_idx + 3] = (a_sum / count) as u8;
                    }
                }
            }

            (start_y, end_y, local_output)
        })
        .collect();

    for (start_y, end_y, local_output) in blur_results {
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
