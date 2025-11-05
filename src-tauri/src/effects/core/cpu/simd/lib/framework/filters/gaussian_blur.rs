use crate::effects::core::cpu::simd::traits::SimdArchitecture;
use rayon::prelude::*;

pub fn gaussian_blur_5x5<A: SimdArchitecture>(data: &[f32], width: u32, height: u32) -> Vec<f32> {
    let kernel = [
        [0.003765, 0.015019, 0.023792, 0.015019, 0.003765],
        [0.015019, 0.059912, 0.094907, 0.059912, 0.015019],
        [0.023792, 0.094907, 0.150342, 0.094907, 0.023792],
        [0.015019, 0.059912, 0.094907, 0.059912, 0.015019],
        [0.003765, 0.015019, 0.023792, 0.015019, 0.003765],
    ];
    let width = width as usize;
    let height = height as usize;
    let simd_width = A::chunk_size();
    (0..height)
        .into_par_iter()
        .map(|y| {
            let mut row_result = Vec::with_capacity(width);
            let width_chunks = width / simd_width;
            for x_chunk in 0..width_chunks {
                let x_base = x_chunk * simd_width;
                let mut sum_vec = unsafe { A::set1_ps(0.0) };
                let mut weight_vec = unsafe { A::set1_ps(0.0) };
                for ky in -2..=2 {
                    let sample_y = y as isize + ky;
                    if sample_y < 0 || sample_y >= height as isize {
                        continue;
                    }
                    for kx in -2..=2 {
                        let kernel_val = kernel[(ky + 2) as usize][(kx + 2) as usize];
                        let kernel_vec = unsafe { A::set1_ps(kernel_val) };
                        let mut data_arr = vec![0.0f32; simd_width];
                        let mut mask_arr = vec![0.0f32; simd_width];
                        for i in 0..simd_width {
                            let sample_x = x_base as isize + kx + i as isize;
                            if sample_x >= 0 && sample_x < width as isize {
                                let data_idx = sample_y as usize * width + sample_x as usize;
                                data_arr[i] = data[data_idx];
                                mask_arr[i] = 1.0;
                            }
                        }
                        let data_vec = unsafe { A::from_array_ps(&data_arr) };
                        let mask_vec = unsafe { A::from_array_ps(&mask_arr) };
                        sum_vec =
                            unsafe { A::add_ps(&sum_vec, &A::mul_ps(&data_vec, &kernel_vec)) };
                        weight_vec =
                            unsafe { A::add_ps(&weight_vec, &A::mul_ps(&mask_vec, &kernel_vec)) };
                    }
                }
                let mut sum_arr = [0.0f32; 16];
                let mut weight_arr = [0.0f32; 16];
                unsafe {
                    A::store_ps(sum_arr.as_mut_ptr(), &sum_vec);
                    A::store_ps(weight_arr.as_mut_ptr(), &weight_vec);
                }
                for i in 0..simd_width {
                    row_result.push(if weight_arr[i] > 0.0 {
                        sum_arr[i] / weight_arr[i]
                    } else {
                        0.0
                    });
                }
            }
            for x in (width_chunks * simd_width)..width {
                let mut sum = 0.0f32;
                let mut weight_sum = 0.0f32;
                for ky in -2..=2 {
                    for kx in -2..=2 {
                        let sample_x = x as isize + kx;
                        let sample_y = y as isize + ky;
                        if sample_x >= 0
                            && sample_x < width as isize
                            && sample_y >= 0
                            && sample_y < height as isize
                        {
                            let data_idx = sample_y as usize * width + sample_x as usize;
                            let kernel_val = kernel[(ky + 2) as usize][(kx + 2) as usize];
                            sum += data[data_idx] * kernel_val;
                            weight_sum += kernel_val;
                        }
                    }
                }
                row_result.push(if weight_sum > 0.0 {
                    sum / weight_sum
                } else {
                    0.0
                });
            }
            row_result
        })
        .flatten()
        .collect()
}
