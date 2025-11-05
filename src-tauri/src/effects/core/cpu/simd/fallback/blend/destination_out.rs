use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct DestinationOutBlend;

impl DestinationOutBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for DestinationOutBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a >= 0.9999 || destination.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if source.a <= 0.0001 {
            return BlendResult {
                pixel: *destination,
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

        let inv_source_a = 1.0 - source.a;
        let result_a = destination.a * inv_source_a;

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
