use crate::effects::core::cpu::simd::traits::{SimdArchitecture, SimdFilter};
use image::{GrayImage, Luma, RgbaImage};
use rayon::prelude::*;
use std::marker::PhantomData;
pub struct HorizontalSobelFilter<A: SimdArchitecture + Sync> {
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture + Sync> HorizontalSobelFilter<A> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture + Sync> SimdFilter<A> for HorizontalSobelFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        if y == 0 || y >= input.height() as usize - 1 {
            let base_idx = local_y * width_usize + x_base;
            for i in 0..A::chunk_size().min(width_usize - x_base) {
                local_output[base_idx + i] = 0;
            }
            return;
        }

        let mut gx_accumulator = A::set1_ps(0.0);

        for ky in -1..=1 {
            for kx in -1..=1 {
                let weight = match (ky, kx) {
                    (-1, -1) => -1.0,
                    (-1, 0) => 0.0,
                    (-1, 1) => 1.0,
                    (0, -1) => -2.0,
                    (0, 0) => 0.0,
                    (0, 1) => 2.0,
                    (1, -1) => -1.0,
                    (1, 0) => 0.0,
                    (1, 1) => 1.0,
                    _ => 0.0,
                };

                if weight != 0.0 {
                    let weight_vec = A::set1_ps(weight);
                    let (r, g, b, _) = A::load_rgba_with_alpha(input, x_base, y, kx, ky);

                    let r_weight = A::set1_ps(0.299);
                    let g_weight = A::set1_ps(0.587);
                    let b_weight = A::set1_ps(0.114);

                    let gray = A::fmadd_ps(
                        &r,
                        &r_weight,
                        &A::fmadd_ps(&g, &g_weight, &A::mul_ps(&b, &b_weight)),
                    );
                    gx_accumulator = A::fmadd_ps(&gray, &weight_vec, &gx_accumulator);
                }
            }
        }

        let zero_vec = A::set1_ps(0.0);
        let neg_gx = A::sub_ps(&zero_vec, &gx_accumulator);
        let abs_gx = A::max_ps(&gx_accumulator, &neg_gx);

        let min_val = A::set1_ps(0.0);
        let max_val = A::set1_ps(255.0);
        let clamped = A::min_ps(&A::max_ps(&abs_gx, &min_val), &max_val);

        let mut temp_buffer = [0.0f32; 32];
        A::store_ps(temp_buffer.as_mut_ptr(), &clamped);

        let base_idx = local_y * width_usize + x_base;
        for i in 0..A::chunk_size().min(width_usize - x_base) {
            if x_base + i >= 1 && x_base + i < width_usize - 1 {
                local_output[base_idx + i] = temp_buffer[i] as u8;
            } else {
                local_output[base_idx + i] = 0;
            }
        }
    }

    fn process_scalar_pixel(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let idx = local_y * width_usize + x;

        if y == 0 || y >= input.height() as usize - 1 || x == 0 || x >= width_usize - 1 {
            local_output[idx] = 0;
            return;
        }

        let mut gx = 0.0f32;

        for ky in -1..=1 {
            for kx in -1..=1 {
                let weight = match (ky, kx) {
                    (-1, -1) => -1.0,
                    (-1, 0) => 0.0,
                    (-1, 1) => 1.0,
                    (0, -1) => -2.0,
                    (0, 0) => 0.0,
                    (0, 1) => 2.0,
                    (1, -1) => -1.0,
                    (1, 0) => 0.0,
                    (1, 1) => 1.0,
                    _ => 0.0,
                };

                if weight != 0.0 {
                    let nx = (x as i32 + kx) as u32;
                    let ny = (y as i32 + ky) as u32;
                    let pixel = input.get_pixel(nx, ny);

                    let gray =
                        0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32;
                    gx += gray * weight;
                }
            }
        }

        let result = gx.abs().min(255.0).max(0.0) as u8;
        local_output[idx] = result;
    }
}

pub fn horizontal_sobel_simd<A: SimdArchitecture + Sync>(input: &RgbaImage) -> GrayImage {
    let filter = HorizontalSobelFilter::<A>::new();

    let (width, height) = input.dimensions();
    let mut output = GrayImage::new(width, height);
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
            let mut local_output = vec![0u8; (end_y - start_y) * width_usize];

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

                let remaining_start = width_chunks * A::chunk_size();
                for x in remaining_start..width_usize {
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
        for (local_y, y) in (start_y..end_y).enumerate() {
            for x in 0..width_usize {
                let local_idx = local_y * width_usize + x;
                output.put_pixel(x as u32, y as u32, Luma([local_output[local_idx]]));
            }
        }
    }

    output
}

