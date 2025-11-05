pub trait SimdArchitecture {
    type FloatVector;
    type IntVector;
    type IntVector128;

    fn chunk_size() -> usize;

    unsafe fn set1_ps(value: f32) -> Self::FloatVector;
    unsafe fn set1_epi32(value: i32) -> Self::IntVector;
    unsafe fn setr_epi8_r_mask() -> Self::IntVector;
    unsafe fn setr_epi8_g_mask() -> Self::IntVector;
    unsafe fn setr_epi8_b_mask() -> Self::IntVector;
    unsafe fn setr_epi8_a_mask() -> Self::IntVector;
    unsafe fn add_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn add_epi32(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector;
    unsafe fn sub_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn mul_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn div_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn fmadd_ps(
        a: &Self::FloatVector,
        b: &Self::FloatVector,
        c: &Self::FloatVector,
    ) -> Self::FloatVector;
    unsafe fn sqrt_ps(a: &Self::FloatVector) -> Self::FloatVector;
    #[allow(dead_code)]
    unsafe fn cmp_gt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn cmp_lt_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn cmp_le_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn cmp_ge_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn min_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn max_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn or_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn and_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn andnot_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn load_ps(ptr: *const f32) -> Self::FloatVector;
    unsafe fn cvtps_epi32(a: &Self::FloatVector) -> Self::IntVector;
    unsafe fn cvtpi32_ps(a: &Self::IntVector) -> Self::FloatVector;
    unsafe fn cvtepu8_epi32(a: &Self::IntVector128) -> Self::IntVector;
    unsafe fn shuffle_epi8(a: &Self::IntVector, b: &Self::IntVector) -> Self::IntVector;
    unsafe fn castsi256_si128(a: &Self::IntVector) -> Self::IntVector128;

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
    );
    unsafe fn load_rgba_raw(
        input: &image::RgbaImage,
        x_base: usize,
        y: usize,
        kx: i32,
        ky: i32,
    ) -> Self::IntVector;
    unsafe fn store_ps(ptr: *mut f32, a: &Self::FloatVector);
    unsafe fn store_si256(ptr: *mut i32, a: &Self::IntVector);

    unsafe fn round_ps(a: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn from_array_ps(arr: &[f32]) -> Self::FloatVector;
    unsafe fn atan2_ps(y: &Self::FloatVector, x: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn extract_f32(a: &Self::FloatVector, idx: usize) -> f32;
}
