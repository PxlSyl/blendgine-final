use anyhow::Result;
use dashmap::DashMap;
use image::RgbaImage;
use once_cell::sync::Lazy;
use rayon::prelude::*;
use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicU32, Ordering},
    sync::Arc,
    time::Instant,
};

use crate::effects::core::cpu::{
    resize_cpu::{resize_single_image, ResizeConfig},
    simd::apply_blend_simd_inplace,
};
use crate::generation::generate::{
    layers::blend::LayerBlendProperties, task_manager::spawn_save_task,
};
use crate::types::{NFTTrait, RarityConfig};

pub static BLEND_PROPERTIES_CACHE: Lazy<DashMap<String, LayerBlendProperties>> =
    Lazy::new(|| DashMap::new());

pub static LAYER_IMAGES_CACHE: Lazy<DashMap<String, CachedImage>> = Lazy::new(|| DashMap::new());

pub static RESIZE_CONFIG_CACHE: Lazy<DashMap<(), ResizeConfig>> = Lazy::new(|| DashMap::new());

pub static CACHE_USAGE_COUNTER: Lazy<AtomicU32> = Lazy::new(|| AtomicU32::new(0));

fn is_empty_trait(trait_value: &str) -> bool {
    trait_value == "None" || trait_value == "none" || trait_value.is_empty()
}

fn get_or_create_resize_config_cache(resize_config: &ResizeConfig) -> ResizeConfig {
    if let Some(cached_config) = RESIZE_CONFIG_CACHE.get(&()) {
        cached_config.value().clone()
    } else {
        RESIZE_CONFIG_CACHE.insert((), resize_config.clone());
        resize_config.clone()
    }
}

#[derive(Clone)]
pub struct ValidLayer {
    pub path: std::path::PathBuf,
    pub blend_key: String,
}

pub struct CachedImage {
    pub image: Arc<RgbaImage>,
    pub last_used: Instant,
    pub usage_count: AtomicU32,
}

impl CachedImage {
    fn new(image: RgbaImage) -> Self {
        Self {
            image: Arc::new(image),
            last_used: Instant::now(),
            usage_count: AtomicU32::new(1),
        }
    }

    fn increment_usage(&mut self) {
        self.usage_count.fetch_add(1, Ordering::Relaxed);
        self.last_used = Instant::now();
    }
}

pub fn cleanup_cpu_caches_internal() {
    println!("🧹 [CPU] Cleaning CPU caches...");
    BLEND_PROPERTIES_CACHE.clear();
    LAYER_IMAGES_CACHE.clear();
    RESIZE_CONFIG_CACHE.clear();
    CACHE_USAGE_COUNTER.store(0, Ordering::Relaxed);
    println!("🧹 [CPU] CPU caches cleaned");
}

