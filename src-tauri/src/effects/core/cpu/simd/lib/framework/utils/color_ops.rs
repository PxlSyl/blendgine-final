use crate::effects::core::cpu::simd::traits::*;
use num_complex::Complex;
use rayon::prelude::*;

pub fn quantize_color<A: SimdArchitecture>(color: f32, quantization_factor: f32) -> f32 {
    unsafe {
        let color_vec = A::set1_ps(color);
        let factor_vec = A::set1_ps(quantization_factor);
        let div_result = A::div_ps(&color_vec, &factor_vec);
        let rounded = A::round_ps(&div_result);
        let result = A::mul_ps(&rounded, &factor_vec);
        let mut result_array = [0.0f32; 8];
        A::store_ps(result_array.as_mut_ptr(), &result);
        result_array[0]
    }
}

pub fn quantize_colors<A: SimdArchitecture>(
    colors: [f32; 3],
    quantization_factor: f32,
) -> [f32; 3] {
    unsafe {
        let r_vec = A::set1_ps(colors[0]);
        let g_vec = A::set1_ps(colors[1]);
        let b_vec = A::set1_ps(colors[2]);
        let factor_vec = A::set1_ps(quantization_factor);

        let r_div = A::div_ps(&r_vec, &factor_vec);
        let g_div = A::div_ps(&g_vec, &factor_vec);
        let b_div = A::div_ps(&b_vec, &factor_vec);

        let r_rounded = A::round_ps(&r_div);
        let g_rounded = A::round_ps(&g_div);
        let b_rounded = A::round_ps(&b_div);

        let r_result = A::mul_ps(&r_rounded, &factor_vec);
        let g_result = A::mul_ps(&g_rounded, &factor_vec);
        let b_result = A::mul_ps(&b_rounded, &factor_vec);

        let mut r_array = [0.0f32; 8];
        let mut g_array = [0.0f32; 8];
        let mut b_array = [0.0f32; 8];

        A::store_ps(r_array.as_mut_ptr(), &r_result);
        A::store_ps(g_array.as_mut_ptr(), &g_result);
        A::store_ps(b_array.as_mut_ptr(), &b_result);

        [r_array[0], g_array[0], b_array[0]]
    }
}
pub fn rgb_to_grayscale<A: SimdArchitecture>(rgb: &[u8], _width: u32, _height: u32) -> Vec<u8> {
    let pixel_count = rgb.len() / 3;
    let simd_width = A::chunk_size();
    let chunks = pixel_count / simd_width;
    let mut gray = Vec::with_capacity(pixel_count);
    for i in 0..chunks {
        let base = i * simd_width * 3;
        let mut r = vec![0.0f32; simd_width];
        let mut g = vec![0.0f32; simd_width];
        let mut b = vec![0.0f32; simd_width];
        let mut gray_array = vec![0.0f32; simd_width];
        for j in 0..simd_width {
            r[j] = rgb[base + j * 3] as f32;
            g[j] = rgb[base + j * 3 + 1] as f32;
            b[j] = rgb[base + j * 3 + 2] as f32;
        }
        let r_vec = unsafe { A::load_ps(r.as_ptr()) };
        let g_vec = unsafe { A::load_ps(g.as_ptr()) };
        let b_vec = unsafe { A::load_ps(b.as_ptr()) };
        unsafe {
            let v = A::add_ps(
                &A::mul_ps(&r_vec, &A::set1_ps(0.2126)),
                &A::add_ps(
                    &A::mul_ps(&g_vec, &A::set1_ps(0.7152)),
                    &A::mul_ps(&b_vec, &A::set1_ps(0.0722)),
                ),
            );
            let v = A::round_ps(&v);
            A::store_ps(gray_array.as_mut_ptr(), &v);
        }
        for j in 0..simd_width {
            gray.push(gray_array[j].clamp(0.0, 255.0) as u8);
        }
    }
    for i in (chunks * simd_width)..pixel_count {
        let base = i * 3;
        let r = rgb[base] as f32;
        let g = rgb[base + 1] as f32;
        let b = rgb[base + 2] as f32;
        let gray_val = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        gray.push(gray_val.round().clamp(0.0, 255.0) as u8);
    }
    gray
}

