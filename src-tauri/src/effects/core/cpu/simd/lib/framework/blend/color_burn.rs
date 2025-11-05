use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        color_burn::ColorBurnBlend as FallbackColorBurnBlend,
    },
    lib::framework::blend::base::{
        process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct ColorBurnBlend {
    fallback: FallbackColorBurnBlend,
}

impl ColorBurnBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackColorBurnBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for ColorBurnBlend {
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

        let inv_dr = A::sub_ps(&one, &dr_unpremult);
        let inv_dg = A::sub_ps(&one, &dg_unpremult);
        let inv_db = A::sub_ps(&one, &db_unpremult);

        let safe_sr = A::max_ps(&sr_unpremult, &epsilon);
        let safe_sg = A::max_ps(&sg_unpremult, &epsilon);
        let safe_sb = A::max_ps(&sb_unpremult, &epsilon);

        let ratio_r = A::div_ps(&inv_dr, &safe_sr);
        let ratio_g = A::div_ps(&inv_dg, &safe_sg);
        let ratio_b = A::div_ps(&inv_db, &safe_sb);

        let raw_burn_r = A::sub_ps(&one, &ratio_r);
        let raw_burn_g = A::sub_ps(&one, &ratio_g);
        let raw_burn_b = A::sub_ps(&one, &ratio_b);

        let burn_r = A::max_ps(&raw_burn_r, &zero);
        let burn_g = A::max_ps(&raw_burn_g, &zero);
        let burn_b = A::max_ps(&raw_burn_b, &zero);

        let sr_is_zero = A::cmp_le_ps(&sr_unpremult, &epsilon);
        let sg_is_zero = A::cmp_le_ps(&sg_unpremult, &epsilon);
        let sb_is_zero = A::cmp_le_ps(&sb_unpremult, &epsilon);

        let sr_is_one = A::cmp_ge_ps(&sr_unpremult, &A::sub_ps(&one, &epsilon));
        let sg_is_one = A::cmp_ge_ps(&sg_unpremult, &A::sub_ps(&one, &epsilon));
        let sb_is_one = A::cmp_ge_ps(&sb_unpremult, &A::sub_ps(&one, &epsilon));

        let dr_is_one = A::cmp_ge_ps(&dr_unpremult, &A::sub_ps(&one, &epsilon));
        let dg_is_one = A::cmp_ge_ps(&dg_unpremult, &A::sub_ps(&one, &epsilon));
        let db_is_one = A::cmp_ge_ps(&db_unpremult, &A::sub_ps(&one, &epsilon));

        let burn_r_with_dest_one = A::or_ps(
            &A::and_ps(&dr_is_one, &one),
            &A::andnot_ps(&dr_is_one, &burn_r),
        );
        let burn_g_with_dest_one = A::or_ps(
            &A::and_ps(&dg_is_one, &one),
            &A::andnot_ps(&dg_is_one, &burn_g),
        );
        let burn_b_with_dest_one = A::or_ps(
            &A::and_ps(&db_is_one, &one),
            &A::andnot_ps(&db_is_one, &burn_b),
        );

        let burn_r_with_zeros = A::or_ps(
            &A::and_ps(&sr_is_zero, &zero),
            &A::andnot_ps(&sr_is_zero, &burn_r_with_dest_one),
        );
        let burn_g_with_zeros = A::or_ps(
            &A::and_ps(&sg_is_zero, &zero),
            &A::andnot_ps(&sg_is_zero, &burn_g_with_dest_one),
        );
        let burn_b_with_zeros = A::or_ps(
            &A::and_ps(&sb_is_zero, &zero),
            &A::andnot_ps(&sb_is_zero, &burn_b_with_dest_one),
        );

        let final_burn_r = A::or_ps(
            &A::and_ps(&sr_is_one, &dr_unpremult),
            &A::andnot_ps(&sr_is_one, &burn_r_with_zeros),
        );
        let final_burn_g = A::or_ps(
            &A::and_ps(&sg_is_one, &dg_unpremult),
            &A::andnot_ps(&sg_is_one, &burn_g_with_zeros),
        );
        let final_burn_b = A::or_ps(
            &A::and_ps(&sb_is_one, &db_unpremult),
            &A::andnot_ps(&sb_is_one, &burn_b_with_zeros),
        );

        let burn_r_premult = A::mul_ps(&final_burn_r, &sa);
        let burn_g_premult = A::mul_ps(&final_burn_g, &sa);
        let burn_b_premult = A::mul_ps(&final_burn_b, &sa);

        let inv_sa = A::sub_ps(&one, &sa);
        let dr_scaled = A::mul_ps(&dr, &inv_sa);
        let dg_scaled = A::mul_ps(&dg, &inv_sa);
        let db_scaled = A::mul_ps(&db, &inv_sa);

        let result_r_premult = A::add_ps(&burn_r_premult, &dr_scaled);
        let result_g_premult = A::add_ps(&burn_g_premult, &dg_scaled);
        let result_b_premult = A::add_ps(&burn_b_premult, &db_scaled);

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
                let r_val = A::extract_f32(&final_burn_r, i);
                let g_val = A::extract_f32(&final_burn_g, i);
                let b_val = A::extract_f32(&final_burn_b, i);

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