pub struct VerticalSobelFilter<A: SimdArchitecture + Sync> {
    pub _phantom: PhantomData<A>,
}

impl<A: SimdArchitecture + Sync> VerticalSobelFilter<A> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<A: SimdArchitecture + Sync> SimdFilter<A> for VerticalSobelFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        if y == 0 || y >= input.height() as usize - 1 {
            let base_idx = local_y * width_usize + x_base;
            for i in 0..A::chunk_size().min(width_usize - x_base) {
                local_output[base_idx + i] = 0;
            }
            return;
        }

        let mut gy_accumulator = A::set1_ps(0.0);

        for ky in -1..=1 {
            for kx in -1..=1 {
                let weight = match (ky, kx) {
                    (-1, -1) => -1.0,
                    (-1, 0) => -2.0,
                    (-1, 1) => -1.0,
                    (0, -1) => 0.0,
                    (0, 0) => 0.0,
                    (0, 1) => 0.0,
                    (1, -1) => 1.0,
                    (1, 0) => 2.0,
                    (1, 1) => 1.0,
                    _ => 0.0,
                };

                if weight != 0.0 {
                    let weight_vec = A::set1_ps(weight);
                    let (r, g, b, _) = A::load_rgba_with_alpha(input, x_base, y, kx, ky);

                    let r_weight = A::set1_ps(0.299);
                    let g_weight = A::set1_ps(0.587);
                    let b_weight = A::set1_ps(0.114);

                    let gray = A::fmadd_ps(
                        &r,
                        &r_weight,
                        &A::fmadd_ps(&g, &g_weight, &A::mul_ps(&b, &b_weight)),
                    );
                    gy_accumulator = A::fmadd_ps(&gray, &weight_vec, &gy_accumulator);
                }
            }
        }

        let zero_vec = A::set1_ps(0.0);
        let neg_gy = A::sub_ps(&zero_vec, &gy_accumulator);
        let abs_gy = A::max_ps(&gy_accumulator, &neg_gy);

        let min_val = A::set1_ps(0.0);
        let max_val = A::set1_ps(255.0);
        let clamped = A::min_ps(&A::max_ps(&abs_gy, &min_val), &max_val);

        let mut temp_buffer = [0.0f32; 32];
        A::store_ps(temp_buffer.as_mut_ptr(), &clamped);

        let base_idx = local_y * width_usize + x_base;
        for i in 0..A::chunk_size().min(width_usize - x_base) {
            if x_base + i >= 1 && x_base + i < width_usize - 1 {
                local_output[base_idx + i] = temp_buffer[i] as u8;
            } else {
                local_output[base_idx + i] = 0;
            }
        }
    }

    fn process_scalar_pixel(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let idx = local_y * width_usize + x;

        if y == 0 || y >= input.height() as usize - 1 || x == 0 || x >= width_usize - 1 {
            local_output[idx] = 0;
            return;
        }

        let mut gy = 0.0f32;

        for ky in -1..=1 {
            for kx in -1..=1 {
                let weight = match (ky, kx) {
                    (-1, -1) => -1.0,
                    (-1, 0) => -2.0,
                    (-1, 1) => -1.0,
                    (0, -1) => 0.0,
                    (0, 0) => 0.0,
                    (0, 1) => 0.0,
                    (1, -1) => 1.0,
                    (1, 0) => 2.0,
                    (1, 1) => 1.0,
                    _ => 0.0,
                };

                if weight != 0.0 {
                    let nx = (x as i32 + kx) as u32;
                    let ny = (y as i32 + ky) as u32;
                    let pixel = input.get_pixel(nx, ny);

                    let gray =
                        0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32;
                    gy += gray * weight;
                }
            }
        }

        let result = gy.abs().min(255.0).max(0.0) as u8;
        local_output[idx] = result;
    }
}

pub fn vertical_sobel_simd<A: SimdArchitecture + Sync>(input: &RgbaImage) -> GrayImage {
    let filter = VerticalSobelFilter::<A>::new();

    let (width, height) = input.dimensions();
    let mut output = GrayImage::new(width, height);
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
            let mut local_output = vec![0u8; (end_y - start_y) * width_usize];

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

                let remaining_start = width_chunks * A::chunk_size();
                for x in remaining_start..width_usize {
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
        for (local_y, y) in (start_y..end_y).enumerate() {
            for x in 0..width_usize {
                let local_idx = local_y * width_usize + x;
                output.put_pixel(x as u32, y as u32, Luma([local_output[local_idx]]));
            }
        }
    }

    output
}
