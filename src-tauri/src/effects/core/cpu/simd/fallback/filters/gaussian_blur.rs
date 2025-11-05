use rayon::prelude::*;

pub fn gaussian_blur_5x5_fallback(data: &[f32], width: u32, height: u32) -> Vec<f32> {
    let kernel = [
        [0.003765, 0.015019, 0.023792, 0.015019, 0.003765],
        [0.015019, 0.059912, 0.094907, 0.059912, 0.015019],
        [0.023792, 0.094907, 0.150342, 0.094907, 0.023792],
        [0.015019, 0.059912, 0.094907, 0.059912, 0.015019],
        [0.003765, 0.015019, 0.023792, 0.015019, 0.003765],
    ];
    let width = width as usize;
    let height = height as usize;
    (0..height)
        .into_par_iter()
        .map(|y| {
            (0..width)
                .map(move |x| {
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
                    if weight_sum > 0.0 {
                        sum / weight_sum
                    } else {
                        0.0
                    }
                })
                .collect::<Vec<f32>>()
        })
        .flatten()
        .collect()
}
