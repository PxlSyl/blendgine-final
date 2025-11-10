pub trait SimdArchitecture {
    type FloatVector;
    type IntVector;
    type IntVector128;

    fn chunk_size() -> usize;

    unsafe fn set1_ps(value: f32) -> Self::FloatVector;
    unsafe fn add_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn sub_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn mul_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn div_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn sqrt_ps(a: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn max_ps(a: &Self::FloatVector, b: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn load_ps(ptr: *const f32) -> Self::FloatVector;
    unsafe fn store_ps(ptr: *mut f32, a: &Self::FloatVector);
    unsafe fn round_ps(a: &Self::FloatVector) -> Self::FloatVector;
    unsafe fn from_array_ps(arr: &[f32]) -> Self::FloatVector;
    unsafe fn atan2_ps(y: &Self::FloatVector, x: &Self::FloatVector) -> Self::FloatVector;
}
