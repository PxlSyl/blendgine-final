use image::RgbaImage;
use rayon::prelude::*;

pub fn vignette_fallback_parallel(
    input: &RgbaImage,
    center_x: f32,
    center_y: f32,
    max_radius: f32,
    vignette_strength: f32,
    vignette_width: f32,
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

    let vignette_results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    let dx = x as f32 - center_x;
                    let dy = y as f32 - center_y;
                    let distance = (dx * dx + dy * dy).sqrt();
                    let vignette = if distance < max_radius - vignette_width {
                        1.0
                    } else if distance > max_radius {
                        vignette_strength
                    } else {
                        let t = (distance - (max_radius - vignette_width)) / vignette_width;
                        1.0 - t * (1.0 - vignette_strength)
                    };

                    let pixel = input.get_pixel(x as u32, y as u32);
                    let new_pixel = image::Rgba([
                        (pixel[0] as f32 * vignette) as u8,
                        (pixel[1] as f32 * vignette) as u8,
                        (pixel[2] as f32 * vignette) as u8,
                        pixel[3],
                    ]);

                    local_pixels.push(((x as u32, y as u32), new_pixel));
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in vignette_results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
