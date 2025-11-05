use crate::layerpreview::select::select_import::{
    check_animated::check_animated_images,
    utils::{image_file::process_image_file, structs::LayerContent},
};
use anyhow::Result;
use futures::future::join_all;
use tokio::fs::{read_dir, DirEntry};

pub async fn process_layer_directory(entry: DirEntry) -> Result<Option<LayerContent>, String> {
    let layer_name = entry.file_name().to_string_lossy().to_string();
    let layer_path = entry.path();

    let mut image_futures = Vec::with_capacity(32);
    let mut base_dimensions = None;

    let mut subdir_stream = match read_dir(&layer_path).await {
        Ok(s) => s,
        Err(_) => return Ok(None),
    };

    while let Ok(Some(subentry)) = subdir_stream.next_entry().await {
        if !matches!(subentry.file_type().await, Ok(ft) if ft.is_file()) {
            continue;
        }

        let ext = subentry
            .path()
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase());

        if matches!(ext.as_deref(), Some("png") | Some("webp") | Some("gif")) {
            image_futures.push(process_image_file(subentry.path()));
        }
    }

    let image_results = join_all(image_futures).await;

    let mut images = Vec::with_capacity(image_results.len());
    for result in image_results {
        if let Ok(Some((metadata, dimensions))) = result {
            if base_dimensions.is_none() {
                base_dimensions = Some(dimensions.clone());
            }
            images.push(metadata);
        }
    }

    if images.is_empty() {
        return Ok(None);
    }

    let has_animated_images = check_animated_images(layer_path.to_string_lossy().to_string())
        .await
        .unwrap_or(false);

    Ok(Some(LayerContent {
        name: layer_name,
        images,
        base_dimensions: base_dimensions.unwrap(),
        has_animated_images,
    }))
}
