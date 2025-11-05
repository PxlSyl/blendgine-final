use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct XorBlend;

impl XorBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for XorBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
            };
        }

        if destination.a <= 0.0001 {
            return BlendResult { pixel: *source };
        }

        let inv_source_a = 1.0 - source.a;
        let inv_dest_a = 1.0 - destination.a;

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

        let source_contrib_r = src_r * source.a * inv_dest_a;
        let source_contrib_g = src_g * source.a * inv_dest_a;
        let source_contrib_b = src_b * source.a * inv_dest_a;

        let dest_contrib_r = dst_r * destination.a * inv_source_a;
        let dest_contrib_g = dst_g * destination.a * inv_source_a;
        let dest_contrib_b = dst_b * destination.a * inv_source_a;

        let result_r = source_contrib_r + dest_contrib_r;
        let result_g = source_contrib_g + dest_contrib_g;
        let result_b = source_contrib_b + dest_contrib_b;

        let result_a = source.a + destination.a - 2.0 * source.a * destination.a;

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
