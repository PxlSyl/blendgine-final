use super::base::{blend_utils, BlendProcessor, BlendResult, PixelData};

pub struct SaturationBlend;

impl SaturationBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for SaturationBlend {
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

            let (_, source_s, _) =
                blend_utils::rgb_to_hsl(&PixelData::from_normalized(src_r, src_g, src_b, source.a));
            let (dest_h, _, dest_l) = blend_utils::rgb_to_hsl(&PixelData::from_normalized(
                dst_r,
                dst_g,
                dst_b,
                destination.a,
            ));

            let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(dest_h, source_s, dest_l);

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(
                    blend_r, blend_g, blend_b, source.a,
                ),
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

        let (_, source_s, _) =
            blend_utils::rgb_to_hsl(&PixelData::from_normalized(src_r, src_g, src_b, source.a));
        let (dest_h, _, dest_l) = blend_utils::rgb_to_hsl(&PixelData::from_normalized(
            dst_r,
            dst_g,
            dst_b,
            destination.a,
        ));

        let (blend_r, blend_g, blend_b) = blend_utils::hsl_to_rgb(dest_h, source_s, dest_l);

        let blend_r_premult = blend_r * source.a;
        let blend_g_premult = blend_g * source.a;
        let blend_b_premult = blend_b * source.a;

        let inv_source_a = 1.0 - source.a;

        let result_r = blend_r_premult + destination.r * inv_source_a;
        let result_g = blend_g_premult + destination.g * inv_source_a;
        let result_b = blend_b_premult + destination.b * inv_source_a;

        let result_a = source.a + destination.a * inv_source_a;

        let (final_r, final_g, final_b) = if result_a > 0.0001 {
            (
                result_r / result_a,
                result_g / result_a,
                result_b / result_a,
            )
        } else {
            (0.0, 0.0, 0.0)
        };

        BlendResult {
            pixel: PixelData::from_normalized(final_r, final_g, final_b, result_a),
        }
    }
}
