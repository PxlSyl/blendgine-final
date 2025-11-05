use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        multiply::MultiplyBlend as FallbackMultiplyBlend,
    },
    lib::framework::blend::base::{
        process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct MultiplyBlend {
    fallback: FallbackMultiplyBlend,
}

impl MultiplyBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackMultiplyBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for MultiplyBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        let fallback_result = self.fallback.blend_pixels(
            &fallback_base::PixelData::from_normalized(source.r, source.g, source.b, source.a),
            &fallback_base::PixelData::from_normalized(
                destination.r,
                destination.g,
                destination.b,
                destination.a,
            ),
        );

        BlendResult {
            pixel: PixelData::from_normalized(
                fallback_result.pixel.r,
                fallback_result.pixel.g,
                fallback_result.pixel.b,
                fallback_result.pixel.a,
            ),
        }
    }

    unsafe fn process_simd_chunk(
        &self,
        destination: &RgbaImage,
        output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
        source: &RgbaImage,
    ) {
        if y >= destination.height() as usize {
            return;
        }

        if x_base >= destination.width() as usize {
            return;
        }

        let dest_width = destination.width() as usize;
        let valid_pixels = A::chunk_size().min(dest_width.saturating_sub(x_base));

        if valid_pixels == 0 {
            return;
        }

        let (sr_raw, sg_raw, sb_raw, sa_raw) = A::load_rgba_with_alpha(source, x_base, y, 0, 0);
        let (dr_raw, dg_raw, db_raw, da_raw) =
            A::load_rgba_with_alpha(destination, x_base, y, 0, 0);

        let norm_factor = A::set1_ps(1.0 / 255.0);
        let sr = A::mul_ps(&sr_raw, &norm_factor);
        let sg = A::mul_ps(&sg_raw, &norm_factor);
        let sb = A::mul_ps(&sb_raw, &norm_factor);
        let sa = A::mul_ps(&sa_raw, &norm_factor);
        let dr = A::mul_ps(&dr_raw, &norm_factor);
        let dg = A::mul_ps(&dg_raw, &norm_factor);
        let db = A::mul_ps(&db_raw, &norm_factor);
        let da = A::mul_ps(&da_raw, &norm_factor);

        let one = A::set1_ps(1.0);
        let inv_sa = A::sub_ps(&one, &sa);

        let multiply_r = A::mul_ps(&sr, &dr);
        let multiply_g = A::mul_ps(&sg, &dg);
        let multiply_b = A::mul_ps(&sb, &db);

        let multiply_r_scaled = A::mul_ps(&multiply_r, &sa);
        let multiply_g_scaled = A::mul_ps(&multiply_g, &sa);
        let multiply_b_scaled = A::mul_ps(&multiply_b, &sa);

        let dr_scaled = A::mul_ps(&dr, &A::mul_ps(&da, &inv_sa));
        let dg_scaled = A::mul_ps(&dg, &A::mul_ps(&da, &inv_sa));
        let db_scaled = A::mul_ps(&db, &A::mul_ps(&da, &inv_sa));

        let result_r_premult = A::add_ps(&multiply_r_scaled, &dr_scaled);
        let result_g_premult = A::add_ps(&multiply_g_scaled, &dg_scaled);
        let result_b_premult = A::add_ps(&multiply_b_scaled, &db_scaled);

        let result_a = A::add_ps(&sa, &A::mul_ps(&da, &inv_sa));

        let epsilon = A::set1_ps(1e-6);
        let result_a_for_div = A::max_ps(&result_a, &epsilon);

        let result_r = A::div_ps(&result_r_premult, &result_a_for_div);
        let result_g = A::div_ps(&result_g_premult, &result_a_for_div);
        let result_b = A::div_ps(&result_b_premult, &result_a_for_div);

        for i in 0..A::chunk_size() {
            let x = x_base + i;

            if x >= destination.width() as usize {
                continue;
            }

            let r_val: f32;
            let g_val: f32;
            let b_val: f32;
            let a_val: f32;

            r_val = A::extract_f32(&result_r, i);
            g_val = A::extract_f32(&result_g, i);
            b_val = A::extract_f32(&result_b, i);
            a_val = A::extract_f32(&result_a, i);

            let r_byte = (r_val.clamp(0.0, 1.0) * 255.0) as u8;
            let g_byte = (g_val.clamp(0.0, 1.0) * 255.0) as u8;
            let b_byte = (b_val.clamp(0.0, 1.0) * 255.0) as u8;
            let a_byte = (a_val.clamp(0.0, 1.0) * 255.0) as u8;

            let output_idx = (local_y * width_usize + x) * 4;
            if output_idx + 3 < output.len() {
                output[output_idx] = r_byte;
                output[output_idx + 1] = g_byte;
                output[output_idx + 2] = b_byte;
                output[output_idx + 3] = a_byte;
            }
        }
    }

    fn process_images(&self, source: &RgbaImage, destination: &RgbaImage) -> RgbaImage {
        process_images_with_blend::<A, Self>(self, source, destination)
    }
}
