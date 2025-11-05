use anyhow::Result;
use image::{DynamicImage, GenericImageView};

use crate::effects::core::dispatch::blendmodes::BlendConverter;
use crate::generation::generate::layers::blend::LayerBlendProperties;
use crate::types::SpritesheetLayout;

pub fn blend_spritesheets_with_individual_properties(
    spritesheet_paths: &[std::path::PathBuf],
    blend_properties_list: &[LayerBlendProperties],
    metadata: &SpritesheetLayout,
) -> Result<(DynamicImage, Vec<DynamicImage>)> {
    if spritesheet_paths.is_empty() {
        return Err(anyhow::anyhow!("No spritesheet paths provided"));
    }

    if spritesheet_paths.len() != blend_properties_list.len() {
        return Err(anyhow::anyhow!(
            "Mismatch: {} spritesheets but {} blend properties",
            spritesheet_paths.len(),
            blend_properties_list.len()
        ));
    }

    let mut blended_spritesheet = image::open(&spritesheet_paths[0])?;

    for (index, spritesheet_path) in spritesheet_paths[1..].iter().enumerate() {
        let next_spritesheet = image::open(spritesheet_path)?;
        let blend_properties = &blend_properties_list[index + 1];

        blended_spritesheet =
            blend_spritesheets(&blended_spritesheet, &next_spritesheet, blend_properties)?;
    }

    let frames = extract_frames_from_dynamic_spritesheet(&blended_spritesheet, metadata)?;

    Ok((blended_spritesheet, frames))
}

fn extract_frames_from_dynamic_spritesheet(
    spritesheet: &DynamicImage,
    metadata: &SpritesheetLayout,
) -> Result<Vec<DynamicImage>> {
    let mut frame_positions = Vec::new();
    for i in 0..metadata.total_frames {
        let col = i % metadata.cols;
        let row = i / metadata.cols;
        let left = col * metadata.frame_width;
        let top = row * metadata.frame_height;
        frame_positions.push((i, left, top));
    }

    let mut frames = Vec::new();
    frames.reserve(metadata.total_frames as usize);

    for &(i, left, top) in &frame_positions {
        if left >= spritesheet.width()
            || top >= spritesheet.height()
            || left + metadata.frame_width > spritesheet.width()
            || top + metadata.frame_height > spritesheet.height()
        {
            continue;
        }

        let frame = spritesheet.crop_imm(left, top, metadata.frame_width, metadata.frame_height);

        let dynamic_src_image = DynamicImage::ImageRgba8(frame.to_rgba8());
        frames.push((i, dynamic_src_image));
    }

    frames.sort_by_key(|&(i, _)| i);
    let frames: Vec<_> = frames.into_iter().map(|(_, img)| img).collect();

    Ok(frames)
}

fn blend_spritesheets(
    base_spritesheet: &DynamicImage,
    overlay_spritesheet: &DynamicImage,
    blend_properties: &LayerBlendProperties,
) -> Result<DynamicImage> {
    let (width, height) = base_spritesheet.dimensions();

    if overlay_spritesheet.dimensions() != (width, height) {
        return Err(anyhow::anyhow!(
            "Spritesheet dimensions mismatch: base {}x{}, overlay {}x{}",
            width,
            height,
            overlay_spritesheet.width(),
            overlay_spritesheet.height()
        ));
    }

    let base_rgba = base_spritesheet.to_rgba8();
    let overlay_rgba = overlay_spritesheet.to_rgba8();

    let mut blend_converter = BlendConverter::new(&base_rgba.as_raw(), width, height)
        .map_err(|e| anyhow::anyhow!("Failed to create blend converter: {}", e))?;

    blend_converter
        .apply_blend_mode(
            &overlay_rgba.as_raw(),
            blend_properties.mode,
            blend_properties.opacity,
        )
        .map_err(|e| anyhow::anyhow!("Failed to apply blend mode: {}", e))?;

    if let Some(blended_image) = blend_converter.get_image() {
        Ok(DynamicImage::ImageRgba8(blended_image.clone()))
    } else {
        Err(anyhow::anyhow!("Failed to get blended image"))
    }
}
