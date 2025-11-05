use image::RgbaImage;
use rayon::prelude::*;

pub fn chromatic_aberration_fallback_parallel(
    input: &RgbaImage,
    red_offset: f32,
    blue_offset: f32,
) -> RgbaImage {
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

    let aberration_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    let center_x = width as f32 / 2.0;
                    let center_y = height as f32 / 2.0;
                    let dx = x as f32 - center_x;
                    let dy = y as f32 - center_y;
                    let distance = (dx * dx + dy * dy).sqrt();
                    let max_distance = (center_x * center_x + center_y * center_y).sqrt();
                    let normalized_distance = distance / max_distance;

                    let red_offset_x = (dx * red_offset * normalized_distance) as i32;
                    let red_offset_y = (dy * red_offset * normalized_distance) as i32;
                    let blue_offset_x = (dx * blue_offset * normalized_distance) as i32;
                    let blue_offset_y = (dy * blue_offset * normalized_distance) as i32;

                    let red_x = (x as i32 + red_offset_x).clamp(0, width as i32 - 1) as u32;
                    let red_y = (y as i32 + red_offset_y).clamp(0, height as i32 - 1) as u32;
                    let blue_x = (x as i32 + blue_offset_x).clamp(0, width as i32 - 1) as u32;
                    let blue_y = (y as i32 + blue_offset_y).clamp(0, height as i32 - 1) as u32;

                    let center_pixel = input.get_pixel(x as u32, y as u32);
                    let red_pixel = input.get_pixel(red_x, red_y);
                    let blue_pixel = input.get_pixel(blue_x, blue_y);

                    let new_pixel = image::Rgba([
                        red_pixel[0],
                        center_pixel[1],
                        blue_pixel[2],
                        center_pixel[3],
                    ]);

                    local_pixels.push(((x as u32, y as u32), new_pixel));
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in aberration_results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
