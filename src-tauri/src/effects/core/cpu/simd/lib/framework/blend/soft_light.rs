use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        soft_light::SoftLightBlend as FallbackSoftLightBlend,
    },
    lib::framework::blend::base::{
        process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct SoftLightBlend {
    fallback: FallbackSoftLightBlend,
}

impl SoftLightBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackSoftLightBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for SoftLightBlend {
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
        let two = A::set1_ps(2.0);
        let half = A::set1_ps(0.5);
        let quarter = A::set1_ps(0.25);
        let four = A::set1_ps(4.0);
        let twelve = A::set1_ps(12.0);
        let sixteen = A::set1_ps(16.0);

        let two_times_sr = A::mul_ps(&two, &sr_unpremult);
        let two_times_sg = A::mul_ps(&two, &sg_unpremult);
        let two_times_sb = A::mul_ps(&two, &sb_unpremult);

        let one_minus_two_times_sr = A::sub_ps(&one, &two_times_sr);
        let one_minus_two_times_sg = A::sub_ps(&one, &two_times_sg);
        let one_minus_two_times_sb = A::sub_ps(&one, &two_times_sb);

        let one_minus_dr = A::sub_ps(&one, &dr_unpremult);
        let one_minus_dg = A::sub_ps(&one, &dg_unpremult);
        let one_minus_db = A::sub_ps(&one, &db_unpremult);

        let mult_r1 = A::mul_ps(&one_minus_two_times_sr, &dr_unpremult);
        let mult_g1 = A::mul_ps(&one_minus_two_times_sg, &dg_unpremult);
        let mult_b1 = A::mul_ps(&one_minus_two_times_sb, &db_unpremult);

        let mult_r2 = A::mul_ps(&mult_r1, &one_minus_dr);
        let mult_g2 = A::mul_ps(&mult_g1, &one_minus_dg);
        let mult_b2 = A::mul_ps(&mult_b1, &one_minus_db);

        let result_case1_r = A::sub_ps(&dr_unpremult, &mult_r2);
        let result_case1_g = A::sub_ps(&dg_unpremult, &mult_g2);
        let result_case1_b = A::sub_ps(&db_unpremult, &mult_b2);

        let dr_quarter_mask = A::cmp_le_ps(&dr_unpremult, &quarter);
        let dg_quarter_mask = A::cmp_le_ps(&dg_unpremult, &quarter);
        let db_quarter_mask = A::cmp_le_ps(&db_unpremult, &quarter);

        let mul16_dr = A::mul_ps(&sixteen, &dr_unpremult);
        let mul16_dg = A::mul_ps(&sixteen, &dg_unpremult);
        let mul16_db = A::mul_ps(&sixteen, &db_unpremult);

        let sub12_dr = A::sub_ps(&mul16_dr, &twelve);
        let sub12_dg = A::sub_ps(&mul16_dg, &twelve);
        let sub12_db = A::sub_ps(&mul16_db, &twelve);

        let mul_dr1 = A::mul_ps(&sub12_dr, &dr_unpremult);
        let mul_dg1 = A::mul_ps(&sub12_dg, &dg_unpremult);
        let mul_db1 = A::mul_ps(&sub12_db, &db_unpremult);

        let add4_dr = A::add_ps(&mul_dr1, &four);
        let add4_dg = A::add_ps(&mul_dg1, &four);
        let add4_db = A::add_ps(&mul_db1, &four);

        let poly_dr = A::mul_ps(&add4_dr, &dr_unpremult);
        let poly_dg = A::mul_ps(&add4_dg, &dg_unpremult);
        let poly_db = A::mul_ps(&add4_db, &db_unpremult);

        let sqrt_dr = A::sqrt_ps(&dr_unpremult);
        let sqrt_dg = A::sqrt_ps(&dg_unpremult);
        let sqrt_db = A::sqrt_ps(&db_unpremult);

        let d_r = A::or_ps(
            &A::and_ps(&dr_quarter_mask, &poly_dr),
            &A::andnot_ps(&dr_quarter_mask, &sqrt_dr),
        );
        let d_g = A::or_ps(
            &A::and_ps(&dg_quarter_mask, &poly_dg),
            &A::andnot_ps(&dg_quarter_mask, &sqrt_dg),
        );
        let d_b = A::or_ps(
            &A::and_ps(&db_quarter_mask, &poly_db),
            &A::andnot_ps(&db_quarter_mask, &sqrt_db),
        );

        let two_times_sr_minus_one = A::sub_ps(&two_times_sr, &one);
        let two_times_sg_minus_one = A::sub_ps(&two_times_sg, &one);
        let two_times_sb_minus_one = A::sub_ps(&two_times_sb, &one);

        let d_minus_dr = A::sub_ps(&d_r, &dr_unpremult);
        let d_minus_dg = A::sub_ps(&d_g, &dg_unpremult);
        let d_minus_db = A::sub_ps(&d_b, &db_unpremult);

        let mult_r3 = A::mul_ps(&two_times_sr_minus_one, &d_minus_dr);
        let mult_g3 = A::mul_ps(&two_times_sg_minus_one, &d_minus_dg);
        let mult_b3 = A::mul_ps(&two_times_sb_minus_one, &d_minus_db);

        let result_case2_r = A::add_ps(&dr_unpremult, &mult_r3);
        let result_case2_g = A::add_ps(&dg_unpremult, &mult_g3);
        let result_case2_b = A::add_ps(&db_unpremult, &mult_b3);

        let src_mask_r = A::cmp_lt_ps(&sr_unpremult, &half);
        let src_mask_g = A::cmp_lt_ps(&sg_unpremult, &half);
        let src_mask_b = A::cmp_lt_ps(&sb_unpremult, &half);

        let soft_light_r = A::or_ps(
            &A::and_ps(&src_mask_r, &result_case1_r),
            &A::andnot_ps(&src_mask_r, &result_case2_r),
        );
        let soft_light_g = A::or_ps(
            &A::and_ps(&src_mask_g, &result_case1_g),
            &A::andnot_ps(&src_mask_g, &result_case2_g),
        );
        let soft_light_b = A::or_ps(
            &A::and_ps(&src_mask_b, &result_case1_b),
            &A::andnot_ps(&src_mask_b, &result_case2_b),
        );

        let soft_light_r_premult = A::mul_ps(&soft_light_r, &sa);
        let soft_light_g_premult = A::mul_ps(&soft_light_g, &sa);
        let soft_light_b_premult = A::mul_ps(&soft_light_b, &sa);

        let inv_sa = A::sub_ps(&one, &sa);
        let dr_scaled = A::mul_ps(&dr, &inv_sa);
        let dg_scaled = A::mul_ps(&dg, &inv_sa);
        let db_scaled = A::mul_ps(&db, &inv_sa);

        let result_r_premult = A::add_ps(&soft_light_r_premult, &dr_scaled);
        let result_g_premult = A::add_ps(&soft_light_g_premult, &dg_scaled);
        let result_b_premult = A::add_ps(&soft_light_b_premult, &db_scaled);

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
                let r_val = A::extract_f32(&soft_light_r, i);
                let g_val = A::extract_f32(&soft_light_g, i);
                let b_val = A::extract_f32(&soft_light_b, i);

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
