use crate::types::{BlendMode, BlendProperties, RarityConfig};

#[derive(Debug, Clone)]
pub struct LayerBlendProperties {
    pub mode: BlendMode,
    pub opacity: f32,
    pub offset_x: i32,
    pub offset_y: i32,
}

impl LayerBlendProperties {
    pub fn from_config(
        layer: &str,
        trait_value: &str,
        rarity_config: &RarityConfig,
        current_set_id: &str,
    ) -> Self {
        let set_config = rarity_config
            .layers
            .get(layer)
            .and_then(|layer_config| layer_config.traits.get(trait_value))
            .and_then(|trait_config| trait_config.sets.get(current_set_id));

        let blend_properties =
            set_config
                .map(|sc| sc.blend.clone())
                .unwrap_or_else(|| BlendProperties {
                    mode: BlendMode::SourceOver,
                    opacity: 1.0,
                });

        let offset_x = set_config.and_then(|sc| sc.offset_x).unwrap_or(0);
        let offset_y = set_config.and_then(|sc| sc.offset_y).unwrap_or(0);

        LayerBlendProperties {
            mode: blend_properties.mode,
            opacity: blend_properties.opacity,
            offset_x,
            offset_y,
        }
    }
}
