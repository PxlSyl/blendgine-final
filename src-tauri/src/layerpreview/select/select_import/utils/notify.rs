use anyhow::Result;
use serde::Serialize;
use tauri::Emitter;
use tracing;

#[derive(Debug, Serialize, Clone)]
struct ProcessingEvent {
    status: String,
}

pub async fn notify_processing_started(app_handle: &tauri::AppHandle) -> Result<(), String> {
    tracing::info!("Notifying processing started event");

    app_handle
        .emit(
            "folder_processing_started",
            ProcessingEvent {
                status: "started".to_string(),
            },
        )
        .map_err(|e| {
            let msg = format!("Failed to emit processing started event: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

    tracing::info!("Processing started event emitted successfully");
    Ok(())
}
