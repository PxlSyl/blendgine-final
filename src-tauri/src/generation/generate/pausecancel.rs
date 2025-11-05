use std::{
    path::PathBuf,
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};

use anyhow::{anyhow, Result};
use once_cell::sync::Lazy;
use parking_lot::Mutex as ParkingMutex;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::Emitter;
use tracing;

use crate::{
    filesystem::temp_dir::cleanup_old_temp_dirs,
    generation::{
        clean_up_contexts::cleanup_all_global_contexts,
        generate::{
            generate_single::file_watcher,
            task_manager::{cancel_all_tasks, get_current_session_token},
            utils::clear_directory,
        },
    },
};

pub static IS_PAUSED: AtomicBool = AtomicBool::new(false);

pub static WINDOW: Lazy<ParkingMutex<Option<tauri::WebviewWindow>>> =
    Lazy::new(|| ParkingMutex::new(None));

pub static EXPORT_FOLDER_PATH: Lazy<ParkingMutex<Option<PathBuf>>> =
    Lazy::new(|| ParkingMutex::new(None));

pub fn set_export_folder_path(export_folder: PathBuf) {
    *EXPORT_FOLDER_PATH.lock() = Some(export_folder);
}

pub fn clear_export_folder_path() {
    *EXPORT_FOLDER_PATH.lock() = None;
}

#[derive(Serialize, Deserialize, Debug)]
pub enum GenerationStatus {
    Running,
    Paused,
    Cancelled,
    Error(String),
    Complete,
}
#[tauri::command]
pub async fn toggle_generation_pause(is_paused: bool) -> Result<serde_json::Value, String> {
    IS_PAUSED.store(is_paused, Ordering::SeqCst);

    if let Some(window) = WINDOW.lock().as_ref() {
        let _ = window.emit(
            "nft-generation-status",
            json!({
                "status": if is_paused { "paused" } else { "resumed" }
            }),
        );
    }

    Ok(json!({
        "success": true,
        "status": if is_paused { "paused" } else { "resumed" }
    }))
}

#[tauri::command]
pub async fn cancel_nft_generation() -> Result<(), String> {
    if let Some(window) = WINDOW.lock().as_ref() {
        let _ = window.emit(
            "generation-cancelling",
            json!({
                "message": "Generation cancellation started, cleaning up..."
            }),
        );
    } else {
        tracing::warn!("⚠️ [BACKEND] No window found, cannot emit generation-cancelling event");
    }

    reset_all_states_and_cleanup().await;

    if let Some(window) = WINDOW.lock().as_ref() {
        let _ = window.emit(
            "nft-generation-cancelled",
            json!({
                "success": true,
                "message": "Generation cancelled by user"
            }),
        );
    } else {
        tracing::warn!("⚠️ [BACKEND] No window found, cannot emit nft-generation-cancelled event");
    }

    tracing::info!("🔍 [BACKEND] cancel_nft_generation completed successfully");
    Ok(())
}

pub async fn reset_all_states_and_cleanup() {
    if let Err(e) = cancel_all_tasks().await {
        tracing::error!("⚠️ [PAUSE_CANCEL] Failed to cancel save workers: {}", e);
    } else {
        tracing::info!("ℹ️ [PAUSE_CANCEL] All save workers cancelled successfully");
    }

    if let Some(export_folder) = EXPORT_FOLDER_PATH.lock().as_ref() {
        if let Err(e) = clear_directory(export_folder) {
            tracing::error!(
                "⚠️ [PAUSE_CANCEL] Failed to cleanup export folder {}: {}",
                export_folder.display(),
                e
            );
        } else {
            tracing::info!("✅ [PAUSE_CANCEL] Export folder cleaned up successfully");
        }
    }

    let _ = crate::generation::generate::task_manager::create_generation_session();

    IS_PAUSED.store(false, Ordering::SeqCst);

    if let Err(e) = cleanup_old_temp_dirs() {
        tracing::warn!("Warning: Failed to cleanup temp dirs: {}", e);
    }

    clear_export_folder_path();

    tracing::info!("🧹 [PAUSE_CANCEL] Stopping grid file watcher...");
    file_watcher::stop_file_watcher();

    tracing::info!("🧹 [PAUSE_CANCEL] Cleaning up GPU contexts...");
    cleanup_all_global_contexts();
}

#[tauri::command]
pub async fn get_generation_status() -> Result<GenerationStatus, String> {
    if get_current_session_token().await.is_cancelled() {
        return Ok(GenerationStatus::Cancelled);
    }
    if IS_PAUSED.load(Ordering::SeqCst) {
        return Ok(GenerationStatus::Paused);
    }
    Ok(GenerationStatus::Running)
}

pub async fn wait_for_pause() -> Result<()> {
    while IS_PAUSED.load(Ordering::SeqCst) {
        tokio::time::sleep(Duration::from_millis(100)).await;
        check_cancelled().await?;
    }
    Ok(())
}
pub async fn check_cancelled() -> Result<()> {
    if get_current_session_token().await.is_cancelled() {
        Err(anyhow!("Operation cancelled"))
    } else {
        Ok(())
    }
}