pub async fn process_static_single_cpu(
    traits: &[NFTTrait],
    active_layer_order: &[String],
    input_folder: &Path,
    base_width: u32,
    base_height: u32,
    final_width: u32,
    final_height: u32,
    rarity_config: &RarityConfig,
    current_set_id: &str,
    images_path: PathBuf,
    collection_name: &str,
    image_format: &str,
    index: u32,
    resize_config: Option<ResizeConfig>,
) -> Result<()> {
    CACHE_USAGE_COUNTER.fetch_add(1, Ordering::Relaxed);

    if active_layer_order.is_empty() {
        return Err(anyhow::anyhow!("No layers to process"));
    }

    let valid_layers: Vec<ValidLayer> = active_layer_order
        .iter()
        .filter_map(|layer| {
            let trait_data = traits.iter().find(|t| t.trait_type == *layer)?;
            if is_empty_trait(&trait_data.value) {
                return None;
            }

            let blend_key = format!("{}_{}_{}", current_set_id, layer, trait_data.value);

            let _blend_properties = BLEND_PROPERTIES_CACHE
                .entry(blend_key.clone())
                .or_insert_with(|| {
                    LayerBlendProperties::from_config(
                        layer,
                        &trait_data.value,
                        rarity_config,
                        current_set_id,
                    )
                })
                .clone();

            let png_path = input_folder
                .join(layer)
                .join(format!("{}.png", trait_data.value));
            let webp_path = input_folder
                .join(layer)
                .join(format!("{}.webp", trait_data.value));

            let path = if png_path.exists() {
                png_path
            } else if webp_path.exists() {
                webp_path
            } else {
                return None;
            };

            Some(ValidLayer { path, blend_key })
        })
        .collect();

    if valid_layers.is_empty() {
        return Err(anyhow::anyhow!("No valid layer found"));
    }

    let transparent_base =
        RgbaImage::from_pixel(base_width, base_height, image::Rgba([0, 0, 0, 0]));
    let mut base_image = Some(transparent_base);

    let layer_images: Vec<(ValidLayer, RgbaImage)> = valid_layers
        .par_iter()
        .map(|vlayer| {
            let cache_key = vlayer.path.to_string_lossy().to_string();
            let image = if let Some(mut cached_image) = LAYER_IMAGES_CACHE.get_mut(&cache_key) {
                cached_image.value_mut().increment_usage();
                cached_image.value_mut().last_used = Instant::now();
                (*cached_image.value().image).clone()
            } else {
                let new_image = image::open(&vlayer.path)?.to_rgba8();
                let cached_image = CachedImage::new(new_image.clone());
                LAYER_IMAGES_CACHE.insert(cache_key, cached_image);
                new_image
            };

            Ok::<_, anyhow::Error>((vlayer.clone(), image))
        })
        .collect::<Result<Vec<_>>>()?;

    for (vlayer, layer_image) in layer_images.into_iter() {
        let blend_props_entry = BLEND_PROPERTIES_CACHE
            .get(&vlayer.blend_key)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Blend properties not found in cache for key: {}. This should not happen as the cache is populated before processing.",
                    vlayer.blend_key
                )
            })?;

        let blend_properties = blend_props_entry.value();

        if let Some(ref mut base) = base_image {
            apply_blend_simd_inplace(blend_properties.mode, &layer_image, base);
        }
    }

    let base_image = base_image.ok_or_else(|| anyhow::anyhow!("No base image created"))?;
    let base_image_dynamic = image::DynamicImage::ImageRgba8(base_image);

    let final_image = if let Some(ref resize_config_ref) = resize_config {
        let cached_config = get_or_create_resize_config_cache(resize_config_ref);

        resize_single_image(
            &base_image_dynamic,
            final_width,
            final_height,
            &Some(cached_config),
        )
        .map_err(|e| anyhow::anyhow!("CPU resize failed: {}", e))?
    } else {
        let default_config = ResizeConfig::default();
        let cached_default = get_or_create_resize_config_cache(&default_config);

        resize_single_image(
            &base_image_dynamic,
            final_width,
            final_height,
            &Some(cached_default),
        )
        .map_err(|e| anyhow::anyhow!("CPU resize failed: {}", e))?
    };

    let output_path = images_path.join(format!(
        "{}_{}.{}",
        collection_name,
        index + 1,
        image_format
    ));

    let task_id = format!("save_{}_{}", collection_name, index + 1);
    let image_format_clone = image_format.to_string();

    if let Err(_e) = spawn_save_task(task_id.clone(), move || {
        // 🔍 Diagnostic de la taille d'image
        tracing::info!(
            "🔍 [SAVE] Image size: {}x{} pixels",
            final_image.width(),
            final_image.height()
        );

        let save_result = match image_format_clone.to_lowercase().as_str() {
            "png" => final_image.save_with_format(&output_path, image::ImageFormat::Png),
            "jpg" | "jpeg" => final_image.save_with_format(&output_path, image::ImageFormat::Jpeg),
            "webp" => final_image.save_with_format(&output_path, image::ImageFormat::WebP),
            _ => {
                return Err(anyhow::anyhow!(
                    "Unsupported image format: {}",
                    image_format_clone
                ));
            }
        };

        match save_result {
            Ok(_) => Ok(()),
            Err(e) => Err(anyhow::anyhow!("Failed to save image: {}", e)),
        }
    })
    .await
    {}

    Ok(())
}
