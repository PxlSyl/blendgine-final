use image::{Rgba, RgbaImage};
use rusttype::{point, Font, Scale};
use std::{collections::HashMap, error::Error, f32};
use wgpu::{
    Device, Extent3d, ImageCopyTexture, ImageDataLayout, Queue, Texture, TextureDescriptor,
    TextureDimension, TextureFormat, TextureUsages,
};

fn calculate_character_size(font: &Font, scale: Scale, charset: &str) -> (u32, u32) {
    let v_metrics = font.v_metrics(scale);

    let mut max_width: f32 = 0.0;
    let mut max_height: f32 = 0.0;

    for ch in charset.chars() {
        let glyph = font.glyph(ch).scaled(scale);
        let h_metrics = glyph.h_metrics();

        let width: f32 = h_metrics.advance_width + h_metrics.left_side_bearing;

        max_width = max_width.max(width);
        max_height = max_height.max(v_metrics.ascent - v_metrics.descent + v_metrics.line_gap);
    }

    let padding: f32 = 2.0;
    let char_width = (max_width.ceil() as u32) + (padding as u32 * 2);
    let char_height = (max_height.ceil() as u32) + (padding as u32 * 2);

    (char_width.max(1), char_height.max(1))
}

pub fn generate_character_bitmaps(
    charset: &str,
    font_data: &[u8],
    font_size: f32,
) -> Result<(Vec<u32>, u32, u32), Box<dyn Error>> {
    let font = Font::try_from_bytes(font_data).ok_or("Invalid font data")?;

    let scale = Scale::uniform(font_size);
    let v_metrics = font.v_metrics(scale);

    let (char_width, char_height) = calculate_character_size(&font, scale, charset);
    let char_size = (char_width * char_height) as usize;

    let charset_len = charset.chars().count();
    let mut char_bitmaps = Vec::with_capacity(charset_len);

    for ch in charset.chars() {
        let mut char_img = RgbaImage::new(char_width, char_height);

        let glyph = font.glyph(ch).scaled(scale);
        let glyph = glyph.positioned(point(0.0, v_metrics.ascent));

        for y in 0..char_height {
            for x in 0..char_width {
                char_img.put_pixel(x, y, Rgba([0, 0, 0, 0]));
            }
        }

        if let Some(bb) = glyph.pixel_bounding_box() {
            glyph.draw(|gx, gy, v| {
                let px = gx as i32 - bb.min.x;
                let py = gy as i32 - bb.min.y;

                if px >= 0 && py >= 0 && (px as u32) < char_width && (py as u32) < char_height {
                    let alpha = (v * 255.0) as u8;
                    if alpha > 30 {
                        char_img.put_pixel(px as u32, py as u32, Rgba([255, 255, 255, 255]));
                    }
                }
            });
        }

        let mut packed_bitmap = Vec::with_capacity((char_size + 31) / 32);
        let mut current_word = 0u32;
        let mut bit_pos = 0;

        for y in 0..char_height {
            for x in 0..char_width {
                let pixel = char_img.get_pixel(x, y);
                if pixel[3] > 0 {
                    current_word |= 1 << bit_pos;
                }

                bit_pos += 1;
                if bit_pos == 32 {
                    packed_bitmap.push(current_word);
                    current_word = 0;
                    bit_pos = 0;
                }
            }
        }

        if bit_pos > 0 {
            packed_bitmap.push(current_word);
        }

        char_bitmaps.extend(packed_bitmap);
    }

    if let Some(first_char) = charset.chars().next() {
        println!(
            "First character '{}' bitmap ({}x{}):",
            first_char, char_width, char_height
        );
        for y in 0..char_height.min(8) {
            for x in 0..char_width.min(8) {
                let idx = (y * char_width + x) as usize;
                let word_idx = idx / 32;
                let bit_pos = idx % 32;
                let bit = (char_bitmaps[word_idx] >> bit_pos) & 1;
                print!("{}", if bit == 1 { '#' } else { '.' });
            }
            println!();
        }
    }

    Ok((char_bitmaps, char_width, char_height))
}

