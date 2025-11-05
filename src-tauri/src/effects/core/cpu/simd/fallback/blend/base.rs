use crate::types::BlendMode;
use image::RgbaImage;
use rayon::prelude::*;

#[derive(Debug, Clone, Copy)]
pub struct PixelData {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

impl PixelData {
    pub fn new(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self {
            r: r as f32 / 255.0,
            g: g as f32 / 255.0,
            b: b as f32 / 255.0,
            a: a as f32 / 255.0,
        }
    }

    pub fn from_normalized(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self { r, g, b, a }
    }

    pub fn from_unpremultiplied_normalized(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self {
            r: r * a,
            g: g * a,
            b: b * a,
            a,
        }
    }

    pub fn to_rgba_u8(&self) -> [u8; 4] {
        [
            (self.r.clamp(0.0, 1.0) * 255.0).round() as u8,
            (self.g.clamp(0.0, 1.0) * 255.0).round() as u8,
            (self.b.clamp(0.0, 1.0) * 255.0).round() as u8,
            (self.a.clamp(0.0, 1.0) * 255.0).round() as u8,
        ]
    }
}

pub struct BlendResult {
    pub pixel: PixelData,
}

pub trait BlendProcessor: Send + Sync {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult;

    fn process_images(&self, source: &RgbaImage, destination: &RgbaImage) -> RgbaImage {
        process_images_with_blend(self, source, destination)
    }

    fn process_images_inplace(&self, source: &RgbaImage, destination: &mut RgbaImage) {
        process_images_with_blend_inplace(self, source, destination)
    }
}

pub fn process_images_with_blend<T: BlendProcessor + ?Sized>(
    blend_processor: &T,
    source: &RgbaImage,
    destination: &RgbaImage,
) -> RgbaImage {
    let width = destination.width();
    let height = destination.height();
    let mut result = RgbaImage::new(width, height);

    let width_usize = width as usize;
    let height_usize = height as usize;

    let num_threads = rayon::current_num_threads().max(1);
    let total_pixels = width_usize * height_usize;
    let pixels_per_thread = total_pixels / num_threads;

    let tile_size = if pixels_per_thread < 1024 {
        16
    } else if pixels_per_thread < 4096 {
        32
    } else if pixels_per_thread < 16384 {
        64
    } else {
        128
    };

    let tiles_x = (width_usize + tile_size - 1) / tile_size;
    let tiles_y = (height_usize + tile_size - 1) / tile_size;

    let tile_coords: Vec<_> = (0..tiles_y)
        .flat_map(|tile_y| (0..tiles_x).map(move |tile_x| (tile_x, tile_y)))
        .collect();

    let results: Vec<_> = tile_coords
        .into_par_iter()
        .map(|(tile_x, tile_y)| {
            let x_start = tile_x * tile_size;
            let x_end = (x_start + tile_size).min(width_usize);
            let y_start = tile_y * tile_size;
            let y_end = (y_start + tile_size).min(height_usize);

            let mut tile_result = vec![[0u8; 4]; (y_end - y_start) * (x_end - x_start)];

            for y in y_start..y_end {
                for x in x_start..x_end {
                    let source_pixel = source.get_pixel(x as u32, y as u32);
                    let dest_pixel = destination.get_pixel(x as u32, y as u32);

                    let source_data = PixelData::new(
                        source_pixel[0],
                        source_pixel[1],
                        source_pixel[2],
                        source_pixel[3],
                    );
                    let dest_data =
                        PixelData::new(dest_pixel[0], dest_pixel[1], dest_pixel[2], dest_pixel[3]);

                    let blend_result = blend_processor.blend_pixels(&source_data, &dest_data);
                    let local_idx = (y - y_start) * (x_end - x_start) + (x - x_start);
                    tile_result[local_idx] = blend_result.pixel.to_rgba_u8();
                }
            }

            ((x_start, y_start), (x_end, y_end), tile_result)
        })
        .collect();

    for ((x_start, y_start), (x_end, y_end), tile_result) in results {
        for y in y_start..y_end {
            for x in x_start..x_end {
                let local_idx = (y - y_start) * (x_end - x_start) + (x - x_start);
                let pixel_data = tile_result[local_idx];
                result.put_pixel(x as u32, y as u32, image::Rgba(pixel_data));
            }
        }
    }

    result
}

pub fn get_blend_implementation(blend_mode: BlendMode) -> Box<dyn BlendProcessor + 'static> {
    match blend_mode {
        BlendMode::SourceOver => Box::new(super::source_over::SourceOverBlend::new()),
        BlendMode::Multiply => Box::new(super::multiply::MultiplyBlend::new()),
        BlendMode::Screen => Box::new(super::screen::ScreenBlend::new()),
        BlendMode::Overlay => Box::new(super::overlay::OverlayBlend::new()),
        BlendMode::Darken => Box::new(super::darken::DarkenBlend::new()),
        BlendMode::Lighten => Box::new(super::lighten::LightenBlend::new()),
        BlendMode::HardLight => Box::new(super::hard_light::HardLightBlend::new()),
        BlendMode::SoftLight => Box::new(super::soft_light::SoftLightBlend::new()),
        BlendMode::Difference => Box::new(super::difference::DifferenceBlend::new()),
        BlendMode::Exclusion => Box::new(super::exclusion::ExclusionBlend::new()),
        BlendMode::ColorDodge => Box::new(super::color_dodge::ColorDodgeBlend::new()),
        BlendMode::ColorBurn => Box::new(super::color_burn::ColorBurnBlend::new()),
        BlendMode::Xor => Box::new(super::xor::XorBlend::new()),
        BlendMode::SourceIn => Box::new(super::source_in::SourceInBlend::new()),
        BlendMode::SourceOut => Box::new(super::source_out::SourceOutBlend::new()),
        BlendMode::SourceAtop => Box::new(super::source_atop::SourceAtopBlend::new()),
        BlendMode::DestinationOver => {
            Box::new(super::destination_over::DestinationOverBlend::new())
        }
        BlendMode::DestinationIn => Box::new(super::destination_in::DestinationInBlend::new()),
        BlendMode::DestinationOut => Box::new(super::destination_out::DestinationOutBlend::new()),
        BlendMode::DestinationAtop => {
            Box::new(super::destination_atop::DestinationAtopBlend::new())
        }
        BlendMode::Lighter => Box::new(super::lighter::LighterBlend::new()),
        BlendMode::Copy => Box::new(super::copy::CopyBlend::new()),
        BlendMode::Hue => Box::new(super::hue::HueBlend::new()),
        BlendMode::Saturation => Box::new(super::saturation::SaturationBlend::new()),
        BlendMode::Color => Box::new(super::color::ColorBlend::new()),
        BlendMode::Luminosity => Box::new(super::luminosity::LuminosityBlend::new()),
    }
}

