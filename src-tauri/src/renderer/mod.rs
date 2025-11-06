use crate::effects::core::gpu::GpuEffectManager;
use serde_json::json;

#[tauri::command]
pub async fn check_gpu_availability() -> Result<serde_json::Value, String> {
    match GpuEffectManager::new().await {
        Ok(_manager) => Ok(json!({
            "available": true,
            "error": null
        })),
        Err(e) => Ok(json!({
            "available": false,
            "error": e.to_string()
        })),
    }
}