pub fn render_characters_batch(
    image: &mut RgbaImage,
    font: &Font,
    scale: Scale,
    characters: &[(char, i32, i32)],
    color: Rgba<u8>,
) {
    let mut char_metrics = HashMap::new();

    for (ch, x, y) in characters {
        let metrics = char_metrics.entry(ch).or_insert_with(|| {
            let glyph = font.glyph(*ch).scaled(scale);
            glyph.exact_bounding_box()
        });

        if let Some(bb) = metrics {
            use rusttype::point;
            let glyph = font
                .glyph(*ch)
                .scaled(scale)
                .positioned(point(0.0, scale.y));

            glyph.draw(|gx, gy, v| {
                let px = x + gx as i32 + bb.min.x as i32;
                let py = y + gy as i32 + bb.min.y as i32;
                if px >= 0 && py >= 0 && (px as u32) < image.width() && (py as u32) < image.height()
                {
                    let alpha = (v * 255.0) as u8;
                    let base = image.get_pixel_mut(px as u32, py as u32);
                    *base = blend_rgba(*base, color, alpha);
                }
            });
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct CharMetadata {
    pub width: u32,
    pub height: u32,
    pub bearing_x: i32,
    pub bearing_y: i32,
    pub advance: f32,
}

pub fn create_font_atlas(
    device: &Device,
    queue: &Queue,
    font_data: &[u8],
    font_size: f32,
    charset: &str,
) -> Result<(Texture, Vec<CharMetadata>), Box<dyn Error>> {
    let font = Font::try_from_bytes(font_data).ok_or("Invalid font data")?;
    let scale = Scale::uniform(font_size);

    let (char_width, char_height) = calculate_character_size(&font, scale, charset);
    let char_count = charset.chars().count();

    let atlas_width = char_width * char_count as u32;
    let atlas_height = char_height;

    let mut atlas = RgbaImage::new(atlas_width, atlas_height);
    let mut char_metadatas = Vec::with_capacity(char_count);

    for (i, ch) in charset.chars().enumerate() {
        let x_offset = i as u32 * char_width;

        let glyph = font.glyph(ch).scaled(scale);
        let h_metrics = glyph.h_metrics();
        let v_metrics = font.v_metrics(scale);

        let glyph = glyph.positioned(point(0.0, v_metrics.ascent));

        if let Some(bb) = glyph.pixel_bounding_box() {
            let x_min = bb.min.x;
            let y_min = bb.min.y;

            glyph.draw(|gx, gy, v| {
                let px = x_offset as i32 + gx as i32 - x_min;
                let py = gy as i32 - y_min;

                if px >= 0 && py >= 0 && (px as u32) < atlas_width && (py as u32) < atlas_height {
                    let alpha = (v * 255.0) as u8;
                    if alpha > 30 {
                        atlas.put_pixel(px as u32, py as u32, Rgba([255, 255, 255, 255]));
                    }
                }
            });

            char_metadatas.push(CharMetadata {
                width: (bb.max.x - bb.min.x) as u32,
                height: (bb.max.y - bb.min.y) as u32,
                bearing_x: bb.min.x,
                bearing_y: bb.min.y,
                advance: h_metrics.advance_width,
            });
        } else {
            char_metadatas.push(CharMetadata {
                width: 0,
                height: 0,
                bearing_x: 0,
                bearing_y: 0,
                advance: h_metrics.advance_width,
            });
        }
    }

    let texture_size = Extent3d {
        width: atlas_width,
        height: atlas_height,
        depth_or_array_layers: 1,
    };

    let mut gray_data = Vec::with_capacity((atlas_width * atlas_height) as usize);
    for y in 0..atlas_height {
        for x in 0..atlas_width {
            let pixel = atlas.get_pixel(x, y);
            gray_data.push(pixel[0]);
        }
    }

    let texture = device.create_texture(&TextureDescriptor {
        label: Some("Font Atlas"),
        size: texture_size,
        mip_level_count: 1,
        sample_count: 1,
        dimension: TextureDimension::D2,
        format: TextureFormat::R8Unorm,
        usage: TextureUsages::TEXTURE_BINDING | TextureUsages::COPY_DST,
        view_formats: &[TextureFormat::R8Unorm],
    });

    queue.write_texture(
        ImageCopyTexture {
            texture: &texture,
            mip_level: 0,
            origin: wgpu::Origin3d::ZERO,
            aspect: wgpu::TextureAspect::All,
        },
        &gray_data,
        ImageDataLayout {
            offset: 0,
            bytes_per_row: Some(atlas_width),
            rows_per_image: Some(atlas_height),
        },
        texture_size,
    );

    Ok((texture, char_metadatas))
}

#[inline]
fn blend_rgba(bg: Rgba<u8>, fg: Rgba<u8>, alpha: u8) -> Rgba<u8> {
    if alpha == 0 {
        return bg;
    }
    if alpha == 255 {
        return fg;
    }

    let a = alpha as u16;
    let inv_a = 255 - a;
    Rgba([
        ((bg[0] as u16 * inv_a + fg[0] as u16 * a) / 255) as u8,
        ((bg[1] as u16 * inv_a + fg[1] as u16 * a) / 255) as u8,
        ((bg[2] as u16 * inv_a + fg[2] as u16 * a) / 255) as u8,
        255,
    ])
}
