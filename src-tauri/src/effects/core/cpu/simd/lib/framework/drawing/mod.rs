use crate::effects::core::cpu::simd::traits::*;
use image::{Rgba, RgbaImage};
use std::marker::PhantomData;

pub struct LineDrawer<A: SimdArchitecture> {
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture> LineDrawer<A> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }

    pub unsafe fn draw_horizontal_line_simd(
        &self,
        image: &mut RgbaImage,
        start_x: u32,
        end_x: u32,
        y: u32,
        color: Rgba<u8>,
    ) {
        let width = image.width() as usize;
        let height = image.height() as usize;

        if y as usize >= height {
            return;
        }

        let start_x = start_x.min(image.width() - 1) as usize;
        let end_x = end_x.min(image.width() - 1) as usize;

        if start_x >= end_x {
            return;
        }

        let line_length = end_x - start_x + 1;
        let y_offset = y as usize * width * 4;

        let image_data = image.as_mut_ptr();

        let rgba_u32 = ((color[3] as u32) << 24)
            | ((color[2] as u32) << 16)
            | ((color[1] as u32) << 8)
            | (color[0] as u32);

        let chunk_size = A::chunk_size();
        let pixels_per_chunk = chunk_size;
        let num_chunks = line_length / pixels_per_chunk;
        let remaining_pixels = line_length % pixels_per_chunk;

        let rgba_vec = A::set1_epi32(rgba_u32 as i32);

        for chunk_idx in 0..num_chunks {
            let pixel_offset = start_x + chunk_idx * pixels_per_chunk;
            let byte_offset = y_offset + pixel_offset * 4;

            A::store_si256(image_data.add(byte_offset) as *mut i32, &rgba_vec);
        }

        for i in 0..remaining_pixels {
            let pixel_offset = start_x + num_chunks * chunk_size + i;
            let byte_offset = y_offset + pixel_offset * 4;

            *image_data.add(byte_offset) = color[0];
            *image_data.add(byte_offset + 1) = color[1];
            *image_data.add(byte_offset + 2) = color[2];
            *image_data.add(byte_offset + 3) = color[3];
        }
    }

    pub unsafe fn draw_vertical_line_simd(
        &self,
        image: &mut RgbaImage,
        x: u32,
        start_y: u32,
        end_y: u32,
        color: Rgba<u8>,
    ) {
        let width = image.width() as usize;

        if x as usize >= width {
            return;
        }

        let start_y = start_y.min(image.height() - 1) as usize;
        let end_y = end_y.min(image.height() - 1) as usize;

        if start_y >= end_y {
            return;
        }

        let image_data = image.as_mut_ptr();
        let x_offset = x as usize * 4;
        let row_stride = width * 4;
        let line_length = end_y - start_y + 1;

        let rgba_u32 = ((color[3] as u32) << 24)
            | ((color[2] as u32) << 16)
            | ((color[1] as u32) << 8)
            | (color[0] as u32);

        let chunk_size = A::chunk_size();
        let rows_per_chunk = chunk_size;
        let num_chunks = line_length / rows_per_chunk;

        let mut row_offsets = Vec::with_capacity(line_length);
        for i in 0..line_length {
            row_offsets.push((start_y + i) * row_stride + x_offset);
        }

        let batch_size = chunk_size.min(8);
        let num_batches = line_length / batch_size;
        let remaining_rows = line_length % batch_size;

        for batch_idx in 0..num_batches {
            let batch_start = batch_idx * batch_size;

            for i in 0..batch_size {
                let byte_offset = row_offsets[batch_start + i];

                *(image_data.add(byte_offset) as *mut u32) = rgba_u32;
            }
        }

        for i in 0..remaining_rows {
            let y_pos = start_y + num_chunks * rows_per_chunk + i;
            let byte_offset = y_pos * row_stride + x_offset;

            *image_data.add(byte_offset) = color[0];
            *image_data.add(byte_offset + 1) = color[1];
            *image_data.add(byte_offset + 2) = color[2];
            *image_data.add(byte_offset + 3) = color[3];
        }
    }
}

pub fn draw_horizontal_line_simd<A: SimdArchitecture>(
    image: &mut RgbaImage,
    start_x: u32,
    end_x: u32,
    y: u32,
    color: Rgba<u8>,
) {
    let drawer = LineDrawer::<A>::new();
    unsafe {
        drawer.draw_horizontal_line_simd(image, start_x, end_x, y, color);
    }
}

pub fn draw_vertical_line_simd<A: SimdArchitecture>(
    image: &mut RgbaImage,
    x: u32,
    start_y: u32,
    end_y: u32,
    color: Rgba<u8>,
) {
    let drawer = LineDrawer::<A>::new();
    unsafe {
        drawer.draw_vertical_line_simd(image, x, start_y, end_y, color);
    }
}

pub fn draw_line_segment_simd<A: SimdArchitecture>(
    image: &mut RgbaImage,
    start: (f32, f32),
    end: (f32, f32),
    color: Rgba<u8>,
) {
    let start_x = start.0 as u32;
    let start_y = start.1 as u32;
    let end_x = end.0 as u32;
    let end_y = end.1 as u32;

    if start_y == end_y {
        let min_x = start_x.min(end_x);
        let max_x = start_x.max(end_x);
        draw_horizontal_line_simd::<A>(image, min_x, max_x, start_y, color);
    } else if start_x == end_x {
        let min_y = start_y.min(end_y);
        let max_y = start_y.max(end_y);
        draw_vertical_line_simd::<A>(image, start_x, min_y, max_y, color);
    } else {
        let dx = (end_x as i32 - start_x as i32).abs();
        let dy = (end_y as i32 - start_y as i32).abs();
        let sx = if start_x < end_x { 1 } else { -1 };
        let sy = if start_y < end_y { 1 } else { -1 };
        let mut err = dx - dy;

        let mut x = start_x as i32;
        let mut y = start_y as i32;

        loop {
            if x >= 0 && y >= 0 && (x as u32) < image.width() && (y as u32) < image.height() {
                image.put_pixel(x as u32, y as u32, color);
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
