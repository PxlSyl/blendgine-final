use super::simd_architecture::SimdArchitecture;
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

pub struct Avx2Architecture;

impl SimdArchitecture for Avx2Architecture {
    type FloatVector = __m256;
    type IntVector = __m256i;
    type IntVector128 = __m128i;

    fn chunk_size() -> usize {
        8
    }

    unsafe fn set1_ps(value: f32) -> Self::FloatVector {
        unsafe { _mm256_set1_ps(value) }
    }

    unsafe fn add_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_add_ps(*a, *b) }
    }

    unsafe fn sub_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_sub_ps(*a, *b) }
    }

    unsafe fn mul_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_mul_ps(*a, *b) }
    }

    unsafe fn div_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_div_ps(*a, *b) }
    }

    unsafe fn sqrt_ps(a: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_sqrt_ps(*a) }
    }

    unsafe fn max_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_max_ps(*a, *b) }
    }

    unsafe fn load_ps(ptr: *const f32) -> Self::FloatVector {
        unsafe { _mm256_loadu_ps(ptr) }
    }

    unsafe fn store_ps(ptr: *mut f32, a: &Self::FloatVector) {
        unsafe { _mm256_storeu_ps(ptr, *a) };
    }

    unsafe fn round_ps(a: &Self::FloatVector) -> Self::FloatVector {
        unsafe { _mm256_round_ps(*a, _MM_FROUND_TO_NEAREST_INT | _MM_FROUND_NO_EXC) }
    }

    unsafe fn from_array_ps(arr: &[f32]) -> Self::FloatVector {
        debug_assert!(arr.len() >= 8);
        unsafe { std::arch::x86_64::_mm256_loadu_ps(arr.as_ptr()) }
    }

    unsafe fn atan2_ps(y: &Self::FloatVector, x: &Self::FloatVector) -> Self::FloatVector {
        let mut y_arr = [0.0f32; 8];
        let mut x_arr = [0.0f32; 8];
        unsafe {
            _mm256_storeu_ps(y_arr.as_mut_ptr(), *y);
            _mm256_storeu_ps(x_arr.as_mut_ptr(), *x);
        }
        let mut res = [0.0f32; 8];
        for i in 0..8 {
            res[i] = y_arr[i].atan2(x_arr[i]);
        }
        unsafe { _mm256_loadu_ps(res.as_ptr()) }
    }
}
