use anyhow::{anyhow, Result};
use fast_image_resize::{images::Image, FilterType, PixelType, ResizeAlg, ResizeOptions, Resizer};
use image::{DynamicImage, ImageBuffer, Rgba};
use lazy_static::lazy_static;
use num_cpus;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use thread_local::ThreadLocal;

lazy_static! {
    static ref RESIZER_POOL: ThreadLocal<RefCell<Resizer>> = ThreadLocal::new();
}

fn get_thread_local_resizer() -> &'static RefCell<Resizer> {
    RESIZER_POOL.get_or(|| RefCell::new(Resizer::new()))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum ResizeAlgorithm {
    Nearest,
    Convolution,
    Interpolation,
    SuperSampling,
}

impl Default for ResizeAlgorithm {
    fn default() -> Self {
        Self::Convolution
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum ResizeFilter {
    Nearest,
    Bilinear,
    Bicubic,
    Lanczos,
    Hamming,
    Mitchell,
    Gaussian,
}

impl Default for ResizeFilter {
    fn default() -> Self {
        Self::Lanczos
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResizeConfig {
    pub algorithm: ResizeAlgorithm,
    pub filter: Option<ResizeFilter>,
    pub super_sampling_factor: Option<u8>,
}

impl Default for ResizeConfig {
    fn default() -> Self {
        Self {
            algorithm: ResizeAlgorithm::Convolution,
            filter: Some(ResizeFilter::Lanczos),
            super_sampling_factor: None,
        }
    }
}

fn map_filter(filter: &ResizeFilter) -> FilterType {
    match filter {
        ResizeFilter::Nearest => FilterType::Box,
        ResizeFilter::Bilinear => FilterType::Bilinear,
        ResizeFilter::Bicubic => FilterType::CatmullRom,
        ResizeFilter::Lanczos => FilterType::Lanczos3,
        ResizeFilter::Hamming => FilterType::Hamming,
        ResizeFilter::Mitchell => FilterType::Mitchell,
        ResizeFilter::Gaussian => FilterType::Gaussian,
    }
}

fn build_resize_alg(config: &Option<ResizeConfig>) -> ResizeAlg {
    if let Some(config) = config {
        match config.algorithm {
            ResizeAlgorithm::Nearest => ResizeAlg::Nearest,
            ResizeAlgorithm::Convolution => {
                let filter = config.filter.as_ref().unwrap_or(&ResizeFilter::Lanczos);
                ResizeAlg::Convolution(map_filter(filter))
            }
            ResizeAlgorithm::Interpolation => {
                let filter = config.filter.as_ref().unwrap_or(&ResizeFilter::Lanczos);
                ResizeAlg::Interpolation(map_filter(filter))
            }
            ResizeAlgorithm::SuperSampling => {
                let filter = config.filter.as_ref().unwrap_or(&ResizeFilter::Lanczos);
                let factor = config.super_sampling_factor.unwrap_or(2).max(1);
                ResizeAlg::SuperSampling(map_filter(filter), factor)
            }
        }
    } else {
        ResizeAlg::Convolution(FilterType::Lanczos3)
    }
}

fn create_src_image(rgba: ImageBuffer<Rgba<u8>, Vec<u8>>) -> Result<Image<'static>> {
    let width = rgba.width();
    let height = rgba.height();

    if width == 0 || height == 0 {
        return Err(anyhow!("Invalid source dimensions: {}x{}", width, height));
    }

    Image::from_vec_u8(width, height, rgba.into_raw(), PixelType::U8x4)
        .map_err(|e| anyhow!("Failed to create source image: {}", e))
}

fn create_dst_image(width: u32, height: u32) -> Result<Image<'static>> {
    if width == 0 || height == 0 {
        return Err(anyhow!(
            "Invalid destination dimensions: {}x{}",
            width,
            height
        ));
    }

    Ok(Image::new(width, height, PixelType::U8x4))
}

fn resize_image_with_resizer(
    image: &DynamicImage,
    width: u32,
    height: u32,
    resizer: &mut Resizer,
    options: &ResizeOptions,
) -> Result<DynamicImage> {
    let src_image = create_src_image(image.to_rgba8())?;
    let mut dst_image = create_dst_image(width, height)?;

    resizer
        .resize(&src_image, &mut dst_image, options)
        .map_err(|e| anyhow!("Failed to resize image: {}", e))?;

    let dst_buffer = dst_image.into_vec();
    let resized_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, dst_buffer)
        .ok_or_else(|| anyhow!("Failed to create resized image buffer"))?;

    Ok(DynamicImage::ImageRgba8(resized_buffer))
}

pub fn resize_single_image(
    image: &DynamicImage,
    width: u32,
    height: u32,
    resize_config: &Option<ResizeConfig>,
) -> Result<DynamicImage> {
    if width == 0 || height == 0 {
        return Err(anyhow!(
            "Invalid dimensions: width={}, height={}",
            width,
            height
        ));
    }

    let resize_alg = build_resize_alg(resize_config);
    let options = ResizeOptions::new().resize_alg(resize_alg);

    let resizer_ref = get_thread_local_resizer();
    let mut resizer = resizer_ref.borrow_mut();

    resize_image_with_resizer(image, width, height, &mut resizer, &options)
}

fn get_parallelization_thresholds() -> (usize, usize) {
    let cpu_count = num_cpus::get();

    let pixels_per_image_threshold = match cpu_count {
        1..=2 => 2_000_000,
        3..=4 => 1_500_000,
        5..=8 => 1_000_000,
        9..=16 => 750_000,
        _ => 500_000,
    };

    let total_pixels_threshold = match cpu_count {
        1..=2 => 20_000_000,
        3..=4 => 15_000_000,
        5..=8 => 10_000_000,
        9..=16 => 7_500_000,
        _ => 5_000_000,
    };

    (pixels_per_image_threshold, total_pixels_threshold)
}

pub fn resize_images(
    frames: &[DynamicImage],
    width: u32,
    height: u32,
    resize_config: &Option<ResizeConfig>,
) -> Result<Vec<DynamicImage>> {
    if width == 0 || height == 0 {
        return Err(anyhow!(
            "Invalid dimensions: width={}, height={}",
            width,
            height
        ));
    }

    if frames.is_empty() {
        return Ok(Vec::new());
    }

    let resize_alg = build_resize_alg(resize_config);
    let options = ResizeOptions::new().resize_alg(resize_alg);

    let pixels_per_image = (width * height) as usize;
    let total_pixels = pixels_per_image * frames.len();

    let (pixels_per_image_threshold, total_pixels_threshold) = get_parallelization_thresholds();
    let should_parallelize =
        pixels_per_image >= pixels_per_image_threshold || total_pixels >= total_pixels_threshold;

    if should_parallelize {
        const CHUNK_SIZE: usize = 32;

        frames
            .par_chunks(CHUNK_SIZE)
            .map(|chunk| {
                chunk
                    .iter()
                    .map(|frame| {
                        let resizer_ref = get_thread_local_resizer();
                        let mut resizer = resizer_ref.borrow_mut();
                        resize_image_with_resizer(frame, width, height, &mut resizer, &options)
                    })
                    .collect::<Result<Vec<_>>>()
            })
            .collect::<Result<Vec<_>>>()
            .map(|vec_of_vecs| vec_of_vecs.into_iter().flatten().collect())
    } else {
        let resizer_ref = get_thread_local_resizer();
        let mut resizer = resizer_ref.borrow_mut();

        frames
            .iter()
            .map(|frame| resize_image_with_resizer(frame, width, height, &mut resizer, &options))
            .collect()
    }
}
