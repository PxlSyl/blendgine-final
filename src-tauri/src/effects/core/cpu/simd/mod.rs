#[cfg(target_arch = "x86_64")]
use crate::effects::core::cpu::simd::traits::{Avx2Architecture, SseArchitecture};
use crate::types::BlendMode;
#[cfg(target_arch = "aarch64")]
use traits::NeonArchitecture;

use num_complex::Complex;

pub mod fallback;
pub use fallback::*;
pub mod lib;

pub use lib::*;

pub fn normalize_to_255_simd(data: &mut [f32]) {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            normalize_to_255::<Avx2Architecture>(data)
        } else if is_x86_feature_detected!("sse4.1") {
            normalize_to_255::<SseArchitecture>(data)
        } else {
            normalize_to_255_fallback(data)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            normalize_to_255::<NeonArchitecture>(data)
        } else {
            normalize_to_255_fallback(data)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        normalize_to_255_fallback(data)
    }
}

pub fn normalize_minmax_simd(data: &mut [f32]) {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            normalize_minmax::<Avx2Architecture>(data)
        } else if is_x86_feature_detected!("sse4.1") {
            normalize_minmax::<SseArchitecture>(data)
        } else {
            normalize_minmax_fallback(data)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            normalize_minmax::<NeonArchitecture>(data)
        } else {
            normalize_minmax_fallback(data)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        normalize_minmax_fallback(data)
    }
}

pub fn rgb_to_grayscale_simd(rgb: &[u8], width: u32, height: u32) -> Vec<u8> {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            rgb_to_grayscale::<Avx2Architecture>(rgb, width, height)
        } else if is_x86_feature_detected!("sse4.1") {
            rgb_to_grayscale::<SseArchitecture>(rgb, width, height)
        } else {
            rgb_to_grayscale_fallback(rgb, width, height)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            rgb_to_grayscale::<NeonArchitecture>(rgb, width, height)
        } else {
            rgb_to_grayscale_fallback(rgb, width, height)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        fallback::utils::color_ops::rgb_to_grayscale(rgb, width, height)
    }
}

pub fn gray_to_rgb_simd(gray: &[f32], width: u32, height: u32) -> Vec<u8> {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            gray_to_rgb::<Avx2Architecture>(gray, width, height)
        } else if is_x86_feature_detected!("sse4.1") {
            gray_to_rgb::<SseArchitecture>(gray, width, height)
        } else {
            gray_to_rgb_fallback(gray, width, height)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            gray_to_rgb::<NeonArchitecture>(gray, width, height)
        } else {
            gray_to_rgb_fallback(gray, width, height)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        gray_to_rgb_fallback(gray, width, height)
    }
}

pub fn gaussian_blur_5x5_simd(data: &[f32], width: u32, height: u32) -> Vec<f32> {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            gaussian_blur_5x5::<Avx2Architecture>(data, width, height)
        } else if is_x86_feature_detected!("sse4.1") {
            gaussian_blur_5x5::<SseArchitecture>(data, width, height)
        } else {
            gaussian_blur_5x5_fallback(data, width, height)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            gaussian_blur_5x5::<NeonArchitecture>(data, width, height)
        } else {
            gaussian_blur_5x5_fallback(data, width, height)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        gaussian_blur_5x5_fallback(data, width, height)
    }
}

pub fn compute_movement_simd(
    frame1_gray: &[u8],
    frame2_gray: &[u8],
    width: u32,
    height: u32,
) -> Vec<f32> {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            compute_movement::<Avx2Architecture>(frame1_gray, frame2_gray, width, height)
        } else if is_x86_feature_detected!("sse4.1") {
            compute_movement::<SseArchitecture>(frame1_gray, frame2_gray, width, height)
        } else {
            compute_movement_fallback(frame1_gray, frame2_gray, width, height)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            compute_movement::<NeonArchitecture>(frame1_gray, frame2_gray, width, height)
        } else {
            compute_movement_fallback(frame1_gray, frame2_gray, width, height)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        compute_movement_fallback(frame1_gray, frame2_gray, width, height)
    }
}

pub fn cart_to_polar_2d_simd(
    complex_data: &[Complex<f32>],
    rows: usize,
    cols: usize,
) -> (Vec<f32>, Vec<f32>) {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            cart_to_polar_2d::<Avx2Architecture>(complex_data, rows, cols)
        } else if is_x86_feature_detected!("sse4.1") {
            cart_to_polar_2d::<SseArchitecture>(complex_data, rows, cols)
        } else {
            cart_to_polar_2d_fallback(complex_data, rows, cols)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            cart_to_polar_2d::<NeonArchitecture>(complex_data, rows, cols)
        } else {
            cart_to_polar_2d_fallback(complex_data, rows, cols)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        cart_to_polar_2d_fallback(complex_data, rows, cols)
    }
}

#[inline(always)]
pub fn apply_blend_simd(
    blend_mode: BlendMode,
    source: &image::RgbaImage,
    destination: &image::RgbaImage,
) -> image::RgbaImage {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            lib::framework::blend::apply_blend::<Avx2Architecture>(blend_mode, source, destination)
        } else if is_x86_feature_detected!("sse4.1") {
            lib::framework::blend::apply_blend::<SseArchitecture>(blend_mode, source, destination)
        } else {
            fallback::blend::apply_blend(blend_mode, source, destination)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            lib::framework::blend::apply_blend::<NeonArchitecture>(blend_mode, source, destination)
        } else {
            fallback::blend::apply_blend(blend_mode, source, destination)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        fallback::blend::apply_blend(blend_mode, source, destination)
    }
}

#[inline(always)]
pub fn apply_blend_simd_inplace(
    blend_mode: BlendMode,
    source: &image::RgbaImage,
    destination: &mut image::RgbaImage,
) {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") {
            lib::framework::blend::apply_blend_inplace::<Avx2Architecture>(
                blend_mode,
                source,
                destination,
            )
        } else if is_x86_feature_detected!("sse4.1") {
            lib::framework::blend::apply_blend_inplace::<SseArchitecture>(
                blend_mode,
                source,
                destination,
            )
        } else {
            fallback::blend::apply_blend_inplace(blend_mode, source, destination)
        }
    }
    #[cfg(target_arch = "aarch64")]
    {
        if is_arm_feature_detected!("neon") {
            lib::framework::blend::apply_blend_inplace::<NeonArchitecture>(
                blend_mode,
                source,
                destination,
            )
        } else {
            fallback::blend::apply_blend_inplace(blend_mode, source, destination)
        }
    }
    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
    {
        fallback::blend::apply_blend_inplace(blend_mode, source, destination)
    }
}
