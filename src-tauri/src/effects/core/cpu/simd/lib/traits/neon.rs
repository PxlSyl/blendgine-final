use super::simd_architecture::SimdArchitecture;
#[cfg(target_arch = "aarch64")]
use std::arch::aarch64::*;

pub struct NeonArchitecture;

impl SimdArchitecture for NeonArchitecture {
    type FloatVector = float32x4_t;
    type IntVector = int32x4_t;
    type IntVector128 = int32x4_t;

    fn chunk_size() -> usize {
        4
    }

    unsafe fn set1_ps(value: f32) -> Self::FloatVector {
        vdupq_n_f32(value)
    }

    unsafe fn set1_epi32(value: i32) -> Self::IntVector {
        vdupq_n_s32(value)
    }

    unsafe fn setr_epi8_r_mask() -> Self::IntVector {
        vdupq_n_s32(0)
    }

    unsafe fn setr_epi8_g_mask() -> Self::IntVector {
        vdupq_n_s32(0)
    }

    unsafe fn setr_epi8_b_mask() -> Self::IntVector {
        vdupq_n_s32(0)
    }

    unsafe fn setr_epi8_a_mask() -> Self::IntVector {
        vdupq_n_s32(0)
    }

    unsafe fn add_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vaddq_f32(*a, *b)
    }

    unsafe fn add_epi32(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector {
        vaddq_s32(*a, *b)
    }

    unsafe fn sub_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vsubq_f32(*a, *b)
    }

    unsafe fn mul_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vmulq_f32(*a, *b)
    }

    unsafe fn div_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vdivq_f32(*a, *b)
    }

    unsafe fn fmadd_ps(
        a: &Self::FloatVector,
        b: &Self::FloatVector,
        c: &Self::FloatVector,
    ) -> Self::FloatVector {
        vaddq_f32(vmulq_f32(*a, *b), *c)
    }

    unsafe fn sqrt_ps(a: &Self::FloatVector) -> Self::FloatVector {
        vsqrtq_f32(*a)
    }

    unsafe fn cmp_gt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vcgtq_f32(*a, *b)
    }

    unsafe fn cmp_lt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vcltq_f32(*a, *b)
    }

    unsafe fn cmp_le_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vcleq_f32(*a, *b)
    }

    unsafe fn cmp_ge_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vcgeq_f32(*a, *b)
    }

    unsafe fn min_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vminq_f32(*a, *b)
    }

    unsafe fn max_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vmaxq_f32(*a, *b)
    }

    unsafe fn or_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vorrq_f32(*a, *b)
    }

    unsafe fn and_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vandq_f32(*a, *b)
    }

    unsafe fn andnot_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        vbicq_f32(*a, *b)
    }

    unsafe fn load_ps(ptr: *const f32) -> Self::FloatVector {
        vld1q_f32(ptr)
    }

    unsafe fn cvtps_epi32(a: &Self::FloatVector) -> Self::IntVector {
        vcvtq_s32_f32(*a)
    }

    unsafe fn cvtpi32_ps(a: &Self::IntVector) -> Self::FloatVector {
        vcvtq_f32_s32(*a)
    }

    unsafe fn cvtepu8_epi32(a: &Self::IntVector) -> Self::IntVector {
        vcvtq_s32_f32(*a)
    }

    unsafe fn shuffle_epi8(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector {
        vshlq_s32(*a, vdupq_n_s32(8))
    }

    unsafe fn castsi256_si128(a: &Self::IntVector) -> Self::IntVector128 {
        vcvtq_s32_f32(*a)
    }

    unsafe fn load_rgba_with_alpha(
        input: &image::RgbaImage,
        x_base: usize,
        y: usize,
        kx: i32,
        ky: i32,
    ) -> (
        Self::FloatVector,
        Self::FloatVector,
        Self::FloatVector,
        Self::FloatVector,
    ) {
        let _nx = (x_base as i32 + kx).clamp(0, input.width() as i32 - 1) as u32;
        let ny = (y as i32 + ky).clamp(0, input.height() as i32 - 1) as u32;

        let mut r_values = [0.0f32; 4];
        let mut g_values = [0.0f32; 4];
        let mut b_values = [0.0f32; 4];
        let mut a_values = [0.0f32; 4];

        for i in 0..4 {
            let x = x_base + i;
            if x >= input.width() as usize {
                continue;
            }
            let pixel = input.get_pixel(x as u32, ny);
            r_values[i] = pixel[0] as f32;
            g_values[i] = pixel[1] as f32;
            b_values[i] = pixel[2] as f32;
            a_values[i] = pixel[3] as f32;
        }

        let r_vec = vld1q_f32(r_values.as_ptr());
        let g_vec = vld1q_f32(g_values.as_ptr());
        let b_vec = vld1q_f32(b_values.as_ptr());
        let a_vec = vld1q_f32(a_values.as_ptr());

        (r_vec, g_vec, b_vec, a_vec)
    }

    unsafe fn load_rgba_raw(
        input: &image::RgbaImage,
        x_base: usize,
        y: usize,
        kx: i32,
        ky: i32,
    ) -> Self::IntVector {
        let _nx = (x_base as i32 + kx).clamp(0, input.width() as i32 - 1) as u32;
        let ny = (y as i32 + ky).clamp(0, input.height() as i32 - 1) as u32;

        let mut rgba_vals = [0u8; 16];

        for i in 0..4 {
            let x = x_base + i;
            if x >= input.width() as usize {
                continue;
            }
            let pixel = input.get_pixel(x as u32, ny);
            let base_idx = i * 4;
            rgba_vals[base_idx] = pixel[0];
            rgba_vals[base_idx + 1] = pixel[1];
            rgba_vals[base_idx + 2] = pixel[2];
            rgba_vals[base_idx + 3] = pixel[3];
        }

        vld1q_u8(rgba_vals.as_ptr())
    }

    unsafe fn store_ps(ptr: *mut f32, a: &Self::FloatVector) {
        vst1q_f32(ptr, *a);
    }

    unsafe fn store_si256(ptr: *mut i32, a: &Self::IntVector) {
        vst1q_s32(ptr, *a);
    }

    unsafe fn round_ps(a: &Self::FloatVector) -> Self::FloatVector {
        vcvtq_f32_s32(vcvtq_s32_f32(*a))
    }

    unsafe fn from_array_ps(arr: &[f32]) -> Self::FloatVector {
        debug_assert!(arr.len() >= 4);
        vld1q_f32(arr.as_ptr())
    }
    unsafe fn atan2_ps(y: &Self::FloatVector, x: &Self::FloatVector) -> Self::FloatVector {
        let mut y_arr = [0.0f32; 4];
        let mut x_arr = [0.0f32; 4];
        vst1q_f32(y_arr.as_mut_ptr(), *y);
        vst1q_f32(x_arr.as_mut_ptr(), *x);
        let mut res = [0.0f32; 4];
        for i in 0..4 {
            res[i] = y_arr[i].atan2(x_arr[i]);
        }
        vld1q_f32(res.as_ptr())
    }

    unsafe fn extract_f32(a: &Self::FloatVector, idx: usize) -> f32 {
        debug_assert!(idx < 4, "Index out of bounds for NEON vector");

        let mut result: f32 = 0.0;
        let mut tmp = [0.0f32; 4];
        vst1q_f32(tmp.as_mut_ptr(), *a);
        result = tmp[idx];

        result
    }
}
