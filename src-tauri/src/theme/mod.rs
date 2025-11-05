use once_cell::sync::Lazy;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

static DARK_MODE: Lazy<Mutex<bool>> = Lazy::new(|| Mutex::new(false));
static THEME_NAME: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new("thelab".to_string()));

#[tauri::command]
pub async fn set_theme(dark_mode: bool, app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Ok(mut state) = DARK_MODE.lock() {
        *state = dark_mode;
    }

    for window in app_handle.windows().values() {
        window
            .set_theme(if dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;

        window
            .emit("theme-changed", dark_mode)
            .map_err(|e| e.to_string())?;
    }

    if let Some(rules_window) = app_handle.get_webview_window("rules-window") {
        rules_window
            .set_theme(if dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;

        rules_window
            .emit("rules-theme-init", dark_mode)
            .map_err(|e| e.to_string())?;
    }

    if let Some(shortcuts_window) = app_handle.get_webview_window("shortcuts-window") {
        shortcuts_window
            .set_theme(if dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;

        shortcuts_window
            .emit("shortcuts-theme-init", dark_mode)
            .map_err(|e| e.to_string())?;
    }

    if let Some(layersview_window) = app_handle.get_webview_window("layersview-window") {
        layersview_window
            .set_theme(if dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;

        layersview_window
            .emit("layersview-theme-init", dark_mode)
            .map_err(|e| e.to_string())?;
    }

    if let Some(layer_order_zoom_window) = app_handle.get_webview_window("layer-order-zoom-window")
    {
        layer_order_zoom_window
            .set_theme(if dark_mode {
                Some(tauri::Theme::Dark)
            } else {
                Some(tauri::Theme::Light)
            })
            .map_err(|e| e.to_string())?;

        layer_order_zoom_window
            .emit("layer-order-zoom-theme-init", dark_mode)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_theme() -> Result<bool, String> {
    if let Ok(state) = DARK_MODE.lock() {
        return Ok(*state);
    }
    Ok(false)
}

#[tauri::command]
pub async fn set_color_theme(
    theme_name: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    if let Ok(mut state) = THEME_NAME.lock() {
        *state = theme_name.clone();
    }

    for window in app_handle.windows().values() {
        window
            .emit("color-theme-changed", theme_name.clone())
            .map_err(|e| e.to_string())?;
    }

    if let Some(rules_window) = app_handle.get_webview_window("rules-window") {
        rules_window
            .emit("color-theme-changed", theme_name.clone())
            .map_err(|e| e.to_string())?;
    }

    if let Some(shortcuts_window) = app_handle.get_webview_window("shortcuts-window") {
        shortcuts_window
            .emit("color-theme-changed", theme_name.clone())
            .map_err(|e| e.to_string())?;
    }

    if let Some(layersview_window) = app_handle.get_webview_window("layersview-window") {
        layersview_window
            .emit("color-theme-changed", theme_name.clone())
            .map_err(|e| e.to_string())?;
    }

    if let Some(layer_order_zoom_window) = app_handle.get_webview_window("layer-order-zoom-window")
    {
        layer_order_zoom_window
            .emit("color-theme-changed", theme_name.clone())
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_color_theme() -> Result<String, String> {
    if let Ok(state) = THEME_NAME.lock() {
        return Ok(state.clone());
    }
    Ok("thelab".to_string())
}

pub fn init_theme() {
    let _ = *DARK_MODE.lock().unwrap();
    let _ = *THEME_NAME.lock().unwrap();
}
