use super::{CURRENT_LAYOUT, FRAME_DIMENSIONS, GLOBAL_MAX_FRAMES};
use crate::{
    layerpreview::animations::{get_animated_frames_dir, FrameProcessor},
    types::SpritesheetLayout,
};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Runtime};

#[tauri::command]
pub async fn get_spritesheets_path<R: Runtime>(
    app_handle: AppHandle<R>,
    project_id: String,
) -> Result<String, String> {
    let base_dir = get_animated_frames_dir(&app_handle, &project_id)?;
    let spritesheets_dir = base_dir.join("spritesheets");
    Ok(spritesheets_dir.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn get_spritesheet_metadata() -> Result<SpritesheetLayout, String> {
    let frame_count = GLOBAL_MAX_FRAMES.load(Ordering::SeqCst);

    if frame_count == 0 {
        return Err("No frames have been processed yet".to_string());
    }

    let dimensions_guard = FRAME_DIMENSIONS.read().await;
    let (frame_width, frame_height) = dimensions_guard.ok_or("No frame dimensions available")?;

    let layout_guard = CURRENT_LAYOUT.read().await;
    let layout = layout_guard
        .as_ref()
        .ok_or("No layout has been calculated yet")?;

    let metadata = SpritesheetLayout {
        rows: layout.rows,
        cols: layout.cols,
        frame_width,
        frame_height,
        total_sheets: layout.total_sheets,
        frames_per_sheet: layout.frames_per_sheet,
        total_frames: frame_count,
    };

    Ok(metadata)
}

#[tauri::command]
pub async fn extract_frames<R: Runtime>(
    app_handle: AppHandle<R>,
    project_id: String,
    image_path: String,
    layer_name: String,
    image_name: String,
    max_frames: u32,
    should_recreate_spritesheets: bool,
    total_files: u32,
) -> Result<Vec<String>, String> {
    let base_dir = get_animated_frames_dir(&app_handle, &project_id)?;

    let processor_result = FrameProcessor::new(
        app_handle.clone(),
        base_dir,
        layer_name,
        image_name,
        image_path,
        max_frames,
        should_recreate_spritesheets,
        total_files,
    )
    .await;

    let mut processor = processor_result?;

    let result = processor.process().await?;

    Ok(result)
}
