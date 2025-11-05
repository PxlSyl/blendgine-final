use crate::{
    layerpreview::select::select_import::utils::structs::LayerContent, types::ImageDimensions,
};
use anyhow::Result;

pub fn get_base_dimensions(layers: &[LayerContent]) -> Result<ImageDimensions, String> {
    layers
        .first()
        .and_then(|layer| layer.images.first())
        .map(|image| image.dimensions.clone())
        .ok_or_else(|| "No valid images found in the first layer".to_string())
}
