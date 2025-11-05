use image::RgbaImage;
use rayon::prelude::*;

pub fn sharpen_filter_fallback_parallel(input: &RgbaImage, intensity: f32) -> RgbaImage {
    let (width, height) = input.dimensions();
    let mut output = RgbaImage::new(width, height);

    let kernel = [-1.0, -1.0, -1.0, -1.0, 9.0, -1.0, -1.0, -1.0, -1.0];

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

    let sharpen_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    let mut sum = [0.0f32; 4];

                    for ky in -1..=1 {
                        for kx in -1..=1 {
                            let nx = (x as i32 + kx).clamp(0, width as i32 - 1) as u32;
                            let ny = (y as i32 + ky).clamp(0, height as i32 - 1) as u32;
                            let pixel = input.get_pixel(nx, ny);
                            let kernel_value = kernel[((ky + 1) * 3 + (kx + 1)) as usize];

                            sum[0] += pixel[0] as f32 * kernel_value;
                            sum[1] += pixel[1] as f32 * kernel_value;
                            sum[2] += pixel[2] as f32 * kernel_value;
                            sum[3] += pixel[3] as f32;
                        }
                    }

                    let new_pixel = image::Rgba([
                        (sum[0] * intensity).clamp(0.0, 255.0) as u8,
                        (sum[1] * intensity).clamp(0.0, 255.0) as u8,
                        (sum[2] * intensity).clamp(0.0, 255.0) as u8,
                        (sum[3] / 9.0).clamp(0.0, 255.0) as u8,
                    ]);

                    local_pixels.push(((x as u32, y as u32), new_pixel));
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in sharpen_results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
