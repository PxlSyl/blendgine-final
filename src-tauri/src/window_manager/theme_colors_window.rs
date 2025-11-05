use once_cell::sync::OnceCell;
use std::sync::Mutex;
use tauri::{Emitter, Manager, Runtime, Theme, WebviewUrl, WebviewWindow, WindowEvent};

use crate::filesystem::{constants::StorageFiles, storage::load_storage};
use crate::types::Preferences;
use crate::window_manager::screen_utils::get_secondary_screen_config;

static THEME_COLORS_WINDOW: OnceCell<Mutex<Option<String>>> = OnceCell::new();

#[tauri::command]
pub async fn open_theme_colors_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let theme_colors_window_guard = THEME_COLORS_WINDOW.get_or_init(|| Mutex::new(None));

    let storage_files = app_handle.state::<StorageFiles>();

    let preferences = load_storage::<Preferences>(&storage_files.preferences)
        .await
        .map_err(|e| format!("Failed to load preferences: {}", e))?;

    let dark_mode = preferences.map_or(false, |p| p.dark_mode);

    let existing_window_id = {
        theme_colors_window_guard
            .lock()
            .map_err(|_| "Failed to acquire lock on THEME_COLORS_WINDOW")?
            .clone()
    };

    if let Some(window_id) = existing_window_id {
        if let Some(existing_window) = app_handle.get_webview_window(&window_id) {
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

            if let Ok(current_theme) = crate::theme::get_color_theme().await {
                existing_window
                    .emit("theme-colors-color-theme-init", &current_theme)
                    .map_err(|e| e.to_string())?;
            }

            existing_window
                .emit("theme-colors-theme-init", dark_mode)
                .map_err(|e| e.to_string())?;

            return Ok(());
        } else {
            if let Err(_) = theme_colors_window_guard
                .lock()
                .map_err(|_| "Failed to acquire lock on THEME_COLORS_WINDOW")
                .and_then(|mut mutex| {
                    *mutex = None;
                    Ok(())
                })
            {
                return Err("Failed to clean up THEME_COLORS_WINDOW reference".into());
            }
        }
    }

    let window_id = "theme-colors-window".to_string();

    let theme = if dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    let screen_config = get_secondary_screen_config(&app_handle);

    let mut builder = WebviewWindow::builder(
        &app_handle,
        &window_id,
        WebviewUrl::App("theme-colors.html".into()),
    )
    .title("Theme colors")
    .inner_size(400.0, 500.0)
    .resizable(false)
    .always_on_top(true)
    .theme(theme.clone());

    if let Some((x, y, width, height)) = screen_config {
        builder = builder.inner_size(width, height).position(x, y);
    } else {
        builder = builder.inner_size(400.0, 500.0);
    }

    let theme_colors_window = builder.build().map_err(|e| e.to_string())?;

    theme_colors_window
        .set_theme(theme.clone())
        .map_err(|e| e.to_string())?;

    if let Ok(current_theme) = crate::theme::get_color_theme().await {
        theme_colors_window
            .emit("theme-colors-color-theme-init", &current_theme)
            .map_err(|e| e.to_string())?;

        let theme_colors_window_clone = theme_colors_window.clone();
        let current_theme_for_eval = current_theme.clone();

        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(50));
            let _ = theme_colors_window_clone.eval(&format!(
                "document.documentElement.setAttribute('data-theme', '{}');",
                current_theme_for_eval
            ));
        });
    }

    theme_colors_window
        .emit("theme-colors-theme-init", dark_mode)
        .map_err(|e| e.to_string())?;

    theme_colors_window_guard
        .lock()
        .map_err(|_| "Failed to acquire lock on THEME_COLORS_WINDOW")?
        .replace(window_id.clone());

    let app_handle_clone = app_handle.clone();
    theme_colors_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
            if let Some(main_window) = app_handle_clone.get_webview_window("main") {
                main_window
                    .emit("theme-colors-window-closed", ())
                    .unwrap_or_default();
            }

            if let Some(guard) = THEME_COLORS_WINDOW.get() {
                let _ = guard.lock().map(|mut mutex| *mutex = None);
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn close_theme_colors_window<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<(), String> {
    let theme_colors_window_guard = THEME_COLORS_WINDOW.get_or_init(|| Mutex::new(None));

    if let Ok(mutex) = theme_colors_window_guard.lock() {
        if let Some(window_id) = &*mutex {
            if let Some(window) = app_handle.get_webview_window(window_id) {
                window.close().unwrap_or_default();
            }
        }
    } else {
        return Err("Failed to acquire lock on THEME_COLORS_WINDOW".into());
    }

    Ok(())
}

#[tauri::command]
pub async fn is_theme_colors_window_open<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
) -> Result<bool, String> {
    let theme_colors_window_guard = THEME_COLORS_WINDOW.get_or_init(|| Mutex::new(None));

    match theme_colors_window_guard.lock() {
        Ok(mutex) => {
            if let Some(window_id) = &*mutex {
                Ok(app_handle.get_webview_window(window_id).is_some())
            } else {
                Ok(false)
            }
        }
        Err(_) => Err("Failed to acquire lock on THEME_COLORS_WINDOW".into()),
    }
}
