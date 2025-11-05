use image::RgbaImage;
use rayon::prelude::*;

pub fn pixelate_fallback_parallel(input: &RgbaImage, block_size: u32) -> RgbaImage {
    let (width, height) = input.dimensions();
    let mut output = RgbaImage::new(width, height);

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

    let pixelate_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    let block_x = (x as u32 / block_size) * block_size;
                    let block_y = (y as u32 / block_size) * block_size;

                    let mut avg_color = [0u32; 4];
                    let mut pixel_count = 0;

                    for by in 0..block_size {
                        for bx in 0..block_size {
                            let nx = block_x + bx;
                            let ny = block_y + by;

                            if nx < width && ny < height {
                                let pixel = input.get_pixel(nx, ny);
                                avg_color[0] += pixel[0] as u32;
                                avg_color[1] += pixel[1] as u32;
                                avg_color[2] += pixel[2] as u32;
                                avg_color[3] += pixel[3] as u32;
                                pixel_count += 1;
                            }
                        }
                    }

                    if pixel_count > 0 {
                        let avg_pixel = image::Rgba([
                            (avg_color[0] / pixel_count) as u8,
                            (avg_color[1] / pixel_count) as u8,
                            (avg_color[2] / pixel_count) as u8,
                            (avg_color[3] / pixel_count) as u8,
                        ]);

                        local_pixels.push(((x as u32, y as u32), avg_pixel));
                    }
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in pixelate_results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
