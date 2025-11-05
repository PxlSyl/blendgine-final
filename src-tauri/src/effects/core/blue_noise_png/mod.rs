use image::{ImageBuffer, Luma};

pub fn get_blue_noise_texture() -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let noise_bytes = include_bytes!("noise.png");

    match image::load_from_memory(noise_bytes) {
        Ok(noise_image) => noise_image.into_luma8(),
        Err(_) => create_fallback_noise_texture(64, 64),
    }
}

pub fn create_fallback_noise_texture(width: u32, height: u32) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let mut noise = ImageBuffer::new(width, height);

    for y in 0..height {
        for x in 0..width {
            let noise_value = ((x as f32 * 0.1 + y as f32 * 0.1) % 256.0) as u8;
            noise.put_pixel(x, y, Luma([noise_value]));
        }
    }

    noise
}

pub fn get_blue_noise_or_fallback(width: u32, height: u32) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let noise = get_blue_noise_texture();

    if noise.width() == width && noise.height() == height {
        noise
    } else {
        image::imageops::resize(&noise, width, height, image::imageops::FilterType::Lanczos3)
    }
}
