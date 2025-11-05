use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct SourceOutBlend;

impl SourceOutBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for SourceOutBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 || destination.a >= 0.9999 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
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

        let inv_dest_a = 1.0 - destination.a;
        let result_a = source.a * inv_dest_a;

        if result_a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        BlendResult {
            pixel: PixelData::from_unpremultiplied_normalized(src_r, src_g, src_b, result_a),
        }
    }
}
