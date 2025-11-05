use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct DestinationOverBlend;

impl DestinationOverBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for DestinationOverBlend {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult {
        if destination.a >= 0.9999 {
            return BlendResult {
                pixel: *destination,
            };
        }

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

        let inv_dest_a = 1.0 - destination.a;

        let result_a = destination.a + source.a * inv_dest_a;

        let weighted_src_r = src_r * source.a * inv_dest_a;
        let weighted_src_g = src_g * source.a * inv_dest_a;
        let weighted_src_b = src_b * source.a * inv_dest_a;

        let weighted_dst_r = dst_r * destination.a;
        let weighted_dst_g = dst_g * destination.a;
        let weighted_dst_b = dst_b * destination.a;

        let blend_r = weighted_dst_r + weighted_src_r;
        let blend_g = weighted_dst_g + weighted_src_g;
        let blend_b = weighted_dst_b + weighted_src_b;

        if result_a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        BlendResult {
            pixel: PixelData::from_unpremultiplied_normalized(
                blend_r / result_a,
                blend_g / result_a,
                blend_b / result_a,
                result_a,
            ),
        }
    }
}
