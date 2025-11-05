use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

use crate::filesystem::{constants::StorageFiles, storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;

#[derive(Clone, Serialize, Deserialize)]
pub struct LayersviewWindowOptions {
    pub layer_name: String,
    pub trait_name: String,
}

static LAYERSVIEW_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_layersview_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    options: LayersviewWindowOptions,
) -> Result<(), String> {
    let layersview_window_id = LAYERSVIEW_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = storage::load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = layersview_window_id.lock() {
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
                    .emit("layersview-theme-init", dark_mode)
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("layersview-data-changed", options.clone())
                    .map_err(|e| e.to_string())?;

                let existing_window_clone = existing_window.clone();
                let dark_mode_clone = dark_mode;
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(300));

                    let _ = existing_window_clone.set_theme(if dark_mode_clone {
                        Some(Theme::Dark)
                    } else {
                        Some(Theme::Light)
                    });
                });

                return Ok(());
            }
        }
    }

    let window_id = "layersview-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("layersview.html".into()),
    )
    .title("Layers Viewer")
    .min_inner_size(320.0, 568.0)
    .resizable(true)
    .always_on_top(true)
    .theme(theme.clone());

    if let Some((x, y, width, height)) = screen_config {
        builder = builder.inner_size(width, height).position(x, y);
    } else {
        builder = builder.inner_size(800.0, 600.0);
    }

    let layersview_window = builder.build().map_err(|e| e.to_string())?;

    layersview_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    layersview_window
        .emit("layersview-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    layersview_window
        .emit("layersview-init", options.clone())
        .map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = layersview_window_id.lock() {
        *mutex = Some("layersview-window".to_string());
    }

    let _app_handle_clone = app_handle.clone();
    layersview_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                main_window
                    .emit("layersview-window-closed", ())
                    .unwrap_or_default();
            }

            if let Ok(mut mutex) = layersview_window_id.lock() {
                *mutex = None;
            }
        }
    });

    let layersview_window_clone1 = layersview_window.clone();
    let theme_clone1 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        let _ = layersview_window_clone1.set_theme(theme_clone1);
    });

    let layersview_window_clone2 = layersview_window.clone();
    let theme_clone2 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(600));
        let _ = layersview_window_clone2.set_theme(theme_clone2);
    });

    Ok(())
}

#[tauri::command]
pub async fn close_layersview_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let layersview_window_id = LAYERSVIEW_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = layersview_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn is_layersview_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let layersview_window_id = LAYERSVIEW_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = layersview_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if app_handle.get_webview_window(window_id).is_some() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}
