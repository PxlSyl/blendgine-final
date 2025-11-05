use image::{GrayImage, Luma, RgbaImage};
use rayon::prelude::*;

pub fn horizontal_sobel_fallback(input: &RgbaImage) -> GrayImage {
    let (width, height) = input.dimensions();
    let mut output = GrayImage::new(width, height);

    let sobel_x = [[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]];

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

    let results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    if y >= 1 && y < height_usize - 1 && x >= 1 && x < width_usize - 1 {
                        let mut gx = 0.0f32;

                        for ky in -1..=1 {
                            for kx in -1..=1 {
                                let nx = (x as i32 + kx) as u32;
                                let ny = (y as i32 + ky) as u32;
                                let pixel = input.get_pixel(nx, ny);

                                let gray = 0.299 * pixel[0] as f32
                                    + 0.587 * pixel[1] as f32
                                    + 0.114 * pixel[2] as f32;
                                let weight = sobel_x[(ky + 1) as usize][(kx + 1) as usize];
                                gx += gray * weight;
                            }
                        }

                        let result = gx.abs().min(255.0).max(0.0) as u8;
                        local_pixels.push(((x as u32, y as u32), Luma([result])));
                    } else {
                        local_pixels.push(((x as u32, y as u32), Luma([0])));
                    }
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}

pub fn vertical_sobel_fallback(input: &RgbaImage) -> GrayImage {
    let (width, height) = input.dimensions();
    let mut output = GrayImage::new(width, height);

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

    let results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_pixels = Vec::new();

            for y in start_y..end_y {
                for x in 0..width_usize {
                    if y >= 1 && y < height_usize - 1 && x >= 1 && x < width_usize - 1 {
                        let mut gy = 0.0f32;

                        for ky in -1..=1 {
                            for kx in -1..=1 {
                                let nx = (x as i32 + kx) as u32;
                                let ny = (y as i32 + ky) as u32;
                                let pixel = input.get_pixel(nx, ny);

                                let gray = 0.299 * pixel[0] as f32
                                    + 0.587 * pixel[1] as f32
                                    + 0.114 * pixel[2] as f32;
                                let weight = sobel_y[(ky + 1) as usize][(kx + 1) as usize];
                                gy += gray * weight;
                            }
                        }

                        let result = gy.abs().min(255.0).max(0.0) as u8;
                        local_pixels.push(((x as u32, y as u32), Luma([result])));
                    } else {
                        local_pixels.push(((x as u32, y as u32), Luma([0])));
                    }
                }
            }

            (start_y, end_y, local_pixels)
        })
        .collect();

    for (_start_y, _end_y, local_pixels) in results {
        for (pos, pixel) in local_pixels {
            output.put_pixel(pos.0, pos.1, pixel);
        }
    }

    output
}
