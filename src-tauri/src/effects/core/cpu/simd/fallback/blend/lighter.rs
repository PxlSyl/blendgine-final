use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct LighterBlend;

impl LighterBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for LighterBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
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

        let src_r_premult = src_r * source.a;
        let src_g_premult = src_g * source.a;
        let src_b_premult = src_b * source.a;

        let dst_r_premult = dst_r * destination.a;
        let dst_g_premult = dst_g * destination.a;
        let dst_b_premult = dst_b * destination.a;

        let sum_r = (src_r_premult + dst_r_premult).min(1.0);
        let sum_g = (src_g_premult + dst_g_premult).min(1.0);
        let sum_b = (src_b_premult + dst_b_premult).min(1.0);

        let result_a = source.a + destination.a - source.a * destination.a;

        let (final_r, final_g, final_b) = if result_a > 0.0001 {
            (sum_r / result_a, sum_g / result_a, sum_b / result_a)
        } else {
            (0.0, 0.0, 0.0)
        };

        BlendResult {
            pixel: PixelData::from_normalized(final_r, final_g, final_b, result_a),
        }
    }
}
