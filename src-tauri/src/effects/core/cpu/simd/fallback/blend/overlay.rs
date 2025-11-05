use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct OverlayBlend;

impl OverlayBlend {
    pub fn new() -> Self {
        Self
    }

    fn overlay_channel(base: f32, blend: f32) -> f32 {
        if base < 0.5 {
            2.0 * base * blend
        } else {
            1.0 - 2.0 * (1.0 - base) * (1.0 - blend)
        }
    }
}

impl BlendProcessor for OverlayBlend {
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

            let overlay_r = Self::overlay_channel(dst_r, src_r);
            let overlay_g = Self::overlay_channel(dst_g, src_g);
            let overlay_b = Self::overlay_channel(dst_b, src_b);

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(
                    overlay_r, overlay_g, overlay_b, source.a,
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

        let overlay_r = Self::overlay_channel(dst_r, src_r);
        let overlay_g = Self::overlay_channel(dst_g, src_g);
        let overlay_b = Self::overlay_channel(dst_b, src_b);

        let overlay_r_premult = overlay_r * source.a;
        let overlay_g_premult = overlay_g * source.a;
        let overlay_b_premult = overlay_b * source.a;

        let inv_source_a = 1.0 - source.a;

        let result_r = overlay_r_premult + destination.r * inv_source_a;
        let result_g = overlay_g_premult + destination.g * inv_source_a;
        let result_b = overlay_b_premult + destination.b * inv_source_a;

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
