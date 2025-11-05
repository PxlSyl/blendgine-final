use super::{
    CURRENT_LAYOUT, FRAMES_PROCESSED_COUNT, FRAME_DIMENSIONS, GLOBAL_MAX_FRAMES,
    TOTAL_TRAITS_TO_PROCESS,
};
use std::{
    fs::{self},
    path::PathBuf,
    sync::atomic::Ordering,
};

use tauri::{AppHandle, Manager, Runtime};
use tracing;

type Result<T, E = String> = std::result::Result<T, E>;

pub fn update_global_max_frames(frames_len: u32, max_frames: u32) {
    let current_max = GLOBAL_MAX_FRAMES.load(Ordering::SeqCst);

    let new_max = if max_frames > 0 {
        frames_len.min(max_frames).max(current_max)
    } else {
        frames_len.max(current_max)
    };

    if new_max > current_max {
        GLOBAL_MAX_FRAMES.store(new_max, Ordering::SeqCst);
    }
}

pub fn get_animated_frames_dir<R: Runtime>(
    app_handle: &AppHandle<R>,
    project_id: &str,
) -> Result<PathBuf, String> {
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        let msg = format!("Failed to get app data directory: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;

    let animated_dir = app_data_dir.join("animated").join(project_id);

    if !animated_dir.exists() {
        fs::create_dir_all(&animated_dir).map_err(|e| {
            let msg = format!("Failed to create animated directory: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;
    }

    Ok(animated_dir)
}

pub async fn reset_animation_state() {
    FRAMES_PROCESSED_COUNT.store(0, Ordering::SeqCst);
    TOTAL_TRAITS_TO_PROCESS.store(0, Ordering::SeqCst);
    GLOBAL_MAX_FRAMES.store(0, Ordering::SeqCst);

    let mut frame_dims = FRAME_DIMENSIONS.write().await;
    *frame_dims = None;

    let mut layout = CURRENT_LAYOUT.write().await;
    *layout = None;
}

pub async fn set_total_traits_to_process(count: u32) {
    let current_count = TOTAL_TRAITS_TO_PROCESS.load(Ordering::SeqCst);
    if current_count == count {
        return;
    }

    if count > 0 {
        reset_animation_state().await;
        TOTAL_TRAITS_TO_PROCESS.store(count, Ordering::SeqCst);
    }
}

#[inline(always)]
pub unsafe fn fast_copy(src: *const u8, dst: *mut u8, len: usize) {
    std::ptr::copy_nonoverlapping(src, dst, len);
}
