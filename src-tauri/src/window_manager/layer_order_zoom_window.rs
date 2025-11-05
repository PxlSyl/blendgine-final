use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::{sync::Mutex, thread, time::Duration};
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Layer {
    pub id: String,
    pub name: String,
    pub image: String,
    pub order: i32,
    pub visible: bool,
    #[serde(rename = "isSpritesheet")]
    pub is_spritesheet: Option<bool>,
    #[serde(rename = "frameWidth")]
    pub frame_width: Option<i32>,
    #[serde(rename = "frameHeight")]
    pub frame_height: Option<i32>,
    #[serde(rename = "totalFrames")]
    pub total_frames: Option<i32>,
    #[serde(rename = "spritesheetCols")]
    pub spritesheet_cols: Option<i32>,
    #[serde(rename = "spritesheetRows")]
    pub spritesheet_rows: Option<i32>,
    pub opacity: Option<f32>,
    #[serde(rename = "blendMode")]
    pub blend_mode: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct LayerOrderZoomWindowOptions {
    pub layers: Vec<Layer>,
    #[serde(rename = "isAnimatedCollection")]
    pub is_animated_collection: bool,
    pub fps: i32,
    #[serde(rename = "maxFrames")]
    pub max_frames: i32,
}

static LAYER_ORDER_ZOOM_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_layer_order_zoom_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    options: LayerOrderZoomWindowOptions,
) -> Result<(), String> {
    let layer_order_zoom_window_id = LAYER_ORDER_ZOOM_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = layer_order_zoom_window_id.lock() {
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
                    .emit("layer-order-zoom-theme-init", dark_mode)
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("layer-order-zoom-init", &options)
                    .map_err(|e| e.to_string())?;

                return Ok(());
            }
        }
    }

    let window_id = "layer-order-zoom-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("layer-order-zoom.html".into()),
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

    let layer_order_zoom_window = builder.build().map_err(|e| e.to_string())?;

    layer_order_zoom_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    thread::sleep(Duration::from_millis(500));

    layer_order_zoom_window
        .emit("layer-order-zoom-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    layer_order_zoom_window
        .emit("layer-order-zoom-init", &options)
        .map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = layer_order_zoom_window_id.lock() {
        *mutex = Some("layer-order-zoom-window".to_string());
    }

    let _app_handle_clone = app_handle.clone();
    layer_order_zoom_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                main_window
                    .emit("layer-order-zoom-window-closed", ())
                    .unwrap_or_default();
            }

            if let Ok(mut mutex) = layer_order_zoom_window_id.lock() {
                *mutex = None;
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn close_layer_order_zoom_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let layer_order_zoom_window_id = LAYER_ORDER_ZOOM_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = layer_order_zoom_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn is_layer_order_zoom_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let layer_order_zoom_window_id = LAYER_ORDER_ZOOM_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = layer_order_zoom_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if app_handle.get_webview_window(window_id).is_some() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}
