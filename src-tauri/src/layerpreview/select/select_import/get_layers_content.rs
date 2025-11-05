use crate::layerpreview::select::select_import::utils::{
    layer_directory::process_layer_directory, structs::LayerContent,
};
use anyhow::Result;
use futures::future::join_all;
use tokio::fs::read_dir;
use tracing;

#[tauri::command]
pub async fn get_layers_content(folder_path: &str) -> Result<Vec<LayerContent>, String> {
    tracing::info!("Getting layers content from folder: {}", folder_path);

    let mut dir_stream = read_dir(folder_path).await.map_err(|e| {
        let msg = format!("Failed to read directory: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;

    let mut dir_entries = Vec::with_capacity(16);

    while let Some(entry_result) = dir_stream.next_entry().await.transpose() {
        let entry = entry_result.map_err(|e| {
            let msg = format!("Failed to read directory entry: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;
        if entry
            .file_type()
            .await
            .map(|ft| ft.is_dir())
            .unwrap_or(false)
        {
            dir_entries.push(entry);
        }
    }

    let dir_count = dir_entries.len();
    let layer_futures: Vec<_> = dir_entries
        .into_iter()
        .map(process_layer_directory)
        .collect();

    tracing::debug!("Processing {} layer directories", dir_count);
    let layer_results = join_all(layer_futures).await;

    let layers: Vec<LayerContent> = layer_results
        .into_iter()
        .filter_map(|res| res.ok().flatten())
        .collect();

    tracing::info!("Successfully processed {} layers", layers.len());
    Ok(layers)
}
