use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        saturation::SaturationBlend as FallbackSaturationBlend,
    },
    lib::framework::blend::base::{
        blend_utils, process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct SaturationBlend {
    fallback: FallbackSaturationBlend,
}

impl SaturationBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackSaturationBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for SaturationBlend {
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

        let epsilon = A::set1_ps(0.0001);

        let sa_for_div = A::max_ps(&sa, &epsilon);
        let da_for_div = A::max_ps(&da, &epsilon);

        let sr_unpremult = A::div_ps(&sr, &sa_for_div);
        let sg_unpremult = A::div_ps(&sg, &sa_for_div);
        let sb_unpremult = A::div_ps(&sb, &sa_for_div);

        let dr_unpremult = A::div_ps(&dr, &da_for_div);
        let dg_unpremult = A::div_ps(&dg, &da_for_div);
        let db_unpremult = A::div_ps(&db, &da_for_div);

        for i in 0..A::chunk_size() {
            let x = x_base + i;

            if x >= destination.width() as usize || i >= valid_pixels {
                continue;
            }

            let src_a = A::extract_f32(&sa, i);

            let dst_r = A::extract_f32(&dr, i);
            let dst_g = A::extract_f32(&dg, i);
            let dst_b = A::extract_f32(&db, i);
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
                let src_r_unpremult = A::extract_f32(&sr_unpremult, i);
                let src_g_unpremult = A::extract_f32(&sg_unpremult, i);
                let src_b_unpremult = A::extract_f32(&sb_unpremult, i);

                let dst_r_unpremult = A::extract_f32(&dr_unpremult, i);
                let dst_g_unpremult = A::extract_f32(&dg_unpremult, i);
                let dst_b_unpremult = A::extract_f32(&db_unpremult, i);

                let source_unpremult = PixelData::from_normalized(
                    src_r_unpremult,
                    src_g_unpremult,
                    src_b_unpremult,
                    1.0,
                );
                let dest_unpremult = PixelData::from_normalized(
                    dst_r_unpremult,
                    dst_g_unpremult,
                    dst_b_unpremult,
                    1.0,
                );

                let (_, source_s, _) = blend_utils::rgb_to_hsl(&source_unpremult);
                let (dest_h, _, dest_l) = blend_utils::rgb_to_hsl(&dest_unpremult);

                let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(dest_h, source_s, dest_l);

                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    let rgba = [
                        (blend_r.clamp(0.0, 1.0) * 255.0) as u8,
                        (blend_g.clamp(0.0, 1.0) * 255.0) as u8,
                        (blend_b.clamp(0.0, 1.0) * 255.0) as u8,
                        (src_a * 255.0) as u8,
                    ];
                    output[output_idx] = rgba[0];
                    output[output_idx + 1] = rgba[1];
                    output[output_idx + 2] = rgba[2];
                    output[output_idx + 3] = rgba[3];
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

            let src_r_unpremult = A::extract_f32(&sr_unpremult, i);
            let src_g_unpremult = A::extract_f32(&sg_unpremult, i);
            let src_b_unpremult = A::extract_f32(&sb_unpremult, i);

            let dst_r_unpremult = A::extract_f32(&dr_unpremult, i);
            let dst_g_unpremult = A::extract_f32(&dg_unpremult, i);
            let dst_b_unpremult = A::extract_f32(&db_unpremult, i);

            let source_unpremult = PixelData::from_normalized(
                src_r_unpremult,
                src_g_unpremult,
                src_b_unpremult,
                src_a,
            );
            let dest_unpremult = PixelData::from_normalized(
                dst_r_unpremult,
                dst_g_unpremult,
                dst_b_unpremult,
                dst_a,
            );

            let (_, source_s, _) = blend_utils::rgb_to_hsl(&source_unpremult);
            let (dest_h, _, dest_l) = blend_utils::rgb_to_hsl(&dest_unpremult);

            let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(dest_h, source_s, dest_l);

            let blend_r_premult = blend_r * src_a;
            let blend_g_premult = blend_g * src_a;
            let blend_b_premult = blend_b * src_a;

            let inv_source_a = 1.0 - src_a;

            let result_r = blend_r_premult + dst_r * inv_source_a;
            let result_g = blend_g_premult + dst_g * inv_source_a;
            let result_b = blend_b_premult + dst_b * inv_source_a;

            let result_a = src_a + dst_a * inv_source_a;

            if result_a <= 0.0001 {
                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    output[output_idx] = 0;
                    output[output_idx + 1] = 0;
                    output[output_idx + 2] = 0;
                    output[output_idx + 3] = 0;
                }
                continue;
            }

            let final_r = result_r / result_a;
            let final_g = result_g / result_a;
            let final_b = result_b / result_a;

            let output_idx = (local_y * width_usize + x) * 4;
            if output_idx + 3 < output.len() {
                let rgba = [
                    (final_r.clamp(0.0, 1.0) * 255.0) as u8,
                    (final_g.clamp(0.0, 1.0) * 255.0) as u8,
                    (final_b.clamp(0.0, 1.0) * 255.0) as u8,
                    (result_a * 255.0) as u8,
                ];
                output[output_idx] = rgba[0];
                output[output_idx + 1] = rgba[1];
                output[output_idx + 2] = rgba[2];
                output[output_idx + 3] = rgba[3];
            }
        }
    }

    fn process_images(&self, source: &RgbaImage, destination: &RgbaImage) -> RgbaImage {
        process_images_with_blend::<A, Self>(self, source, destination)
    }
}
