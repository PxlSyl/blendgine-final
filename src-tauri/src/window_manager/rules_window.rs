use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

#[derive(Clone, Serialize, Deserialize)]
pub struct RulesWindowOptions {
    pub mode: String,
}

static RULES_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_rules_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    options: RulesWindowOptions,
) -> Result<(), String> {
    let rules_window_id = RULES_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = rules_window_id.lock() {
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
                    .emit("rules-theme-init", dark_mode)
                    .map_err(|e| e.to_string())?;

                existing_window
                    .emit("rules-mode-changed", options.mode.clone())
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

    let window_id = "rules-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    // Get secondary screen configuration if available
    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("rules.html".into()),
    )
    .title("Layers rules")
    .min_inner_size(320.0, 568.0)
    .resizable(true)
    .always_on_top(true)
    .theme(theme.clone());

    // Configure window size and position based on available screens
    if let Some((x, y, width, height)) = screen_config {
        builder = builder.inner_size(width, height).position(x, y);
    } else {
        // Fallback to default size if no secondary screen
        builder = builder.inner_size(800.0, 600.0);
    }

    let rules_window = builder.build().map_err(|e| e.to_string())?;

    rules_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    rules_window
        .emit("rules-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    rules_window
        .emit("rules-init", options.mode.clone())
        .map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = rules_window_id.lock() {
        *mutex = Some("rules-window".to_string());
    }

    let _app_handle_clone = app_handle.clone();
    rules_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                main_window
                    .emit("rules-window-closed", ())
                    .unwrap_or_default();
            }

            if let Ok(mut mutex) = rules_window_id.lock() {
                *mutex = None;
            }
        }
    });

    let rules_window_clone1 = rules_window.clone();
    let theme_clone1 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        let _ = rules_window_clone1.set_theme(theme_clone1);
    });

    let rules_window_clone2 = rules_window.clone();
    let theme_clone2 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(600));
        let _ = rules_window_clone2.set_theme(theme_clone2);
    });

    Ok(())
}

#[tauri::command]
pub async fn close_rules_window<R: Runtime>(app_handle: tauri::AppHandle<R>) -> Result<(), String> {
    let rules_window_id = RULES_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = rules_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn is_rules_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let rules_window_id = RULES_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = rules_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if app_handle.get_webview_window(window_id).is_some() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}
