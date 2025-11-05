use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct SoftLightBlend;

impl SoftLightBlend {
    pub fn new() -> Self {
        Self
    }

    fn soft_light_d(destination: f32) -> f32 {
        if destination <= 0.25 {
            ((16.0 * destination - 12.0) * destination + 4.0) * destination
        } else {
            destination.sqrt()
        }
    }

    fn soft_light_channel(source: f32, destination: f32) -> f32 {
        if source <= 0.0 {
            return destination;
        }
        if source >= 1.0 {
            return destination;
        }

        if source < 0.5 {
            destination - (1.0 - 2.0 * source) * destination * (1.0 - destination)
        } else {
            let d = Self::soft_light_d(destination);
            destination + (2.0 * source - 1.0) * (d - destination)
        }
    }
}

impl BlendProcessor for SoftLightBlend {
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

            let soft_light_r = Self::soft_light_channel(src_r, dst_r);
            let soft_light_g = Self::soft_light_channel(src_g, dst_g);
            let soft_light_b = Self::soft_light_channel(src_b, dst_b);

            return BlendResult {
                pixel: PixelData::from_unpremultiplied_normalized(
                    soft_light_r,
                    soft_light_g,
                    soft_light_b,
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

        let soft_light_r = Self::soft_light_channel(src_r, dst_r);
        let soft_light_g = Self::soft_light_channel(src_g, dst_g);
        let soft_light_b = Self::soft_light_channel(src_b, dst_b);

        let soft_light_r_premult = soft_light_r * source.a;
        let soft_light_g_premult = soft_light_g * source.a;
        let soft_light_b_premult = soft_light_b * source.a;

        let inv_source_a = 1.0 - source.a;

        let result_r = soft_light_r_premult + destination.r * inv_source_a;
        let result_g = soft_light_g_premult + destination.g * inv_source_a;
        let result_b = soft_light_b_premult + destination.b * inv_source_a;

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
