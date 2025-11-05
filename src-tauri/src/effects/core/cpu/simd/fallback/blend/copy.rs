use super::base::{BlendProcessor, BlendResult, PixelData};

pub struct CopyBlend;

impl CopyBlend {
    pub fn new() -> Self {
        Self
    }
}

impl BlendProcessor for CopyBlend {
    fn blend_pixels(&self, source: &PixelData, _destination: &PixelData) -> BlendResult {
        if source.a <= 0.0001 {
            return BlendResult {
                pixel: PixelData::from_normalized(0.0, 0.0, 0.0, 0.0),
            };
        }

        if source.a >= 0.9999 {
            return BlendResult {
                pixel: PixelData::from_normalized(
                    source.r / source.a,
                    source.g / source.a,
                    source.b / source.a,
                    1.0,
                ),
            };
        }

        BlendResult { pixel: *source }
    }
}
