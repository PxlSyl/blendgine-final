use image::{DynamicImage, GenericImageView, Rgba, RgbaImage};

/// Apply X/Y offset to an image by shifting pixels
/// Transparent pixels fill the empty areas
pub fn apply_offset(image: &DynamicImage, offset_x: i32, offset_y: i32) -> DynamicImage {
    if offset_x == 0 && offset_y == 0 {
        return image.clone();
    }

    let (width, height) = image.dimensions();
    let mut result = RgbaImage::from_pixel(width, height, Rgba([0, 0, 0, 0]));

    let rgba_source = image.to_rgba8();

    for y in 0..height {
        for x in 0..width {
            let src_x = x as i32 - offset_x;
            let src_y = y as i32 - offset_y;

            // Check if source coordinates are within bounds
            if src_x >= 0 && src_x < width as i32 && src_y >= 0 && src_y < height as i32 {
                let pixel = rgba_source.get_pixel(src_x as u32, src_y as u32);
                result.put_pixel(x, y, *pixel);
            }
            // Else: pixel remains transparent (default)
        }
    }

    DynamicImage::ImageRgba8(result)
}