pub mod blend_utils {
    use super::PixelData;

    pub fn rgb_to_hsl(pixel: &PixelData) -> (f32, f32, f32) {
        let r = pixel.r;
        let g = pixel.g;
        let b = pixel.b;

        let max = r.max(g.max(b));
        let min = r.min(g.min(b));

        let mut h = 0.0;
        let mut s = 0.0;
        let l = (max + min) / 2.0;

        if max != min {
            let d = max - min;
            s = if l > 0.5 {
                d / (2.0 - max - min)
            } else {
                d / (max + min)
            };

            if max == r {
                h = (g - b) / d + (if g < b { 6.0 } else { 0.0 });
            } else if max == g {
                h = (b - r) / d + 2.0;
            } else {
                h = (r - g) / d + 4.0;
            }
            h /= 6.0;
        }

        (h, s, l)
    }

    pub fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
        if s == 0.0 {
            return (l, l, l);
        }

        let q = if l < 0.5 {
            l * (1.0 + s)
        } else {
            l + s - l * s
        };
        let p = 2.0 * l - q;

        let r = hue_to_rgb(p, q, h + 1.0 / 3.0);
        let g = hue_to_rgb(p, q, h);
        let b = hue_to_rgb(p, q, h - 1.0 / 3.0);

        (r, g, b)
    }

    fn hue_to_rgb(p: f32, q: f32, mut t: f32) -> f32 {
        if t < 0.0 {
            t += 1.0;
        }
        if t > 1.0 {
            t -= 1.0;
        }

        if t < 1.0 / 6.0 {
            return p + (q - p) * 6.0 * t;
        }
        if t < 1.0 / 2.0 {
            return q;
        }
        if t < 2.0 / 3.0 {
            return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
        }

        p
    }
}

pub fn process_images_with_blend_inplace<T: BlendProcessor + ?Sized>(
    blend_processor: &T,
    source: &RgbaImage,
    destination: &mut RgbaImage,
) {
    let width = destination.width();
    let height = destination.height();
    let width_usize = width as usize;
    let height_usize = height as usize;

    let num_threads = rayon::current_num_threads().max(1);
    let total_pixels = width_usize * height_usize;
    let pixels_per_thread = total_pixels / num_threads;

    let tile_size = if pixels_per_thread < 1024 {
        16
    } else if pixels_per_thread < 4096 {
        32
    } else if pixels_per_thread < 16384 {
        64
    } else {
        128
    };

    let tiles_x = (width_usize + tile_size - 1) / tile_size;
    let tiles_y = (height_usize + tile_size - 1) / tile_size;

    let tile_coords: Vec<_> = (0..tiles_y)
        .flat_map(|tile_y| (0..tiles_x).map(move |tile_x| (tile_x, tile_y)))
        .collect();

    let results: Vec<_> = tile_coords
        .into_par_iter()
        .map(|(tile_x, tile_y)| {
            let x_start = tile_x * tile_size;
            let x_end = (x_start + tile_size).min(width_usize);
            let y_start = tile_y * tile_size;
            let y_end = (y_start + tile_size).min(height_usize);

            let mut tile_result = vec![[0u8; 4]; (y_end - y_start) * (x_end - x_start)];

            for (local_y, y) in (y_start..y_end).enumerate() {
                for (local_x, x) in (x_start..x_end).enumerate() {
                    let source_pixel = source.get_pixel(x as u32, y as u32);
                    let dest_pixel = destination.get_pixel(x as u32, y as u32);

                    let source_data = PixelData::new(
                        source_pixel[0],
                        source_pixel[1],
                        source_pixel[2],
                        source_pixel[3],
                    );
                    let dest_data =
                        PixelData::new(dest_pixel[0], dest_pixel[1], dest_pixel[2], dest_pixel[3]);

                    let blended = blend_processor.blend_pixels(&source_data, &dest_data);
                    let result = blended.pixel.to_rgba_u8();

                    let local_idx = local_y * (x_end - x_start) + local_x;
                    tile_result[local_idx] = result;
                }
            }

            (x_start, y_start, x_end, y_end, tile_result)
        })
        .collect();

    for (x_start, y_start, x_end, y_end, tile_result) in results {
        for (local_y, y) in (y_start..y_end).enumerate() {
            for (local_x, x) in (x_start..x_end).enumerate() {
                let local_idx = local_y * (x_end - x_start) + local_x;
                let pixel_data = tile_result[local_idx];
                let pixel =
                    image::Rgba([pixel_data[0], pixel_data[1], pixel_data[2], pixel_data[3]]);
                destination.put_pixel(x as u32, y as u32, pixel);
            }
        }
    }
}
