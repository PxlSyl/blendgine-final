use crate::effects::core::cpu::simd::{
    cart_to_polar_2d_simd, compute_movement_simd, gaussian_blur_5x5_simd, gray_to_rgb_simd,
    normalize_minmax_simd, normalize_to_255_simd, rgb_to_grayscale_simd,
};
use crate::effects::core::interpolate::interpolation::InterpolationEngine;
use anyhow::Result;
use image::DynamicImage;
use rayon::prelude::*;
use rustfft::{num_complex::Complex, FftPlanner};
use std::{
    collections::{hash_map::DefaultHasher, HashMap},
    hash::{Hash, Hasher},
};

#[derive(Clone, Debug)]
pub struct FftResult {
    pub magnitude: Vec<f32>,
    pub phase: Vec<f32>,
    pub rows: usize,
    pub cols: usize,
}

pub struct FftCache {
    pub results: HashMap<u64, FftResult>,
    pub max_cache_size: usize,
}

impl FftCache {
    pub fn new(max_cache_size: usize) -> Self {
        Self {
            results: HashMap::new(),
            max_cache_size,
        }
    }

    pub fn get(&self, key: u64) -> Option<FftResult> {
        self.results.get(&key).cloned()
    }

    pub fn insert(&mut self, key: u64, result: FftResult) {
        if self.results.len() >= self.max_cache_size {
            if let Some(oldest_key) = self.results.keys().next().cloned() {
                self.results.remove(&oldest_key);
            }
        }
        self.results.insert(key, result);
    }

    pub fn clear(&mut self) {
        self.results.clear();
    }
}

pub fn compute_image_hash(frame: &DynamicImage) -> u64 {
    let rgba = frame.to_rgba8();
    let (width, height) = rgba.dimensions();

    let mut hasher = DefaultHasher::new();
    width.hash(&mut hasher);
    height.hash(&mut hasher);

    let sample_size = 1000;
    let step = (width * height / sample_size).max(1);

    for i in 0..sample_size {
        let x = (i * step % width) as usize;
        let y = (i * step / width) as usize;
        if y < height as usize {
            let pixel = rgba.get_pixel(x as u32, y as u32);
            pixel.hash(&mut hasher);
        }
    }

    hasher.finish()
}

