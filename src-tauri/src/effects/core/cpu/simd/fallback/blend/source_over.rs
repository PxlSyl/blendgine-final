use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct SourceOverBlend;

impl SourceOverBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for SourceOverBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
            };
        }

        if source.a >= 0.9999 {
            return BlendResult { pixel: *source };
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

        let inv_source_a = 1.0 - source.a;

        let src_contrib_r = src_r * source.a;
        let src_contrib_g = src_g * source.a;
        let src_contrib_b = src_b * source.a;

        let dst_contrib_r = dst_r * destination.a * inv_source_a;
        let dst_contrib_g = dst_g * destination.a * inv_source_a;
        let dst_contrib_b = dst_b * destination.a * inv_source_a;

        let result_r = src_contrib_r + dst_contrib_r;
        let result_g = src_contrib_g + dst_contrib_g;
        let result_b = src_contrib_b + dst_contrib_b;

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
            pixel: PixelData::from_unpremultiplied_normalized(final_r, final_g, final_b, result_a),
        }
    }
}
