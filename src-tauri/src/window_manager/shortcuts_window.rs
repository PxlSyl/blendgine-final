use once_cell::sync::OnceCell;
use std::sync::Mutex;
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;

static SHORTCUTS_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_shortcuts_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let shortcuts_window_id = SHORTCUTS_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    if let Ok(mutex) = shortcuts_window_id.lock() {
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
                    .emit("shortcuts-theme-init", dark_mode)
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

    let window_id = "shortcuts-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("shortcuts.html".into()),
    )
    .title("Keyboard Shortcuts")
    .min_inner_size(320.0, 568.0)
    .resizable(true)
    .always_on_top(true)
    .theme(theme.clone());

    if let Some((x, y, width, height)) = screen_config {
        builder = builder.inner_size(width, height).position(x, y);
    } else {
        builder = builder.inner_size(800.0, 600.0);
    }

    let shortcuts_window = builder.build().map_err(|e| e.to_string())?;

    shortcuts_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    shortcuts_window
        .emit("shortcuts-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    if let Ok(mut mutex) = shortcuts_window_id.lock() {
        *mutex = Some("shortcuts-window".to_string());
    }

    let _app_handle_clone = app_handle.clone();
    shortcuts_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                main_window
                    .emit("shortcuts-window-closed", ())
                    .unwrap_or_default();
            }

            if let Ok(mut mutex) = shortcuts_window_id.lock() {
                *mutex = None;
            }
        }
    });

    let shortcuts_window_clone1 = shortcuts_window.clone();
    let theme_clone1 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        let _ = shortcuts_window_clone1.set_theme(theme_clone1);
    });

    let shortcuts_window_clone2 = shortcuts_window.clone();
    let theme_clone2 = theme.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(600));
        let _ = shortcuts_window_clone2.set_theme(theme_clone2);
    });

    Ok(())
}

#[tauri::command]
pub async fn close_shortcuts_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let shortcuts_window_id = SHORTCUTS_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = shortcuts_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn is_shortcuts_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let shortcuts_window_id = SHORTCUTS_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = shortcuts_window_id.lock() {
        if let Some(window_id) = &*mutex {
            if app_handle.get_webview_window(window_id).is_some() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}
