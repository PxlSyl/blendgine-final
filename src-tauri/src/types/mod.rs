use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::effects::core::cpu::resize_cpu::ResizeConfig;

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSetupState {
    #[serde(default)]
    pub collection_name: String,
    #[serde(default)]
    pub collection_description: String,
    #[serde(default)]
    pub selected_folder: Option<String>,
    #[serde(default)]
    pub export_folder: String,
    #[serde(default)]
    pub include_rarity: bool,
    #[serde(default)]
    pub max_frames: u32,
    #[serde(default)]
    pub is_animated_collection: bool,
    #[serde(default)]
    pub spritesheet_layout: Option<SpritesheetLayout>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Preferences {
    pub dark_mode: bool,
    pub show_tooltips: Option<bool>,
    pub theme_name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ImageSetupState {
    pub image_format: String,
    pub base_width: u32,
    pub base_height: u32,
    pub final_width: u32,
    pub final_height: u32,
    pub fixed_proportion: bool,
    pub include_spritesheets: bool,
    pub allow_duplicates: bool,
    pub shuffle_sets: bool,
    pub blockchain: String,
    pub solana_config: Option<SolanaMetadataConfig>,
    pub animation_quality: Option<AnimationQualityConfig>,
    pub resize_config: Option<ResizeConfig>,
}

impl Default for ImageSetupState {
    fn default() -> Self {
        Self {
            image_format: "png".to_string(),
            base_width: 1024,
            base_height: 1024,
            final_width: 1024,
            final_height: 1024,
            fixed_proportion: true,
            include_spritesheets: false,
            allow_duplicates: false,
            shuffle_sets: true,
            blockchain: "eth".to_string(),
            solana_config: Some(SolanaMetadataConfig::default()),
            animation_quality: Some(AnimationQualityConfig::default()),
            resize_config: Some(ResizeConfig::default()),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SetConfig {
    pub blend: BlendProperties,
    pub z_index: i32,
    pub enabled: bool,
    pub value: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub include_in_metadata: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset_x: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset_y: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TraitConfig {
    pub sets: HashMap<String, SetConfig>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct LayerSetConfig {
    pub active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub include_in_metadata: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayerConfig {
    pub sets: HashMap<String, LayerSetConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked: Option<bool>,
    pub traits: HashMap<String, TraitConfig>,
    pub default_blend: BlendProperties,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OrderedLayersSet {
    pub id: String,
    pub name: String,
    pub custom_name: Option<String>,
    pub created_at: String,
    pub layers: Vec<String>,
    pub nft_count: u32,
}

pub type OrderedLayersSets = HashMap<String, OrderedLayersSet>;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SetInfo {
    pub id: String,
    pub name: String,
    pub custom_name: Option<String>,
    pub created_at: String,
    pub layers: Vec<String>,
    pub nft_count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct SetsStorage {
    pub sets: HashMap<String, SetInfo>,
    pub active_set_id: String,
    pub set_orders: Vec<SetOrder>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SetOrder {
    pub id: String,
    pub order: u32,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RarityConfig {
    #[serde(flatten)]
    pub layers: HashMap<String, LayerConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImageDimensions {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Incompatibilities {
    #[serde(flatten)]
    pub incompatibilities: HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct IncompatibilitiesBySets {
    #[serde(flatten)]
    pub sets: HashMap<String, Incompatibilities>,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ForcedCombinations {
    #[serde(flatten)]
    pub forced_combinations: HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>,
}

#[derive(Debug, Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ForcedCombinationsBySets {
    #[serde(flatten)]
    pub sets: HashMap<String, ForcedCombinations>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NFTTrait {
    pub trait_type: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GenerationResult {
    pub traits: Vec<NFTTrait>,
    pub original_index: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NFTGenerationArgs {
    pub input_folder: String,
    pub export_folder: String,
    pub collection_name: String,
    pub collection_description: String,
    pub include_rarity: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sets_storage: Option<SetsStorage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rarity_config: Option<RarityConfig>,
    pub base_width: u32,
    pub base_height: u32,
    pub final_width: u32,
    pub final_height: u32,
    pub image_format: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub incompatibilities_by_sets: Option<HashMap<String, Incompatibilities>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub forced_combinations_by_sets: Option<HashMap<String, ForcedCombinations>>,
    pub allow_duplicates: bool,
    pub shuffle_sets: bool,
    pub blockchain: String,
    pub is_animated_collection: bool,
    pub include_spritesheets: bool,
    pub solana_config: Option<SolanaMetadataConfig>,
    pub fps: Option<u32>,
    pub animation_quality: Option<AnimationQualityConfig>,
    pub resize_config: Option<ResizeConfig>,
    pub total_frames_count: Option<u32>,
    pub spritesheet_layout: Option<SpritesheetLayout>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SolanaCreator {
    pub address: String,
    pub share: u32,
}

impl Default for SolanaCreator {
    fn default() -> Self {
        Self {
            address: "".to_string(),
            share: 100,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SolanaMetadataConfig {
    pub symbol: String,
    pub seller_fee_basis_points: u32,
    pub external_url: String,
    pub creators: Vec<SolanaCreator>,
}

impl Default for SolanaMetadataConfig {
    fn default() -> Self {
        Self {
            symbol: "".to_string(),
            seller_fee_basis_points: 500,
            external_url: "".to_string(),
            creators: vec![SolanaCreator::default()],
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct RarityConfigStorage {
    pub rarity_config_storage: RarityConfig,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FolderContent {
    pub is_valid: bool,
    pub error_message: Option<String>,
    pub files: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NFTAttribute {
    pub trait_type: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NFTMetadata {
    pub name: String,
    pub image: String,
    pub attributes: Vec<NFTAttribute>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GlobalMetadata {
    pub items: Vec<NFTMetadata>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub is_valid: bool,
    pub error_message: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MixingResult {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OtherParameters {
    pub hash: std::collections::HashMap<String, String>,
    pub last_created_collection: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum BlendMode {
    SourceOver,
    Lighter,
    Multiply,
    Screen,
    Overlay,
    Darken,
    Lighten,
    ColorDodge,
    ColorBurn,
    HardLight,
    SoftLight,
    Difference,
    Exclusion,
    Hue,
    Saturation,
    Color,
    Luminosity,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BlendProperties {
    pub mode: BlendMode,
    pub opacity: f32,
}

impl Default for BlendProperties {
    fn default() -> Self {
        Self {
            mode: BlendMode::SourceOver,
            opacity: 1.0,
        }
    }
}

impl ToString for BlendMode {
    fn to_string(&self) -> String {
        match self {
            BlendMode::SourceOver => "source-over".to_string(),
            BlendMode::Lighter => "lighter".to_string(),
            BlendMode::Multiply => "multiply".to_string(),
            BlendMode::Screen => "screen".to_string(),
            BlendMode::Overlay => "overlay".to_string(),
            BlendMode::Darken => "darken".to_string(),
            BlendMode::Lighten => "lighten".to_string(),
            BlendMode::ColorDodge => "color-dodge".to_string(),
            BlendMode::ColorBurn => "color-burn".to_string(),
            BlendMode::HardLight => "hard-light".to_string(),
            BlendMode::SoftLight => "soft-light".to_string(),
            BlendMode::Difference => "difference".to_string(),
            BlendMode::Exclusion => "exclusion".to_string(),
            BlendMode::Hue => "hue".to_string(),
            BlendMode::Saturation => "saturation".to_string(),
            BlendMode::Color => "color".to_string(),
            BlendMode::Luminosity => "luminosity".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "UPPERCASE")]
pub enum InterpolationMethod {
    #[serde(rename = "LUCAS_KANADE")]
    LucasKanade,
    #[serde(rename = "MOTION_FLOW")]
    MotionFlow,
    Blend,
    #[serde(rename = "PHASE_BASED")]
    PhaseBased,
    Bidirectional,
    Dissolve,
    #[serde(rename = "BLOCK_BASED")]
    BlockBased,
    #[serde(rename = "DISPLACEMENT_MAP")]
    DisplacementMap,
}

impl std::fmt::Display for InterpolationMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InterpolationMethod::LucasKanade => write!(f, "LucasKanade"),
            InterpolationMethod::MotionFlow => write!(f, "MotionFlow"),
            InterpolationMethod::Blend => write!(f, "Blend"),
            InterpolationMethod::PhaseBased => write!(f, "PhaseBased"),
            InterpolationMethod::Bidirectional => write!(f, "Bidirectional"),
            InterpolationMethod::Dissolve => write!(f, "Dissolve"),
            InterpolationMethod::BlockBased => write!(f, "BlockBased"),
            InterpolationMethod::DisplacementMap => write!(f, "DisplacementMap"),
        }
    }
}

impl Default for InterpolationMethod {
    fn default() -> Self {
        Self::LucasKanade
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AnimationInterpolationSettings {
    pub enabled: bool,
    pub method: InterpolationMethod,
    pub factor: u32,
}

impl Default for AnimationInterpolationSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            method: InterpolationMethod::LucasKanade,
            factor: 1,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WebPSettings {
    pub lossless: bool,
    pub quality: u32,
    pub method: u32,
    pub interpolation: AnimationInterpolationSettings,
    pub autoloop: bool,
}

impl Default for WebPSettings {
    fn default() -> Self {
        Self {
            lossless: true,
            quality: 100,
            method: 6,
            interpolation: AnimationInterpolationSettings::default(),
            autoloop: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum DitheringMethod {
    FloydSteinberg,
    Ordered,
    Rasterize,
}

impl std::fmt::Display for DitheringMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DitheringMethod::FloydSteinberg => write!(f, "FloydSteinberg"),
            DitheringMethod::Ordered => write!(f, "Ordered"),
            DitheringMethod::Rasterize => write!(f, "Rasterize"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GIFSettings {
    pub colors: u32,
    pub dithering: bool,
    pub dithering_method: DitheringMethod,
    pub interpolation: AnimationInterpolationSettings,
    pub autoloop: bool,
}

impl Default for GIFSettings {
    fn default() -> Self {
        Self {
            colors: 256,
            dithering: true,
            dithering_method: DitheringMethod::FloydSteinberg,
            interpolation: AnimationInterpolationSettings::default(),
            autoloop: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MP4Settings {
    pub quality: u32,
    pub interpolation: AnimationInterpolationSettings,
    pub autoloop: bool,
}

impl Default for MP4Settings {
    fn default() -> Self {
        Self {
            quality: 7,
            interpolation: AnimationInterpolationSettings::default(),
            autoloop: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WebMSettings {
    pub quality: u32,
    pub interpolation: AnimationInterpolationSettings,
    pub autoloop: bool,
}

impl Default for WebMSettings {
    fn default() -> Self {
        Self {
            quality: 7,
            interpolation: AnimationInterpolationSettings::default(),
            autoloop: true,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AnimationQualityConfig {
    pub optimize: bool,
    pub format_specific_settings: FormatSpecificSettings,
}

impl Default for AnimationQualityConfig {
    fn default() -> Self {
        Self {
            optimize: true,
            format_specific_settings: FormatSpecificSettings::default(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FormatSpecificSettings {
    pub webp: WebPSettings,
    pub gif: GIFSettings,
    pub mp4: MP4Settings,
    pub webm: WebMSettings,
}

impl Default for FormatSpecificSettings {
    fn default() -> Self {
        Self {
            webp: WebPSettings::default(),
            gif: GIFSettings::default(),
            mp4: MP4Settings::default(),
            webm: WebMSettings::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SpritesheetLayout {
    pub rows: u32,
    pub cols: u32,
    pub frame_width: u32,
    pub frame_height: u32,
    pub total_sheets: u32,
    pub frames_per_sheet: u32,
    pub total_frames: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalRarityInput {
    pub rarity_config: RarityConfig,
    pub sets: HashMap<String, SetInfo>,
}