pub fn gray_to_rgb<A: SimdArchitecture>(gray: &[f32], _width: u32, _height: u32) -> Vec<u8> {
    let pixel_count = gray.len();
    let simd_width = A::chunk_size();
    let chunks = pixel_count / simd_width;
    let mut rgb = Vec::with_capacity(pixel_count * 3);
    for i in 0..chunks {
        let base = i * simd_width;
        let mut gray_arr = vec![0.0f32; simd_width];
        for j in 0..simd_width {
            gray_arr[j] = gray[base + j];
        }
        let gray_vec = unsafe { A::load_ps(gray_arr.as_ptr()) };
        let mut gray_out = vec![0.0f32; simd_width];
        unsafe {
            A::store_ps(gray_out.as_mut_ptr(), &gray_vec);
        }
        for j in 0..simd_width {
            let v = gray_out[j].round().clamp(0.0, 255.0) as u8;
            rgb.push(v);
            rgb.push(v);
            rgb.push(v);
        }
    }
    let start = chunks * simd_width;
    for i in start..pixel_count {
        let v = gray[i].round().clamp(0.0, 255.0) as u8;
        rgb.push(v);
        rgb.push(v);
        rgb.push(v);
    }
    rgb
}

pub fn compute_movement<A: SimdArchitecture>(
    frame1_gray: &[u8],
    frame2_gray: &[u8],
    _width: u32,
    _height: u32,
) -> Vec<f32> {
    let len = frame1_gray.len();
    let simd_width = A::chunk_size();
    let chunks = len / simd_width;
    let mut movement = Vec::with_capacity(len);
    for i in 0..chunks {
        let base = i * simd_width;
        let mut f1 = vec![0.0f32; simd_width];
        let mut f2 = vec![0.0f32; simd_width];
        for j in 0..simd_width {
            f1[j] = frame1_gray[base + j] as f32;
            f2[j] = frame2_gray[base + j] as f32;
        }
        let f1_vec = unsafe { A::load_ps(f1.as_ptr()) };
        let f2_vec = unsafe { A::load_ps(f2.as_ptr()) };
        let diff_vec = unsafe { A::sub_ps(&f1_vec, &f2_vec) };
        let zero_vec = unsafe { A::set1_ps(0.0) };
        let neg_vec = unsafe { A::sub_ps(&zero_vec, &diff_vec) };
        let abs_vec = unsafe { A::max_ps(&diff_vec, &neg_vec) };
        let mut abs_array = vec![0.0f32; simd_width];
        unsafe {
            A::store_ps(abs_array.as_mut_ptr(), &abs_vec);
        }
        for j in 0..simd_width {
            movement.push(abs_array[j]);
        }
    }
    let start = chunks * simd_width;
    for i in start..len {
        movement.push((frame1_gray[i] as f32 - frame2_gray[i] as f32).abs());
    }
    movement
}

pub fn normalize_to_255<A: SimdArchitecture>(data: &mut [f32]) {
    if data.is_empty() {
        return;
    }
    let simd_width = A::chunk_size();
    let chunks = data.len() / simd_width;
    let (min_val, max_val) = data
        .par_chunks(simd_width)
        .map(|block| {
            let v = unsafe { A::load_ps(block.as_ptr()) };
            let mut arr = vec![0.0f32; simd_width];
            unsafe {
                A::store_ps(arr.as_mut_ptr(), &v);
            }
            (
                arr.iter().cloned().fold(f32::INFINITY, f32::min),
                arr.iter().cloned().fold(f32::NEG_INFINITY, f32::max),
            )
        })
        .reduce(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min1, max1), (min2, max2)| (min1.min(min2), max1.max(max2)),
        );
    let (min_val, max_val) = data[(chunks * simd_width)..]
        .iter()
        .fold((min_val, max_val), |(min_acc, max_acc), &val| {
            (min_acc.min(val), max_acc.max(val))
        });
    if max_val > min_val {
        let range = max_val - min_val;
        let scale = 255.0 / range;
        data.par_chunks_mut(simd_width).for_each(|chunk| {
            if chunk.len() < simd_width {
                for v in chunk.iter_mut() {
                    *v = (*v - min_val) * scale;
                }
            } else {
                let scale_vec = unsafe { A::set1_ps(scale) };
                let min_vec = unsafe { A::set1_ps(min_val) };
                let v = unsafe { A::load_ps(chunk.as_ptr()) };
                let norm = unsafe { A::mul_ps(&A::sub_ps(&v, &min_vec), &scale_vec) };
                unsafe {
                    A::store_ps(chunk.as_mut_ptr(), &norm);
                }
            }
        });
        let start = chunks * simd_width;
        for i in start..data.len() {
            data[i] = (data[i] - min_val) * scale;
        }
    }
}

