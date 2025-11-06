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

        LayerBlendProperties {
            mode: blend_properties.mode,
            opacity: blend_properties.opacity,
        }
    }
}
