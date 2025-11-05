use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{sync::Mutex, thread, time::Duration};

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ZoomEffectsWindowOptions {
    pub file_path: String,
    pub title: String,
}

static ZOOM_EFFECTS_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_zoom_effects_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    options: ZoomEffectsWindowOptions,
) -> Result<(), String> {
    let zoom_effects_window_id = ZOOM_EFFECTS_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = zoom_effects_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(existing_window) = app_handle.get_webview_window(window_id) {
                if existing_window.is_minimized().unwrap_or_default() {
                    existing_window.unminimize().unwrap_or_default();
                }

                existing_window.set_focus().unwrap_or_default();

                existing_window
                    .set_theme(if dark_mode {
                        Some(Theme::Dark)
                    } else {
                        Some(Theme::Light)
                    })
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("zoom-effects-theme-init", dark_mode)
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("zoom-effects-init", &options)
                    .map_err(|e| e.to_string())?;

                return Ok(());
            }
        }
    }

    let window_id = "zoom-effects-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("zoom-effects.html".into()),
    )
    .title("Image Zoom")
    .min_inner_size(320.0, 568.0)
    .resizable(true)
    .always_on_top(true)
    .theme(theme.clone());

    if let Some((x, y, width, height)) = screen_config {
        builder = builder.inner_size(width, height).position(x, y);
    } else {
        builder = builder.inner_size(800.0, 600.0);
    }

    let zoom_effects_window = builder.build().map_err(|e| e.to_string())?;

    zoom_effects_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_millis(500));

    zoom_effects_window
        .emit("zoom-effects-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    zoom_effects_window
        .emit("zoom-effects-init", &options)
        .map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = zoom_effects_window_id.lock() {
        *mutex = Some("zoom-effects-window".to_string());
    }

    let _app_handle_clone = app_handle.clone();
    zoom_effects_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                main_window
                    .emit("zoom-effects-window-closed", ())
                    .unwrap_or_default();
            }

            if let Ok(mut mutex) = zoom_effects_window_id.lock() {
                *mutex = None;
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn close_zoom_effects_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let zoom_effects_window_id = ZOOM_EFFECTS_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = zoom_effects_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn is_zoom_effects_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let zoom_effects_window_id = ZOOM_EFFECTS_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = zoom_effects_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if app_handle.get_webview_window(window_id).is_some() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}
