use crate::effects::core::cpu::simd::traits::{SimdArchitecture, SimdFilter};
use image::RgbaImage;
use rayon::prelude::*;
use std::marker::PhantomData;

#[derive(Debug, Clone, Copy)]
pub struct PixelData {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

impl PixelData {
    pub fn from_premultiplied(r: u8, g: u8, b: u8, a: u8) -> Self {
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

    pub fn to_rgba_u8(&self) -> [u8; 4] {
        if self.a <= 0.0001 {
            return [0, 0, 0, 0];
        }

        let r = ((self.r / self.a).clamp(0.0, 1.0) * 255.0).round() as u8;
        let g = ((self.g / self.a).clamp(0.0, 1.0) * 255.0).round() as u8;
        let b = ((self.b / self.a).clamp(0.0, 1.0) * 255.0).round() as u8;
        let a = (self.a.clamp(0.0, 1.0) * 255.0).round() as u8;

        [r, g, b, a]
    }
}

pub struct BlendResult {
    pub pixel: PixelData,
}

pub trait BlendProcessor<A: SimdArchitecture + Sync>: Send + Sync {
    fn blend_pixels(&self, source: &PixelData, destination: &PixelData) -> BlendResult;

    unsafe fn process_simd_chunk(
        &self,
        destination: &RgbaImage,
        output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
        source: &RgbaImage,
    );

    fn process_images(&self, source: &RgbaImage, destination: &RgbaImage) -> RgbaImage;

    fn process_images_inplace(&self, source: &RgbaImage, destination: &mut RgbaImage) {
        let result = self.process_images(source, destination);
        *destination = result;
    }
}

pub fn process_images_with_blend<A: SimdArchitecture + Sync, T: BlendProcessor<A>>(
    blend_processor: &T,
    source: &RgbaImage,
    destination: &RgbaImage,
) -> RgbaImage {
    let width = destination.width();
    let height = destination.height();
    let mut result = RgbaImage::new(width, height);

    let filter = BlendFilter::<A> {
        blend_processor,
        source: source.clone(),
        _phantom: PhantomData,
    };

    let height_usize = height as usize;
    let width_usize = width as usize;
    let num_threads = rayon::current_num_threads().max(1);
    let chunk_size = height_usize / num_threads;

    let row_ranges: Vec<_> = (0..num_threads)
        .map(|i| {
            let start = i * chunk_size;
            let end = if i == num_threads - 1 {
                height_usize
            } else {
                (i + 1) * chunk_size
            };
            (start, end)
        })
        .collect();

    let results: Vec<_> = row_ranges
        .into_par_iter()
        .map(|(start_y, end_y)| {
            let mut local_output = vec![0u8; (end_y - start_y) * width_usize * 4];

            for (local_y, y) in (start_y..end_y).enumerate() {
                let width_chunks = width_usize / A::chunk_size();

                for x_chunk in 0..width_chunks {
                    let x_base = x_chunk * A::chunk_size();

                    unsafe {
                        filter.process_simd_chunk(
                            destination,
                            &mut local_output,
                            x_base,
                            y,
                            local_y,
                            width_usize,
                        );
                    }
                }

                for x in (width_chunks * A::chunk_size())..width_usize {
                    filter.process_scalar_pixel(
                        destination,
                        &mut local_output,
                        x,
                        y,
                        local_y,
                        width_usize,
                    );
                }
            }

            (start_y, end_y, local_output)
        })
        .collect();

    for (start_y, end_y, local_output) in results {
        for local_y in 0..(end_y - start_y) {
            let y = local_y + start_y;
            for x in 0..width {
                let output_idx = (local_y * width_usize + x as usize) * 4;
                let pixel = image::Rgba([
                    local_output[output_idx],
                    local_output[output_idx + 1],
                    local_output[output_idx + 2],
                    local_output[output_idx + 3],
                ]);
                result.put_pixel(x, y as u32, pixel);
            }
        }
    }

    result
}

pub struct BlendFilter<'a, A: SimdArchitecture + Sync> {
    blend_processor: &'a dyn BlendProcessor<A>,
    source: RgbaImage,
    _phantom: PhantomData<A>,
}

impl<'a, A: SimdArchitecture + Sync> SimdFilter<A> for BlendFilter<'a, A> {
    unsafe fn process_simd_chunk(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x_base: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        self.blend_processor.process_simd_chunk(
            input,
            local_output,
            x_base,
            y,
            local_y,
            width_usize,
            &self.source,
        );
    }

    fn process_scalar_pixel(
        &self,
        input: &RgbaImage,
        local_output: &mut [u8],
        x: usize,
        y: usize,
        local_y: usize,
        width_usize: usize,
    ) {
        if x >= input.width() as usize || y >= input.height() as usize {
            return;
        }

        if x >= self.source.width() as usize || y >= self.source.height() as usize {
            return;
        }

        let destination_pixel = input.get_pixel(x as u32, y as u32);
        let source_pixel = self.source.get_pixel(x as u32, y as u32);

        let source_data = PixelData::from_premultiplied(
            source_pixel[0],
            source_pixel[1],
            source_pixel[2],
            source_pixel[3],
        );
        let destination_data = PixelData::from_premultiplied(
            destination_pixel[0],
            destination_pixel[1],
            destination_pixel[2],
            destination_pixel[3],
        );

        let result = self
            .blend_processor
            .blend_pixels(&source_data, &destination_data);
        let rgba = result.pixel.to_rgba_u8();

        let output_idx = (local_y * width_usize + x) * 4;
        if output_idx + 3 < local_output.len() {
            local_output[output_idx] = rgba[0];
            local_output[output_idx + 1] = rgba[1];
            local_output[output_idx + 2] = rgba[2];
            local_output[output_idx + 3] = rgba[3];
        }
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
