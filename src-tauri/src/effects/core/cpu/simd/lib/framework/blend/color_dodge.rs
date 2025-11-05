use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        color_dodge::ColorDodgeBlend as FallbackColorDodgeBlend,
    },
    lib::framework::blend::base::{
        process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct ColorDodgeBlend {
    fallback: FallbackColorDodgeBlend,
}

impl ColorDodgeBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackColorDodgeBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for ColorDodgeBlend {
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

        let epsilon = A::set1_ps(1e-6);
        let sa_for_div = A::max_ps(&sa, &epsilon);
        let da_for_div = A::max_ps(&da, &epsilon);

        let sr_unpremult = A::div_ps(&sr, &sa_for_div);
        let sg_unpremult = A::div_ps(&sg, &sa_for_div);
        let sb_unpremult = A::div_ps(&sb, &sa_for_div);

        let dr_unpremult = A::div_ps(&dr, &da_for_div);
        let dg_unpremult = A::div_ps(&dg, &da_for_div);
        let db_unpremult = A::div_ps(&db, &da_for_div);

        let one = A::set1_ps(1.0);
        let zero = A::set1_ps(0.0);

        let inv_sr = A::sub_ps(&one, &sr_unpremult);
        let inv_sg = A::sub_ps(&one, &sg_unpremult);
        let inv_sb = A::sub_ps(&one, &sb_unpremult);

        let safe_inv_sr = A::max_ps(&inv_sr, &epsilon);
        let safe_inv_sg = A::max_ps(&inv_sg, &epsilon);
        let safe_inv_sb = A::max_ps(&inv_sb, &epsilon);

        let raw_dodge_r = A::div_ps(&dr_unpremult, &safe_inv_sr);
        let raw_dodge_g = A::div_ps(&dg_unpremult, &safe_inv_sg);
        let raw_dodge_b = A::div_ps(&db_unpremult, &safe_inv_sb);

        let dodge_r = A::min_ps(&raw_dodge_r, &one);
        let dodge_g = A::min_ps(&raw_dodge_g, &one);
        let dodge_b = A::min_ps(&raw_dodge_b, &one);

        let sr_is_zero = A::cmp_le_ps(&sr_unpremult, &epsilon);
        let sg_is_zero = A::cmp_le_ps(&sg_unpremult, &epsilon);
        let sb_is_zero = A::cmp_le_ps(&sb_unpremult, &epsilon);

        let sr_is_one = A::cmp_ge_ps(&sr_unpremult, &A::sub_ps(&one, &epsilon));
        let sg_is_one = A::cmp_ge_ps(&sg_unpremult, &A::sub_ps(&one, &epsilon));
        let sb_is_one = A::cmp_ge_ps(&sb_unpremult, &A::sub_ps(&one, &epsilon));

        let dr_is_zero = A::cmp_le_ps(&dr_unpremult, &epsilon);
        let dg_is_zero = A::cmp_le_ps(&dg_unpremult, &epsilon);
        let db_is_zero = A::cmp_le_ps(&db_unpremult, &epsilon);

        let dodge_r_with_zero_dest = A::or_ps(
            &A::and_ps(&dr_is_zero, &zero),
            &A::andnot_ps(&dr_is_zero, &dodge_r),
        );
        let dodge_g_with_zero_dest = A::or_ps(
            &A::and_ps(&dg_is_zero, &zero),
            &A::andnot_ps(&dg_is_zero, &dodge_g),
        );
        let dodge_b_with_zero_dest = A::or_ps(
            &A::and_ps(&db_is_zero, &zero),
            &A::andnot_ps(&db_is_zero, &dodge_b),
        );

        let dodge_r_with_zeros = A::or_ps(
            &A::and_ps(&sr_is_zero, &dr_unpremult),
            &A::andnot_ps(&sr_is_zero, &dodge_r_with_zero_dest),
        );
        let dodge_g_with_zeros = A::or_ps(
            &A::and_ps(&sg_is_zero, &dg_unpremult),
            &A::andnot_ps(&sg_is_zero, &dodge_g_with_zero_dest),
        );
        let dodge_b_with_zeros = A::or_ps(
            &A::and_ps(&sb_is_zero, &db_unpremult),
            &A::andnot_ps(&sb_is_zero, &dodge_b_with_zero_dest),
        );

        let final_dodge_r = A::or_ps(
            &A::and_ps(&sr_is_one, &one),
            &A::andnot_ps(&sr_is_one, &dodge_r_with_zeros),
        );
        let final_dodge_g = A::or_ps(
            &A::and_ps(&sg_is_one, &one),
            &A::andnot_ps(&sg_is_one, &dodge_g_with_zeros),
        );
        let final_dodge_b = A::or_ps(
            &A::and_ps(&sb_is_one, &one),
            &A::andnot_ps(&sb_is_one, &dodge_b_with_zeros),
        );

        let dodge_r_premult = A::mul_ps(&final_dodge_r, &sa);
        let dodge_g_premult: <A as SimdArchitecture>::FloatVector = A::mul_ps(&final_dodge_g, &sa);
        let dodge_b_premult = A::mul_ps(&final_dodge_b, &sa);

        let inv_sa = A::sub_ps(&one, &sa);
        let dr_scaled = A::mul_ps(&dr, &inv_sa);
        let dg_scaled = A::mul_ps(&dg, &inv_sa);
        let db_scaled = A::mul_ps(&db, &inv_sa);

        let result_r_premult = A::add_ps(&dodge_r_premult, &dr_scaled);
        let result_g_premult = A::add_ps(&dodge_g_premult, &dg_scaled);
        let result_b_premult = A::add_ps(&dodge_b_premult, &db_scaled);

        let result_a = A::add_ps(&sa, &A::mul_ps(&da, &inv_sa));

        let result_a_for_div = A::max_ps(&result_a, &epsilon);

        let result_r = A::div_ps(&result_r_premult, &result_a_for_div);
        let result_g = A::div_ps(&result_g_premult, &result_a_for_div);
        let result_b = A::div_ps(&result_b_premult, &result_a_for_div);

        for i in 0..A::chunk_size() {
            let x = x_base + i;

            if x >= destination.width() as usize || i >= valid_pixels {
                continue;
            }

            let src_a = A::extract_f32(&sa, i);
            let dst_a = A::extract_f32(&da, i);

            if src_a <= 0.0001 {
                let dst_pixel = destination.get_pixel(x as u32, y as u32);
                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    output[output_idx] = dst_pixel[0];
                    output[output_idx + 1] = dst_pixel[1];
                    output[output_idx + 2] = dst_pixel[2];
                    output[output_idx + 3] = dst_pixel[3];
                }
                continue;
            }

            if src_a >= 0.9999 {
                let r_val = A::extract_f32(&final_dodge_r, i);
                let g_val = A::extract_f32(&final_dodge_g, i);
                let b_val = A::extract_f32(&final_dodge_b, i);

                let r_byte = (r_val.clamp(0.0, 1.0) * 255.0) as u8;
                let g_byte = (g_val.clamp(0.0, 1.0) * 255.0) as u8;
                let b_byte = (b_val.clamp(0.0, 1.0) * 255.0) as u8;
                let a_byte = (src_a.clamp(0.0, 1.0) * 255.0) as u8;

                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    output[output_idx] = r_byte;
                    output[output_idx + 1] = g_byte;
                    output[output_idx + 2] = b_byte;
                    output[output_idx + 3] = a_byte;
                }
                continue;
            }

            if dst_a <= 0.0001 {
                let src_pixel = source.get_pixel(x as u32, y as u32);
                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    output[output_idx] = src_pixel[0];
                    output[output_idx + 1] = src_pixel[1];
                    output[output_idx + 2] = src_pixel[2];
                    output[output_idx + 3] = src_pixel[3];
                }
                continue;
            }

            let r_val = A::extract_f32(&result_r, i);
            let g_val = A::extract_f32(&result_g, i);
            let b_val = A::extract_f32(&result_b, i);
            let a_val = A::extract_f32(&result_a, i);

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