impl InterpolationEngine {
    pub fn phase_based_interpolation_hybrid(
        &self,
        frame1: &DynamicImage,
        frame2: &DynamicImage,
        alpha: f32,
    ) -> Result<DynamicImage> {
        let frame1_rgba = frame1.to_rgba8();
        let frame2_rgba = frame2.to_rgba8();

        let (width, height) = frame1_rgba.dimensions();
        let pixel_count = (width * height) as usize;

        let frame1_data: Vec<(u8, u8, u8, u8)> = (0..height)
            .into_par_iter()
            .flat_map(|y| {
                let frame1_rgba_ref = &frame1_rgba;
                (0..width).into_par_iter().map(move |x| {
                    let pixel = frame1_rgba_ref.get_pixel(x, y);
                    (pixel[0], pixel[1], pixel[2], pixel[3])
                })
            })
            .collect();

        let frame2_data: Vec<(u8, u8, u8, u8)> = (0..height)
            .into_par_iter()
            .flat_map(|y| {
                let frame2_rgba_ref = &frame2_rgba;
                (0..width).into_par_iter().map(move |x| {
                    let pixel = frame2_rgba_ref.get_pixel(x, y);
                    (pixel[0], pixel[1], pixel[2], pixel[3])
                })
            })
            .collect();

        let mut frame1_rgb = Vec::with_capacity(pixel_count * 3);
        let mut frame1_alpha = Vec::with_capacity(pixel_count);
        let mut frame2_rgb = Vec::with_capacity(pixel_count * 3);
        let mut frame2_alpha = Vec::with_capacity(pixel_count);

        for (r, g, b, a) in frame1_data {
            frame1_rgb.extend_from_slice(&[r, g, b]);
            frame1_alpha.push(a);
        }

        for (r, g, b, a) in frame2_data {
            frame2_rgb.extend_from_slice(&[r, g, b]);
            frame2_alpha.push(a);
        }

        let frame1_gray = rgb_to_grayscale_simd(&frame1_rgb, width, height);
        let frame2_gray = rgb_to_grayscale_simd(&frame2_rgb, width, height);

        let nrows = self.get_optimal_dft_size(height as usize);
        let ncols = self.get_optimal_dft_size(width as usize);

        let hash1 = compute_image_hash(frame1);
        let hash2 = compute_image_hash(frame2);

        let (magnitude1, phase1) = {
            let cache = self.fft_cache.read();
            if let Some(cached_result) = cache.get(hash1) {
                if cached_result.rows == nrows && cached_result.cols == ncols {
                    (cached_result.magnitude.clone(), cached_result.phase.clone())
                } else {
                    drop(cache);
                    self.compute_fft_with_cache(
                        frame1,
                        &frame1_gray,
                        width,
                        height,
                        nrows,
                        ncols,
                        hash1,
                    )?
                }
            } else {
                drop(cache);
                self.compute_fft_with_cache(
                    frame1,
                    &frame1_gray,
                    width,
                    height,
                    nrows,
                    ncols,
                    hash1,
                )?
            }
        };

        let (magnitude2, phase2) = {
            let cache = self.fft_cache.read();
            if let Some(cached_result) = cache.get(hash2) {
                if cached_result.rows == nrows && cached_result.cols == ncols {
                    (cached_result.magnitude.clone(), cached_result.phase.clone())
                } else {
                    drop(cache);
                    self.compute_fft_with_cache(
                        frame2,
                        &frame2_gray,
                        width,
                        height,
                        nrows,
                        ncols,
                        hash2,
                    )?
                }
            } else {
                drop(cache);
                self.compute_fft_with_cache(
                    frame2,
                    &frame2_gray,
                    width,
                    height,
                    nrows,
                    ncols,
                    hash2,
                )?
            }
        };

        let (magnitude, phase): (Vec<f32>, Vec<f32>) = (0..nrows * ncols)
            .into_par_iter()
            .map(|i| {
                let mag = magnitude1[i] * (1.0 - alpha) + magnitude2[i] * alpha;
                let ph = phase1[i] * (1.0 - alpha) + phase2[i] * alpha;
                (mag, ph)
            })
            .unzip();

        let intermediate_complex: Vec<Complex<f32>> = (0..magnitude.len())
            .into_par_iter()
            .map(|i| Complex::from_polar(magnitude[i], phase[i]))
            .collect();
        let intermediate = self.compute_idft_2d(&intermediate_complex, nrows, ncols)?;

        let intermediate_magnitude: Vec<f32> = (0..height)
            .into_par_iter()
            .flat_map(|y| {
                let intermediate_ref = &intermediate;
                (0..width).into_par_iter().map(move |x| {
                    let src_idx = y as usize * ncols + x as usize;
                    intermediate_ref[src_idx]
                })
            })
            .collect();

        let mut intermediate_magnitude_mut = intermediate_magnitude;
        normalize_to_255_simd(&mut intermediate_magnitude_mut);

        let movement = compute_movement_simd(&frame1_gray, &frame2_gray, width, height);
        let blurred_movement = gaussian_blur_5x5_simd(&movement, width, height);
        let movement_ratio =
            (blurred_movement.par_iter().sum::<f32>() / blurred_movement.len() as f32 / 255.0)
                .clamp(0.0, 0.5);

        let rgb_interpolated: Vec<u8> = frame1_rgb
            .par_iter()
            .zip(frame2_rgb.par_iter())
            .map(|(&f1, &f2)| ((f1 as f32 * (1.0 - alpha) + f2 as f32 * alpha) as u8).clamp(0, 255))
            .collect();

        let intermediate_rgb = gray_to_rgb_simd(&intermediate_magnitude_mut, width, height);

        let final_rgb: Vec<u8> = rgb_interpolated
            .par_iter()
            .zip(intermediate_rgb.par_iter())
            .map(|(&rgb_interp, &intermediate)| {
                ((rgb_interp as f32 * (1.0 - movement_ratio) + intermediate as f32 * movement_ratio)
                    as u8)
                    .clamp(0, 255)
            })
            .collect();

        let alpha_interpolated: Vec<u8> = frame1_alpha
            .par_iter()
            .zip(frame2_alpha.par_iter())
            .map(|(&a1, &a2)| ((a1 as f32 * (1.0 - alpha) + a2 as f32 * alpha) as u8).clamp(0, 255))
            .collect();

        let final_image_data: Vec<image::Rgba<u8>> = (0..height)
            .into_par_iter()
            .flat_map(|y| {
                let final_rgb_ref = &final_rgb;
                let alpha_interpolated_ref = &alpha_interpolated;
                (0..width).into_par_iter().map(move |x| {
                    let idx = (y * width + x) as usize;
                    let rgb_idx = idx * 3;
                    image::Rgba([
                        final_rgb_ref[rgb_idx],
                        final_rgb_ref[rgb_idx + 1],
                        final_rgb_ref[rgb_idx + 2],
                        alpha_interpolated_ref[idx],
                    ])
                })
            })
            .collect();

        let mut final_image = image::RgbaImage::new(width, height);
        for (i, pixel) in final_image_data.into_iter().enumerate() {
            let x = i as u32 % width;
            let y = i as u32 / width;
            final_image.put_pixel(x, y, pixel);
        }

        Ok(DynamicImage::ImageRgba8(final_image))
    }

