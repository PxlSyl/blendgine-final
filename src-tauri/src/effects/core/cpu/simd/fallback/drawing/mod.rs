use image::{Rgba, RgbaImage};

pub fn draw_line_segment_fallback(
    image: &mut RgbaImage,
    start: (f32, f32),
    end: (f32, f32),
    color: Rgba<u8>,
) {
    let start_x = start.0 as u32;
    let start_y = start.1 as u32;
    let end_x = end.0 as u32;
    let end_y = end.1 as u32;

    let width = image.width() as usize;
    let height = image.height() as usize;

    let rgba_u32 = ((color[3] as u32) << 24)
        | ((color[2] as u32) << 16)
        | ((color[1] as u32) << 8)
        | (color[0] as u32);

    unsafe {
        let image_data = image.as_mut_ptr();

        if start_y == end_y {
            let y = start_y as usize;
            if y >= height {
                return;
            }

            let min_x = (start_x.min(end_x) as usize).min(width - 1);
            let max_x = (start_x.max(end_x) as usize).min(width - 1);
            let y_offset = y * width * 4;

            for x in min_x..=max_x {
                let byte_offset = y_offset + x * 4;
                *(image_data.add(byte_offset) as *mut u32) = rgba_u32;
            }
        } else if start_x == end_x {
            let x = start_x as usize;
            if x >= width {
                return;
            }

            let min_y = (start_y.min(end_y) as usize).min(height - 1);
            let max_y = (start_y.max(end_y) as usize).min(height - 1);
            let x_offset = x * 4;
            let row_stride = width * 4;

            for y in min_y..=max_y {
                let byte_offset = y * row_stride + x_offset;
                *(image_data.add(byte_offset) as *mut u32) = rgba_u32;
            }
        } else {
            let dx = (end_x as i32 - start_x as i32).abs();
            let dy = (end_y as i32 - start_y as i32).abs();
            let sx = if start_x < end_x { 1 } else { -1 };
            let sy = if start_y < end_y { 1 } else { -1 };
            let mut err = dx - dy;

            let mut x = start_x as i32;
            let mut y = start_y as i32;

            loop {
                if x >= 0 && y >= 0 && (x as usize) < width && (y as usize) < height {
                    let byte_offset = (y as usize) * width * 4 + (x as usize) * 4;
                    *(image_data.add(byte_offset) as *mut u32) = rgba_u32;
                }

                if x == end_x as i32 && y == end_y as i32 {
                    break;
                }

                let e2 = 2 * err;
                if e2 > -dy {
                    err -= dy;
                    x += sx;
                }
                if e2 < dx {
                    err += dx;
                    y += sy;
                }
            }
        }
    }
}
