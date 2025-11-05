use crate::types::{BlendMode, BlendProperties, RarityConfig};

#[derive(Debug, Clone)]
pub struct LayerBlendProperties {
    pub mode: BlendMode,
    pub opacity: f32,
}

impl LayerBlendProperties {
    pub fn from_config(
        layer: &str,
        trait_value: &str,
        rarity_config: &RarityConfig,
        current_set_id: &str,
    ) -> Self {
        let blend_properties = rarity_config
            .layers
            .get(layer)
            .and_then(|layer_config| layer_config.traits.get(trait_value))
            .and_then(|trait_config| trait_config.sets.get(current_set_id))
            .and_then(|set_config| Some(set_config.blend.clone()))
            .unwrap_or_else(|| BlendProperties {
                mode: BlendMode::SourceOver,
                opacity: 1.0,
            });

        let converter_blend_mode = match blend_properties.mode {
            BlendMode::SourceOver => BlendMode::SourceOver,
            BlendMode::SourceIn => BlendMode::SourceIn,
            BlendMode::SourceOut => BlendMode::SourceOut,
            BlendMode::SourceAtop => BlendMode::SourceAtop,
            BlendMode::DestinationOver => BlendMode::DestinationOver,
            BlendMode::DestinationIn => BlendMode::DestinationIn,
            BlendMode::DestinationOut => BlendMode::DestinationOut,
            BlendMode::DestinationAtop => BlendMode::DestinationAtop,
            BlendMode::Multiply => BlendMode::Multiply,
            BlendMode::Screen => BlendMode::Screen,
            BlendMode::Overlay => BlendMode::Overlay,
            BlendMode::Darken => BlendMode::Darken,
            BlendMode::Lighten => BlendMode::Lighten,
            BlendMode::ColorDodge => BlendMode::ColorDodge,
            BlendMode::ColorBurn => BlendMode::ColorBurn,
            BlendMode::HardLight => BlendMode::HardLight,
            BlendMode::SoftLight => BlendMode::SoftLight,
            BlendMode::Difference => BlendMode::Difference,
            BlendMode::Exclusion => BlendMode::Exclusion,
            BlendMode::Hue => BlendMode::Hue,
            BlendMode::Saturation => BlendMode::Saturation,
            BlendMode::Color => BlendMode::Color,
            BlendMode::Luminosity => BlendMode::Luminosity,
            BlendMode::Lighter => BlendMode::Lighter,
            BlendMode::Copy => BlendMode::Copy,
            BlendMode::Xor => BlendMode::Xor,
        };

        LayerBlendProperties {
            mode: converter_blend_mode,
            opacity: blend_properties.opacity,
        }
    }
}
