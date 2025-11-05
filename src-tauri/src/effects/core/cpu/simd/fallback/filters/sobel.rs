use image::RgbaImage;
use rayon::prelude::*;

pub fn sobel_filter_fallback_parallel(input: &RgbaImage, threshold: f32) -> RgbaImage {
    let (width, height) = input.dimensions();
    let mut output = RgbaImage::new(width, height);

    let sobel_x = [[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]];

    let sobel_y = [[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]];

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

    let edge_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    if y >= 1 && y < height_usize - 1 && x >= 1 && x < width_usize - 1 {
                        let mut gx_r = 0.0;
                        let mut gx_g = 0.0;
                        let mut gx_b = 0.0;
                        let mut gy_r = 0.0;
                        let mut gy_g = 0.0;
                        let mut gy_b = 0.0;

                        for ky in -1..=1 {
                            for kx in -1..=1 {
                                let nx = (x as i32 + kx) as u32;
                                let ny = (y as i32 + ky) as u32;
                                let pixel = input.get_pixel(nx, ny);

                                let weight_x = sobel_x[(ky + 1) as usize][(kx + 1) as usize];
                                let weight_y = sobel_y[(ky + 1) as usize][(kx + 1) as usize];

                                gx_r += pixel[0] as f32 * weight_x;
                                gx_g += pixel[1] as f32 * weight_x;
                                gx_b += pixel[2] as f32 * weight_x;

                                gy_r += pixel[0] as f32 * weight_y;
                                gy_g += pixel[1] as f32 * weight_y;
                                gy_b += pixel[2] as f32 * weight_y;
                            }
                        }

                        let mag_r = (gx_r * gx_r + gy_r * gy_r).sqrt();
                        let mag_g = (gx_g * gx_g + gy_g * gy_g).sqrt();
                        let mag_b = (gx_b * gx_b + gy_b * gy_b).sqrt();

                        let mag = (mag_r + mag_g + mag_b) / 3.0;

                        let threshold_val = threshold * 255.0;
                        let value = if mag > threshold_val { 255 } else { 0 };

                        let new_pixel = image::Rgba([value, value, value, 255]);
                        local_pixels.push(((x as u32, y as u32), new_pixel));
                    } else {
                        let new_pixel = image::Rgba([0, 0, 0, 255]);
                        local_pixels.push(((x as u32, y as u32), new_pixel));
                    }
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in edge_results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
