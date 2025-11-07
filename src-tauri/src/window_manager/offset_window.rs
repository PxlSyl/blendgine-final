use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{sync::Mutex, thread, time::Duration};
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::calculate_center_position;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OffsetWindowOptions {
    pub layer: String,
    pub trait_name: String,
    pub offset_x: i32,
    pub offset_y: i32,
    pub image_url: String,
}

static OFFSET_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();
static OFFSET_DATA: OnceCell<Mutex<Option<OffsetWindowOptions>>> = OnceCell::new();

#[tauri::command]
pub async fn open_offset_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    options: OffsetWindowOptions,
) -> Result<(), String> {
    let offset_window_id = OFFSET_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = offset_window_id.lock() {
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
                    .emit("offset-theme-init", dark_mode)
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("offset-update-data", &options)
                    .map_err(|e| e.to_string())?;

                return Ok(());
            }
        }
    }

    drop(offset_window_id.lock());

    let window_id = "offset-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("offset-window.html".into()),
    )
    .title("Offset Configuration")
    .min_inner_size(400.0, 320.0)
    .max_inner_size(400.0, 320.0)
    .resizable(false)
    .minimizable(true)
    .theme(theme.clone());

    const WINDOW_WIDTH: f64 = 400.0;
    const WINDOW_HEIGHT: f64 = 320.0;

    builder = builder.inner_size(WINDOW_WIDTH, WINDOW_HEIGHT);

    if let Some(main_window) = app_handle.get_webview_window("main") {
        if let Ok(Some(primary_monitor)) = main_window.primary_monitor() {
            let (center_x, center_y) =
                calculate_center_position(&primary_monitor, WINDOW_WIDTH, WINDOW_HEIGHT);
            builder = builder.position(center_x, center_y);
        }
    }

    let window = builder.build().map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = OFFSET_WINDOW.get_or_init(|| Mutex::new(None)).lock() {
        *mutex = Some(window_id.clone());
    }

    if let Ok(mut data_mutex) = OFFSET_DATA.get_or_init(|| Mutex::new(None)).lock() {
        *data_mutex = Some(options.clone());
    }

    let window_id_clone = window_id.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            if let Ok(mut mutex) = OFFSET_WINDOW.get_or_init(|| Mutex::new(None)).lock() {
                if mutex.as_ref() == Some(&window_id_clone) {
                    *mutex = None;
                }
            }
        }
    });

    thread::sleep(Duration::from_millis(100));

    window
        .emit("offset-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    window
        .emit("offset-update-data", &options)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_offset_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    if let Ok(mutex) = OFFSET_WINDOW.get_or_init(|| Mutex::new(None)).lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_offset_data() -> Result<OffsetWindowOptions, String> {
    if let Ok(mutex) = OFFSET_DATA.get_or_init(|| Mutex::new(None)).lock() {
        if let Some(data) = &*mutex {
            return Ok(data.clone());
        }
    }
    Err("No offset data available".to_string())
}
