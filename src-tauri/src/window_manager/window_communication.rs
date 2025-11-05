use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, Runtime};

#[derive(Debug, Serialize, Deserialize)]
pub struct EmitPayload {
    pub window: String,
    pub event: String,
    pub payload: serde_json::Value,
}

#[tauri::command]
pub async fn emit_to_window<R: Runtime>(
    app: tauri::AppHandle<R>,
    window: String,
    event: String,
    payload: serde_json::Value,
) -> Result<(), String> {
    if let Some(target_window) = app.get_webview_window(&window) {
        target_window
            .emit(&event, &payload)
            .map_err(|e| format!("Error emitting event: {}", e))?;
        Ok(())
    } else {
        Err(format!("Window '{}' does not exist", window))
    }
}
