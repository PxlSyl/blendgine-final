pub mod base;
pub mod color;
pub mod color_burn;
pub mod color_dodge;
pub mod copy;
pub mod darken;
pub mod destination_atop;
pub mod destination_in;
pub mod destination_out;
pub mod destination_over;
pub mod difference;
pub mod exclusion;
pub mod hard_light;
pub mod hue;
pub mod lighten;
pub mod lighter;
pub mod luminosity;
pub mod multiply;
pub mod overlay;
pub mod saturation;
pub mod screen;
pub mod soft_light;
pub mod source_atop;
pub mod source_in;
pub mod source_out;
pub mod source_over;
pub mod xor;

use image::RgbaImage;

use crate::types::BlendMode;

pub fn apply_blend(
    blend_mode: BlendMode,
    source: &RgbaImage,
    destination: &RgbaImage,
) -> RgbaImage {
    use self::base::get_blend_implementation;

    let processor = get_blend_implementation(blend_mode);
    processor.process_images(source, destination)
}

pub fn apply_blend_inplace(blend_mode: BlendMode, source: &RgbaImage, destination: &mut RgbaImage) {
    use self::base::get_blend_implementation;

    let processor = get_blend_implementation(blend_mode);
    processor.process_images_inplace(source, destination);
}
