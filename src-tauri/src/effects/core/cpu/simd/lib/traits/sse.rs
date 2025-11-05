use super::simd_architecture::SimdArchitecture;
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

pub struct SseArchitecture;

impl SimdArchitecture for SseArchitecture {
    type FloatVector = __m128;
    type IntVector = __m128i;
    type IntVector128 = __m128i;

    fn chunk_size() -> usize {
        4
    }

    unsafe fn set1_ps(value: f32) -> Self::FloatVector {
        _mm_set1_ps(value)
    }

    unsafe fn set1_epi32(value: i32) -> Self::IntVector {
        _mm_set1_epi32(value)
    }

    unsafe fn setr_epi8_r_mask() -> Self::IntVector {
        _mm_setr_epi8(0, -1, -1, -1, 4, -1, -1, -1, 8, -1, -1, -1, 12, -1, -1, -1)
    }

    unsafe fn setr_epi8_g_mask() -> Self::IntVector {
        _mm_setr_epi8(1, -1, -1, -1, 5, -1, -1, -1, 9, -1, -1, -1, 13, -1, -1, -1)
    }

    unsafe fn setr_epi8_b_mask() -> Self::IntVector {
        _mm_setr_epi8(2, -1, -1, -1, 6, -1, -1, -1, 10, -1, -1, -1, 14, -1, -1, -1)
    }

    unsafe fn setr_epi8_a_mask() -> Self::IntVector {
        _mm_setr_epi8(3, -1, -1, -1, 7, -1, -1, -1, 11, -1, -1, -1, 15, -1, -1, -1)
    }

    unsafe fn add_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_add_ps(*a, *b)
    }

    unsafe fn add_epi32(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector {
        _mm_add_epi32(*a, *b)
    }

    unsafe fn sub_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_sub_ps(*a, *b)
    }

    unsafe fn mul_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_mul_ps(*a, *b)
    }

    unsafe fn div_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_div_ps(*a, *b)
    }

    unsafe fn fmadd_ps(
        a: &Self::FloatVector,
        b: &Self::FloatVector,
        c: &Self::FloatVector,
    ) -> Self::FloatVector {
        _mm_add_ps(_mm_mul_ps(*a, *b), *c)
    }

    unsafe fn sqrt_ps(a: &Self::FloatVector) -> Self::FloatVector {
        _mm_sqrt_ps(*a)
    }

    unsafe fn cmp_gt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_cmpgt_ps(*a, *b)
    }

    unsafe fn cmp_lt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_cmplt_ps(*a, *b)
    }

    unsafe fn cmp_le_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_cmple_ps(*a, *b)
    }

    unsafe fn cmp_ge_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_cmpge_ps(*a, *b)
    }

    unsafe fn min_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_min_ps(*a, *b)
    }

    unsafe fn max_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_max_ps(*a, *b)
    }

    unsafe fn or_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_or_ps(*a, *b)
    }

    unsafe fn and_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_and_ps(*a, *b)
    }

    unsafe fn andnot_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        _mm_andnot_ps(*a, *b)
    }

    unsafe fn load_ps(ptr: *const f32) -> Self::FloatVector {
        _mm_loadu_ps(ptr)
    }

    unsafe fn cvtps_epi32(a: &Self::FloatVector) -> Self::IntVector {
        _mm_cvtps_epi32(*a)
    }

    unsafe fn cvtpi32_ps(a: &Self::IntVector) -> Self::FloatVector {
        _mm_cvtepi32_ps(*a)
    }

    unsafe fn cvtepu8_epi32(a: &Self::IntVector) -> Self::IntVector {
        _mm_cvtepu8_epi32(*a)
    }

    unsafe fn shuffle_epi8(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector {
        _mm_shuffle_epi8(*a, *b)
    }

    unsafe fn castsi256_si128(a: &Self::IntVector) -> Self::IntVector128 {
        *a
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

        let r_vec = _mm_loadu_ps(r_values.as_ptr());
        let g_vec = _mm_loadu_ps(g_values.as_ptr());
        let b_vec = _mm_loadu_ps(b_values.as_ptr());
        let a_vec = _mm_loadu_ps(a_values.as_ptr());

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

        _mm_loadu_si128(rgba_vals.as_ptr() as *const __m128i)
    }

    unsafe fn store_ps(ptr: *mut f32, a: &Self::FloatVector) {
        _mm_storeu_ps(ptr, *a);
    }

    unsafe fn store_si256(ptr: *mut i32, a: &Self::IntVector) {
        _mm_storeu_si128(ptr as *mut __m128i, *a);
    }

    unsafe fn round_ps(a: &Self::FloatVector) -> Self::FloatVector {
        _mm_round_ps(*a, _MM_FROUND_TO_NEAREST_INT | _MM_FROUND_NO_EXC)
    }

    unsafe fn from_array_ps(arr: &[f32]) -> Self::FloatVector {
        debug_assert!(arr.len() >= 4);
        std::arch::x86_64::_mm_loadu_ps(arr.as_ptr())
    }

    unsafe fn atan2_ps(y: &Self::FloatVector, x: &Self::FloatVector) -> Self::FloatVector {
        let mut y_arr = [0.0f32; 4];
        let mut x_arr = [0.0f32; 4];
        _mm_storeu_ps(y_arr.as_mut_ptr(), *y);
        _mm_storeu_ps(x_arr.as_mut_ptr(), *x);
        let mut res = [0.0f32; 4];
        for i in 0..4 {
            res[i] = y_arr[i].atan2(x_arr[i]);
        }
        _mm_loadu_ps(res.as_ptr())
    }

    unsafe fn extract_f32(a: &Self::FloatVector, idx: usize) -> f32 {
        debug_assert!(idx < 4, "Index out of bounds for SSE vector");

        let mut tmp = [0.0f32; 4];
        _mm_storeu_ps(tmp.as_mut_ptr(), *a);
        tmp[idx]
    }
}