pub fn normalize_minmax<A: SimdArchitecture>(data: &mut [f32]) {
    if data.is_empty() {
        return;
    }
    let simd_width = A::chunk_size();
    let chunks = data.len() / simd_width;
    let (min_val, max_val) = data
        .par_chunks(simd_width)
        .map(|block| {
            let v = unsafe { A::load_ps(block.as_ptr()) };
            let mut arr = vec![0.0f32; simd_width];
            unsafe {
                A::store_ps(arr.as_mut_ptr(), &v);
            }
            (
                arr.iter().cloned().fold(f32::INFINITY, f32::min),
                arr.iter().cloned().fold(f32::NEG_INFINITY, f32::max),
            )
        })
        .reduce(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min1, max1), (min2, max2)| (min1.min(min2), max1.max(max2)),
        );
    let (min_val, max_val) = data[(chunks * simd_width)..]
        .iter()
        .fold((min_val, max_val), |(min_acc, max_acc), &val| {
            (min_acc.min(val), max_acc.max(val))
        });
    if max_val > min_val {
        let range = max_val - min_val;
        data.par_chunks_mut(simd_width).for_each(|chunk| {
            if chunk.len() < simd_width {
                for v in chunk.iter_mut() {
                    *v = (*v - min_val) / range;
                }
            } else {
                let range_vec = unsafe { A::set1_ps(range) };
                let min_vec = unsafe { A::set1_ps(min_val) };
                let v = unsafe { A::load_ps(chunk.as_ptr()) };
                let norm = unsafe { A::div_ps(&A::sub_ps(&v, &min_vec), &range_vec) };
                unsafe {
                    A::store_ps(chunk.as_mut_ptr(), &norm);
                }
            }
        });
        let start = chunks * simd_width;
        for i in start..data.len() {
            data[i] = (data[i] - min_val) / range;
        }
    }
}

pub fn cart_to_polar_2d<A: SimdArchitecture>(
    complex_data: &[Complex<f32>],
    rows: usize,
    cols: usize,
) -> (Vec<f32>, Vec<f32>) {
    let simd_width = A::chunk_size();
    let len = rows * cols;
    let chunks = len / simd_width;
    let mut magnitude = Vec::with_capacity(len);
    let mut phase = Vec::with_capacity(len);
    let (mag_simd, phase_simd): (Vec<f32>, Vec<f32>) = (0..chunks)
        .into_par_iter()
        .flat_map(|i| {
            let base = i * simd_width;
            let mut re = vec![0.0f32; simd_width];
            let mut im = vec![0.0f32; simd_width];
            for j in 0..simd_width {
                re[j] = complex_data[base + j].re;
                im[j] = complex_data[base + j].im;
            }
            let re_vec = unsafe { A::load_ps(re.as_ptr()) };
            let im_vec = unsafe { A::load_ps(im.as_ptr()) };
            let mag_vec = unsafe {
                A::sqrt_ps(&A::add_ps(
                    &A::mul_ps(&re_vec, &re_vec),
                    &A::mul_ps(&im_vec, &im_vec),
                ))
            };
            let phase_vec = unsafe { A::atan2_ps(&im_vec, &re_vec) };
            let mut mag_arr = vec![0.0f32; simd_width];
            let mut phase_arr = vec![0.0f32; simd_width];
            unsafe {
                A::store_ps(mag_arr.as_mut_ptr(), &mag_vec);
                A::store_ps(phase_arr.as_mut_ptr(), &phase_vec);
            }
            mag_arr
                .into_iter()
                .zip(phase_arr.into_iter())
                .collect::<Vec<(f32, f32)>>()
        })
        .unzip();
    magnitude.extend(mag_simd);
    phase.extend(phase_simd);
    let start = chunks * simd_width;
    for i in start..len {
        let c = complex_data[i];
        magnitude.push((c.re * c.re + c.im * c.im).sqrt());
        phase.push(c.im.atan2(c.re));
    }
    (magnitude, phase)
}
