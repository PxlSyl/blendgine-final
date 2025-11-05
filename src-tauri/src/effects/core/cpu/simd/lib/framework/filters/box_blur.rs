use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};

pub struct BoxBlurFilter<A: SimdArchitecture> {
    pub radius: i32,
    pub _phantom: std::marker::PhantomData<A>,
}

impl<A: SimdArchitecture> BoxBlurFilter<A> {
    pub fn new(radius: i32) -> Self {
        Self {
            radius,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for BoxBlurFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let mut r_sums = A::set1_epi32(0);
        let mut g_sums = A::set1_epi32(0);
        let mut b_sums = A::set1_epi32(0);
        let mut a_sums = A::set1_epi32(0);
        let mut pixel_count = 0;
        for ky in -self.radius..=self.radius {
            for kx in -self.radius..=self.radius {
                let ny = y as i32 + ky;
                if ny >= 0 && ny < input.height() as i32 {
                    let rgba_vec = A::load_rgba_raw(input, x_base, y, kx, ky);
                    let r_vec = A::shuffle_epi8(&rgba_vec, &A::setr_epi8_r_mask());
                    let g_vec = A::shuffle_epi8(&rgba_vec, &A::setr_epi8_g_mask());
                    let b_vec = A::shuffle_epi8(&rgba_vec, &A::setr_epi8_b_mask());
                    let a_vec = A::shuffle_epi8(&rgba_vec, &A::setr_epi8_a_mask());
                    r_sums = A::add_epi32(&r_sums, &A::cvtepu8_epi32(&A::castsi256_si128(&r_vec)));
                    g_sums = A::add_epi32(&g_sums, &A::cvtepu8_epi32(&A::castsi256_si128(&g_vec)));
                    b_sums = A::add_epi32(&b_sums, &A::cvtepu8_epi32(&A::castsi256_si128(&b_vec)));
                    a_sums = A::add_epi32(&a_sums, &A::cvtepu8_epi32(&A::castsi256_si128(&a_vec)));
                    pixel_count += 1;
                }
            }
        }
        if pixel_count > 0 {
            let count_vec = A::set1_epi32(pixel_count);
            let count_float = A::cvtpi32_ps(&count_vec);
            let r_avg = A::cvtps_epi32(&A::div_ps(&A::cvtpi32_ps(&r_sums), &count_float));
            let g_avg = A::cvtps_epi32(&A::div_ps(&A::cvtpi32_ps(&g_sums), &count_float));
            let b_avg = A::cvtps_epi32(&A::div_ps(&A::cvtpi32_ps(&b_sums), &count_float));
            let a_avg = A::cvtps_epi32(&A::div_ps(&A::cvtpi32_ps(&a_sums), &count_float));
            let mut result_buffer = [0u8; 32];
            A::store_si256(result_buffer.as_mut_ptr() as *mut i32, &r_avg);
            A::store_si256((result_buffer.as_mut_ptr() as *mut i32).add(8), &g_avg);
            A::store_si256((result_buffer.as_mut_ptr() as *mut i32).add(16), &b_avg);
            A::store_si256((result_buffer.as_mut_ptr() as *mut i32).add(24), &a_avg);
            let base_idx = (local_y * width_usize + x_base) * 4;
            local_output[base_idx..base_idx + A::chunk_size() * 4]
                .copy_from_slice(&result_buffer[..A::chunk_size() * 4]);
        }
    }
    fn process_scalar_pixel(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let mut r_sum = 0.0;
        let mut g_sum = 0.0;
        let mut b_sum = 0.0;
        let mut a_sum = 0.0;
        let mut pixel_count = 0;
        for ky in -self.radius..=self.radius {
            for kx in -self.radius..=self.radius {
                let nx = x as i32 + kx;
                let ny = y as i32 + ky;
                if nx >= 0 && nx < input.width() as i32 && ny >= 0 && ny < input.height() as i32 {
                    let pixel = input.get_pixel(nx as u32, ny as u32);
                    r_sum += pixel[0] as f32;
                    g_sum += pixel[1] as f32;
                    b_sum += pixel[2] as f32;
                    a_sum += pixel[3] as f32;
                    pixel_count += 1;
                }
            }
        }
        let pixel_count_f = pixel_count as f32;
        let r_avg = (r_sum / pixel_count_f).clamp(0.0, 255.0) as u8;
        let g_avg = (g_sum / pixel_count_f).clamp(0.0, 255.0) as u8;
        let b_avg = (b_sum / pixel_count_f).clamp(0.0, 255.0) as u8;
        let a_avg = (a_sum / pixel_count_f).clamp(0.0, 255.0) as u8;
        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx] = r_avg;
        local_output[local_idx + 1] = g_avg;
        local_output[local_idx + 2] = b_avg;
        local_output[local_idx + 3] = a_avg;
    }
}

pub fn box_blur<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    radius: i32,
) -> image::RgbaImage {
    let filter = BoxBlurFilter::<A>::new(radius);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
