use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct SourceAtopBlend;

impl SourceAtopBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for SourceAtopBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if destination.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
            };
        }

        if source.a >= 0.9999 {
            let src_r = source.r / source.a;
            let src_g = source.g / source.a;
            let src_b = source.b / source.a;

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(
                    src_r,
                    src_g,
                    src_b,
                    destination.a,
                ),
            };
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

        let blend_r = src_r * source.a + dst_r * inv_source_a;
        let blend_g = src_g * source.a + dst_g * inv_source_a;
        let blend_b = src_b * source.a + dst_b * inv_source_a;

        let result_a = destination.a;

        if result_a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        BlendResult {
            pixel: PixelData::from_unpremultiplied_normalized(blend_r, blend_g, blend_b, result_a),
        }
    }
}
