use num_complex::Complex;
use rayon::prelude::*;

pub fn quantize_color_fallback(color: f32, quantization_factor: f32) -> f32 {
    (color / quantization_factor).round() * quantization_factor
}

pub fn quantize_colors_fallback(colors: [f32; 3], quantization_factor: f32) -> [f32; 3] {
    [
        quantize_color_fallback(colors[0], quantization_factor),
        quantize_color_fallback(colors[1], quantization_factor),
        quantize_color_fallback(colors[2], quantization_factor),
    ]
}

pub fn rgb_to_grayscale_fallback(rgb: &[u8], _width: u32, _height: u32) -> Vec<u8> {
    let pixel_count = rgb.len() / 3;
    (0..pixel_count)
        .into_par_iter()
        .map(|i| {
            let base = i * 3;
            let r = rgb[base] as f32;
            let g = rgb[base + 1] as f32;
            let b = rgb[base + 2] as f32;
            let gray_val = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            gray_val.round().clamp(0.0, 255.0) as u8
        })
        .collect()
}

pub fn compute_movement_fallback(
    frame1_gray: &[u8],
    frame2_gray: &[u8],
    _width: u32,
    _height: u32,
) -> Vec<f32> {
    let len = frame1_gray.len();
    (0..len)
        .into_par_iter()
        .map(|i| (frame1_gray[i] as f32 - frame2_gray[i] as f32).abs())
        .collect()
}

pub fn normalize_to_255_fallback(data: &mut [f32]) {
    if data.is_empty() {
        return;
    }
    let (min_val, max_val) = data
        .par_iter()
        .cloned()
        .fold(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min_acc, max_acc), val| (min_acc.min(val), max_acc.max(val)),
        )
        .reduce(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min1, max1), (min2, max2)| (min1.min(min2), max1.max(max2)),
        );
    if max_val > min_val {
        let range = max_val - min_val;
        let scale = 255.0 / range;
        data.par_iter_mut().for_each(|v| {
            *v = (*v - min_val) * scale;
        });
    }
}

pub fn normalize_minmax_fallback(data: &mut [f32]) {
    if data.is_empty() {
        return;
    }
    let (min_val, max_val) = data
        .par_iter()
        .cloned()
        .fold(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min_acc, max_acc), val| (min_acc.min(val), max_acc.max(val)),
        )
        .reduce(
            || (f32::INFINITY, f32::NEG_INFINITY),
            |(min1, max1), (min2, max2)| (min1.min(min2), max1.max(max2)),
        );
    if max_val > min_val {
        let range = max_val - min_val;
        data.par_iter_mut().for_each(|v| {
            *v = (*v - min_val) / range;
        });
    }
}

pub fn cart_to_polar_2d_fallback(
    complex_data: &[Complex<f32>],
    rows: usize,
    cols: usize,
) -> (Vec<f32>, Vec<f32>) {
    let len = rows * cols;
    let (magnitude, phase): (Vec<f32>, Vec<f32>) = (0..len)
        .into_par_iter()
        .map(|i| {
            let c = complex_data[i];
            ((c.re * c.re + c.im * c.im).sqrt(), c.im.atan2(c.re))
        })
        .unzip();
    (magnitude, phase)
}

pub fn gray_to_rgb_fallback(gray: &[f32], _width: u32, _height: u32) -> Vec<u8> {
    let pixel_count = gray.len();
    (0..pixel_count)
        .into_par_iter()
        .flat_map(|i| {
            let v = gray[i].round().clamp(0.0, 255.0) as u8;
            vec![v, v, v]
        })
        .collect()
}
