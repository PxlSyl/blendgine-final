use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct DestinationInBlend;

impl DestinationInBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for DestinationInBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 || destination.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if destination.a >= 0.9999 {
            let dst_r = destination.r / destination.a;
            let dst_g = destination.g / destination.a;
            let dst_b = destination.b / destination.a;

            let result_a = source.a;

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(dst_r, dst_g, dst_b, result_a),
            };
        }

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

        let result_a = destination.a * source.a;

        if result_a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        BlendResult {
            pixel: PixelData::from_unpremultiplied_normalized(dst_r, dst_g, dst_b, result_a),
        }
    }
}
