use super::base::{blend_utils, BlendProcessor, BlendResult, PixelData};

pub struct ColorBlend;

impl ColorBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for ColorBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
            };
        }

        if source.a >= 0.9999 {
            let src_r = source.r / source.a;
            let src_g = source.g / source.a;
            let src_b = source.b / source.a;

            let dst_r = if destination.a > 0.0001 {
                destination.r / destination.a
            } else {
                0.0
            };
            let dst_g = if destination.a > 0.0001 {
                destination.g / destination.a
            } else {
                0.0
            };
            let dst_b = if destination.a > 0.0001 {
                destination.b / destination.a
            } else {
                0.0
            };

            let source_unpremult = PixelData::from_normalized(src_r, src_g, src_b, source.a);
            let dest_unpremult = PixelData::from_normalized(dst_r, dst_g, dst_b, destination.a);

            let (source_h, source_s, _) = blend_utils::rgb_to_hsl(&source_unpremult);
            let (_, _, dest_l) = blend_utils::rgb_to_hsl(&dest_unpremult);

            let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(source_h, source_s, dest_l);

            return BlendResult {
                pixel: PixelData::from_normalized(blend_r, blend_g, blend_b, source.a),
            };
        }

        if destination.a <= 0.0001 {
            return BlendResult { pixel: *source };
        }

        let src_r = if source.a > 0.0001 {
            source.r / source.a
        } else {
            0.0
        };
        let src_g = if source.a > 0.0001 {
            source.g / source.a
        } else {
            0.0
        };
        let src_b = if source.a > 0.0001 {
            source.b / source.a
        } else {
            0.0
        };

        let dst_r = if destination.a > 0.0001 {
            destination.r / destination.a
        } else {
            0.0
        };
        let dst_g = if destination.a > 0.0001 {
            destination.g / destination.a
        } else {
            0.0
        };
        let dst_b = if destination.a > 0.0001 {
            destination.b / destination.a
        } else {
            0.0
        };

        let source_unpremult = PixelData::from_normalized(src_r, src_g, src_b, source.a);
        let dest_unpremult = PixelData::from_normalized(dst_r, dst_g, dst_b, destination.a);

        let (source_h, source_s, _) = blend_utils::rgb_to_hsl(&source_unpremult);
        let (_, _, dest_l) = blend_utils::rgb_to_hsl(&dest_unpremult);

        let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(source_h, source_s, dest_l);

        let blend_r_premult = blend_r * source.a;
        let blend_g_premult = blend_g * source.a;
        let blend_b_premult = blend_b * source.a;

        let inv_source_a = 1.0 - source.a;

        let result_r = blend_r_premult + destination.r * inv_source_a;
        let result_g = blend_g_premult + destination.g * inv_source_a;
        let result_b = blend_b_premult + destination.b * inv_source_a;

        let result_a = source.a + destination.a * inv_source_a;

        if result_a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        let final_r = result_r / result_a;
        let final_g = result_g / result_a;
        let final_b = result_b / result_a;

        BlendResult {
            pixel: PixelData::from_normalized(final_r, final_g, final_b, result_a),
        }
    }
}
