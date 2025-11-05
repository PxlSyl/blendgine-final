use crate::effects::core::gpu::GpuEffectManager;
use serde_json::json;
use std::sync::RwLock;

static RENDERER_PREFERENCE: RwLock<Option<String>> = RwLock::new(None);

pub fn get_current_renderer_preference() -> String {
    RENDERER_PREFERENCE
        .read()
        .unwrap()
        .clone()
        .unwrap_or_else(|| "gpu".to_string())
}

pub fn set_current_renderer_preference(preference: String) {
    if let Ok(mut pref) = RENDERER_PREFERENCE.write() {
        *pref = Some(preference);
    }
}

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

#[tauri::command]
pub async fn update_renderer_preference(preference: String) -> Result<(), String> {
    set_current_renderer_preference(preference);
    Ok(())
}
