use crate::effects::core::cpu::simd::{framework::simd_processor::SimdProcessor, traits::*};

pub struct SharpenFilter<A: SimdArchitecture> {
    pub intensity: f32,
    pub _phantom: std::marker::PhantomData<A>,
}

impl<A: SimdArchitecture> SharpenFilter<A> {
    pub fn new(intensity: f32) -> Self {
        Self {
            intensity,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<A: SimdArchitecture> SimdFilter<A> for SharpenFilter<A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &image::RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        let kernel = [-0.5, -0.5, -0.5, -0.5, 5.0, -0.5, -0.5, -0.5, -0.5];
        let mut r_sums = A::set1_ps(0.0);
        let mut g_sums = A::set1_ps(0.0);
        let mut b_sums = A::set1_ps(0.0);
        let mut total_weight = A::set1_ps(0.0);

        let (orig_r_255, orig_g_255, orig_b_255, _orig_a_255) =
            A::load_rgba_with_alpha(input, x_base, y, 0, 0);
        let scale_to_01 = A::set1_ps(1.0 / 255.0);
        let orig_r = A::mul_ps(&orig_r_255, &scale_to_01);
        let orig_g = A::mul_ps(&orig_g_255, &scale_to_01);
        let orig_b = A::mul_ps(&orig_b_255, &scale_to_01);

        for ky in -1..=1 {
            for kx in -1..=1 {
                let kernel_value = kernel[((ky + 1) * 3 + (kx + 1)) as usize];
                let kernel_vec = A::set1_ps(kernel_value);
                let (r_float_255, g_float_255, b_float_255, _a_float) =
                    A::load_rgba_with_alpha(input, x_base, y, kx, ky);

                let r_float = A::mul_ps(&r_float_255, &scale_to_01);
                let g_float = A::mul_ps(&g_float_255, &scale_to_01);
                let b_float = A::mul_ps(&b_float_255, &scale_to_01);

                r_sums = A::fmadd_ps(&r_float, &kernel_vec, &r_sums);
                g_sums = A::fmadd_ps(&g_float, &kernel_vec, &g_sums);
                b_sums = A::fmadd_ps(&b_float, &kernel_vec, &b_sums);
                total_weight = A::add_ps(&total_weight, &kernel_vec);
            }
        }

        let r_normalized = A::div_ps(&r_sums, &total_weight);
        let g_normalized = A::div_ps(&g_sums, &total_weight);
        let b_normalized = A::div_ps(&b_sums, &total_weight);

        let intensity_vec = A::set1_ps(self.intensity);
        let one_minus_intensity = A::set1_ps(1.0 - self.intensity);
        let r_result_01 = A::fmadd_ps(
            &orig_r,
            &one_minus_intensity,
            &A::mul_ps(&r_normalized, &intensity_vec),
        );
        let g_result_01 = A::fmadd_ps(
            &orig_g,
            &one_minus_intensity,
            &A::mul_ps(&g_normalized, &intensity_vec),
        );
        let b_result_01 = A::fmadd_ps(
            &orig_b,
            &one_minus_intensity,
            &A::mul_ps(&b_normalized, &intensity_vec),
        );

        let clamp_min = A::set1_ps(0.0);
        let clamp_max = A::set1_ps(1.0);
        let r_clamped_01 = A::max_ps(&A::min_ps(&r_result_01, &clamp_max), &clamp_min);
        let g_clamped_01 = A::max_ps(&A::min_ps(&g_result_01, &clamp_max), &clamp_min);
        let b_clamped_01 = A::max_ps(&A::min_ps(&b_result_01, &clamp_max), &clamp_min);

        let scale_to_255 = A::set1_ps(255.0);
        let rounding_offset = A::set1_ps(0.5);
        let r_scaled = A::fmadd_ps(&r_clamped_01, &scale_to_255, &rounding_offset);
        let g_scaled = A::fmadd_ps(&g_clamped_01, &scale_to_255, &rounding_offset);
        let b_scaled = A::fmadd_ps(&b_clamped_01, &scale_to_255, &rounding_offset);
        let a_scaled = A::set1_ps(255.5); // Force alpha = 1.0 like GPU (Solution 1)

        let mut float_buffer = [0.0f32; 32];
        A::store_ps(float_buffer.as_mut_ptr(), &r_scaled);
        A::store_ps(float_buffer.as_mut_ptr().add(8), &g_scaled);
        A::store_ps(float_buffer.as_mut_ptr().add(16), &b_scaled);
        A::store_ps(float_buffer.as_mut_ptr().add(24), &a_scaled);

        for i in 0..A::chunk_size() {
            let x = x_base + i;
            if x >= width_usize {
                continue;
            }

            let pixel_idx = (local_y * width_usize + x) * 4;
            if pixel_idx + 3 < local_output.len() {
                local_output[pixel_idx] = float_buffer[i] as u8;
                local_output[pixel_idx + 1] = float_buffer[i + 8] as u8;
                local_output[pixel_idx + 2] = float_buffer[i + 16] as u8;
                local_output[pixel_idx + 3] = float_buffer[i + 24] as u8;
            }
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
        let kernel = [-0.5, -0.5, -0.5, -0.5, 5.0, -0.5, -0.5, -0.5, -0.5];
        let mut r_sum = 0.0;
        let mut g_sum = 0.0;
        let mut b_sum = 0.0;
        let mut total_weight = 0.0;

        let orig_pixel = input.get_pixel(x as u32, y as u32);
        let orig_r = orig_pixel[0] as f32 / 255.0;
        let orig_g = orig_pixel[1] as f32 / 255.0;
        let orig_b = orig_pixel[2] as f32 / 255.0;

        for ky in -1..=1 {
            for kx in -1..=1 {
                let nx = (x as i32 + kx).clamp(0, input.width() as i32 - 1) as u32;
                let ny = (y as i32 + ky).clamp(0, input.height() as i32 - 1) as u32;
                let pixel = input.get_pixel(nx, ny);
                let kernel_value = kernel[((ky + 1) * 3 + (kx + 1)) as usize];

                r_sum += (pixel[0] as f32 / 255.0) * kernel_value;
                g_sum += (pixel[1] as f32 / 255.0) * kernel_value;
                b_sum += (pixel[2] as f32 / 255.0) * kernel_value;
                total_weight += kernel_value;
            }
        }

        let r_normalized = r_sum / total_weight;
        let g_normalized = g_sum / total_weight;
        let b_normalized = b_sum / total_weight;

        let r_result_01 = orig_r * (1.0 - self.intensity) + r_normalized * self.intensity;
        let g_result_01 = orig_g * (1.0 - self.intensity) + g_normalized * self.intensity;
        let b_result_01 = orig_b * (1.0 - self.intensity) + b_normalized * self.intensity;

        let r_result = (r_result_01.clamp(0.0, 1.0) * 255.0 + 0.5) as u8;
        let g_result = (g_result_01.clamp(0.0, 1.0) * 255.0 + 0.5) as u8;
        let b_result = (b_result_01.clamp(0.0, 1.0) * 255.0 + 0.5) as u8;
        let a_result = 255u8;

        let local_idx = (local_y * width_usize + x) * 4;
        local_output[local_idx] = r_result;
        local_output[local_idx + 1] = g_result;
        local_output[local_idx + 2] = b_result;
        local_output[local_idx + 3] = a_result;
    }
}

pub fn sharpen<A: SimdArchitecture + Sync>(
    input: &image::RgbaImage,
    intensity: f32,
) -> image::RgbaImage {
    let filter = SharpenFilter::<A>::new(intensity);
    SimdProcessor::process_filter::<A, _>(&filter, input)
}
