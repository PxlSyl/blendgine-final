use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct SourceInBlend;

impl SourceInBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for SourceInBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 || destination.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if source.a >= 0.9999 {
            let src_r = source.r / source.a;
            let src_g = source.g / source.a;
            let src_b = source.b / source.a;

            let result_a = destination.a;

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(src_r, src_g, src_b, result_a),
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

        let result_a = source.a * destination.a;

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
