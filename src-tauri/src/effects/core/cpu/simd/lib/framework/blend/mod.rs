mod base;
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

use crate::effects::core::cpu::simd::traits::SimdArchitecture;
use crate::types::BlendMode;
pub use base::BlendProcessor;

pub fn get_blend_implementation<A: SimdArchitecture + Sync>(
    blend_mode: BlendMode,
) -> Box<dyn BlendProcessor<A> + 'static> {
    match blend_mode {
        BlendMode::SourceOver => Box::new(source_over::SourceOverBlend::new()),
        BlendMode::Multiply => Box::new(multiply::MultiplyBlend::new()),
        BlendMode::Screen => Box::new(screen::ScreenBlend::new()),
        BlendMode::Overlay => Box::new(overlay::OverlayBlend::new()),
        BlendMode::Darken => Box::new(darken::DarkenBlend::new()),
        BlendMode::Lighten => Box::new(lighten::LightenBlend::new()),
        BlendMode::HardLight => Box::new(hard_light::HardLightBlend::new()),
        BlendMode::SoftLight => Box::new(soft_light::SoftLightBlend::new()),
        BlendMode::Difference => Box::new(difference::DifferenceBlend::new()),
        BlendMode::Exclusion => Box::new(exclusion::ExclusionBlend::new()),
        BlendMode::ColorDodge => Box::new(color_dodge::ColorDodgeBlend::new()),
        BlendMode::ColorBurn => Box::new(color_burn::ColorBurnBlend::new()),
        BlendMode::Xor => Box::new(xor::XorBlend::new()),
        BlendMode::SourceIn => Box::new(source_in::SourceInBlend::new()),
        BlendMode::SourceOut => Box::new(source_out::SourceOutBlend::new()),
        BlendMode::SourceAtop => Box::new(source_atop::SourceAtopBlend::new()),
        BlendMode::DestinationOver => Box::new(destination_over::DestinationOverBlend::new()),
        BlendMode::DestinationIn => Box::new(destination_in::DestinationInBlend::new()),
        BlendMode::DestinationOut => Box::new(destination_out::DestinationOutBlend::new()),
        BlendMode::DestinationAtop => Box::new(destination_atop::DestinationAtopBlend::new()),
        BlendMode::Lighter => Box::new(lighter::LighterBlend::new()),
        BlendMode::Copy => Box::new(copy::CopyBlend::new()),
        BlendMode::Hue => Box::new(hue::HueBlend::new()),
        BlendMode::Saturation => Box::new(saturation::SaturationBlend::new()),
        BlendMode::Color => Box::new(color::ColorBlend::new()),
        BlendMode::Luminosity => Box::new(luminosity::LuminosityBlend::new()),
    }
}

pub fn apply_blend<A: SimdArchitecture + Sync>(
    blend_mode: BlendMode,
    source: &image::RgbaImage,
    destination: &image::RgbaImage,
) -> image::RgbaImage {
    let processor = get_blend_implementation::<A>(blend_mode);
    processor.process_images(source, destination)
}

pub fn apply_blend_inplace<A: SimdArchitecture + Sync>(
    blend_mode: BlendMode,
    source: &image::RgbaImage,
    destination: &mut image::RgbaImage,
) {
    let processor = get_blend_implementation::<A>(blend_mode);
    processor.process_images_inplace(source, destination);
}
