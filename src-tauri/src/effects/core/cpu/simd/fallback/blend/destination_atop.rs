use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct DestinationAtopBlend;

impl DestinationAtopBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for DestinationAtopBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if destination.a <= 0.0001 || source.a >= 0.9999 {
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

        let inv_dest_a = 1.0 - destination.a;

        let blend_r = dst_r * destination.a + src_r * inv_dest_a;
        let blend_g = dst_g * destination.a + src_g * inv_dest_a;
        let blend_b = dst_b * destination.a + src_b * inv_dest_a;

        let result_a = source.a;

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