    pub fn compute_fft_with_cache(
        &self,
        _frame: &DynamicImage,
        frame_gray: &[u8],
        width: u32,
        height: u32,
        nrows: usize,
        ncols: usize,
        hash: u64,
    ) -> Result<(Vec<f32>, Vec<f32>)> {
        let nframe: Vec<f32> = (0..height)
            .into_par_iter()
            .flat_map(|y| {
                (0..width).into_par_iter().map(move |x| {
                    let src_idx = (y * width + x) as usize;
                    frame_gray[src_idx] as f32
                })
            })
            .collect();

        let mut padded_frame = vec![0.0f32; nrows * ncols];
        for y in 0..height {
            for x in 0..width {
                let src_idx = (y * width + x) as usize;
                let dst_idx = y as usize * ncols + x as usize;
                padded_frame[dst_idx] = nframe[src_idx];
            }
        }

        normalize_minmax_simd(&mut padded_frame);

        let dft = self.compute_dft_2d(&padded_frame, nrows, ncols)?;
        let (magnitude, phase) = cart_to_polar_2d_simd(&dft, nrows, ncols);

        let result = FftResult {
            magnitude: magnitude.clone(),
            phase: phase.clone(),
            rows: nrows,
            cols: ncols,
        };

        {
            let mut cache = self.fft_cache.write();

            if cache.results.len() >= cache.max_cache_size * 90 / 100 {
                cache.clear();
            }

            cache.insert(hash, result);
        }

        Ok((magnitude, phase))
    }

    pub fn get_optimal_dft_size(&self, size: usize) -> usize {
        let mut optimal = 1;
        while optimal < size {
            optimal *= 2;
        }
        optimal
    }

    pub fn compute_dft_2d(
        &self,
        data: &[f32],
        rows: usize,
        cols: usize,
    ) -> Result<Vec<Complex<f32>>> {
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(rows);
        let fft_cols = planner.plan_fft_forward(cols);

        let mut complex_data = vec![Complex::new(0.0, 0.0); rows * cols];

        for i in 0..rows * cols {
            complex_data[i] = Complex::new(data[i], 0.0);
        }

        for row in 0..rows {
            let row_start = row * cols;
            let row_end = row_start + cols;
            fft.process(&mut complex_data[row_start..row_end]);
        }

        for col in 0..cols {
            let mut col_data = vec![Complex::new(0.0, 0.0); rows];
            for row in 0..rows {
                col_data[row] = complex_data[row * cols + col];
            }
            fft_cols.process(&mut col_data);
            for row in 0..rows {
                complex_data[row * cols + col] = col_data[row];
            }
        }

        Ok(complex_data)
    }

    pub fn compute_idft_2d(
        &self,
        complex_data: &[Complex<f32>],
        rows: usize,
        cols: usize,
    ) -> Result<Vec<f32>> {
        let mut planner = FftPlanner::new();
        let ifft = planner.plan_fft_inverse(rows);
        let ifft_cols = planner.plan_fft_inverse(cols);

        let mut data = complex_data.to_vec();

        for row in 0..rows {
            let row_start = row * cols;
            let row_end = row_start + cols;
            ifft.process(&mut data[row_start..row_end]);
        }

        for col in 0..cols {
            let mut col_data = vec![Complex::new(0.0, 0.0); rows];
            for row in 0..rows {
                col_data[row] = data[row * cols + col];
            }
            ifft_cols.process(&mut col_data);
            for row in 0..rows {
                data[row * cols + col] = col_data[row];
            }
        }

        let mut result = vec![0.0f32; rows * cols];
        let total_size = (rows * cols) as f32;

        for i in 0..rows * cols {
            result[i] = data[i].re / total_size;
        }

        Ok(result)
    }
}
