use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct ExclusionBlend;

impl ExclusionBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for ExclusionBlend {
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

            let exclusion_r = src_r + dst_r - 2.0 * src_r * dst_r;
            let exclusion_g = src_g + dst_g - 2.0 * src_g * dst_g;
            let exclusion_b = src_b + dst_b - 2.0 * src_b * dst_b;

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(
                    exclusion_r,
                    exclusion_g,
                    exclusion_b,
                    source.a,
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

        let exclusion_r = src_r + dst_r - 2.0 * src_r * dst_r;
        let exclusion_g = src_g + dst_g - 2.0 * src_g * dst_g;
        let exclusion_b = src_b + dst_b - 2.0 * src_b * dst_b;

        let exclusion_r_premult = exclusion_r * source.a;
        let exclusion_g_premult = exclusion_g * source.a;
        let exclusion_b_premult = exclusion_b * source.a;

        let inv_source_a = 1.0 - source.a;

        let result_r = exclusion_r_premult + destination.r * inv_source_a;
        let result_g = exclusion_g_premult + destination.g * inv_source_a;
        let result_b = exclusion_b_premult + destination.b * inv_source_a;

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
