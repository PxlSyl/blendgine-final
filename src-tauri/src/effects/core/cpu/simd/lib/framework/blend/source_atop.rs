use crate::effects::core::cpu::simd::{
    fallback::blend::{
        base::{self as fallback_base, BlendProcessor as FallbackBlendProcessor},
        source_atop::SourceAtopBlend as FallbackSourceAtopBlend,
    },
    lib::framework::blend::base::{
        process_images_with_blend, BlendProcessor, BlendResult, PixelData,
    },
    traits::SimdArchitecture,
};
use image::RgbaImage;

pub struct SourceAtopBlend {
    fallback: FallbackSourceAtopBlend,
}

impl SourceAtopBlend {
    pub fn new() -> Self {
        Self {
            fallback: FallbackSourceAtopBlend::new(),
        }
    }
}

impl<A: SimdArchitecture + Sync> BlendProcessor<A> for SourceAtopBlend {
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
        let epsilon = A::set1_ps(1e-6);

        let sa_for_div = A::max_ps(&sa, &epsilon);
        let da_for_div = A::max_ps(&da, &epsilon);

        let sr_unpremult = A::div_ps(&sr, &sa_for_div);
        let sg_unpremult = A::div_ps(&sg, &sa_for_div);
        let sb_unpremult = A::div_ps(&sb, &sa_for_div);

        let dr_unpremult = A::div_ps(&dr, &da_for_div);
        let dg_unpremult = A::div_ps(&dg, &da_for_div);
        let db_unpremult = A::div_ps(&db, &da_for_div);

        let inv_sa = A::sub_ps(&one, &sa);

        let blend_r = A::add_ps(
            &A::mul_ps(&sr_unpremult, &sa),
            &A::mul_ps(&dr_unpremult, &inv_sa),
        );
        let blend_g = A::add_ps(
            &A::mul_ps(&sg_unpremult, &sa),
            &A::mul_ps(&dg_unpremult, &inv_sa),
        );
        let blend_b = A::add_ps(
            &A::mul_ps(&sb_unpremult, &sa),
            &A::mul_ps(&db_unpremult, &inv_sa),
        );

        let result_r = A::mul_ps(&blend_r, &da);
        let result_g = A::mul_ps(&blend_g, &da);
        let result_b = A::mul_ps(&blend_b, &da);

        for i in 0..A::chunk_size() {
            let x = x_base + i;

            if x >= destination.width() as usize || i >= valid_pixels {
                continue;
            }

            let src_a = A::extract_f32(&sa, i);
            let dst_a = A::extract_f32(&da, i);

            if dst_a <= 0.0001 {
                let output_idx = (local_y * width_usize + x) * 4;
                if output_idx + 3 < output.len() {
                    output[output_idx] = 0;
                    output[output_idx + 1] = 0;
                    output[output_idx + 2] = 0;
                    output[output_idx + 3] = 0;
                }
                continue;
            }

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

            let r_val = A::extract_f32(&result_r, i);
            let g_val = A::extract_f32(&result_g, i);
            let b_val = A::extract_f32(&result_b, i);
            let a_val = A::extract_f32(&da, i);

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
