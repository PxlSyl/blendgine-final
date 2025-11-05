use tauri::{Manager, Runtime};

pub fn get_available_screens<R: Runtime>(
    app_handle: &tauri::AppHandle<R>,
) -> Result<Vec<tauri::window::Monitor>, String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        main_window.available_monitors().map_err(|e| e.to_string())
    } else {
        Err("Main window not found".to_string())
    }
}

pub fn get_secondary_screen<R: Runtime>(
    app_handle: &tauri::AppHandle<R>,
) -> Result<Option<tauri::window::Monitor>, String> {
    let monitors = get_available_screens(app_handle)?;
    let primary_monitor = if let Some(main_window) = app_handle.get_webview_window("main") {
        main_window.primary_monitor().map_err(|e| e.to_string())?
    } else {
        None
    };

    for monitor in &monitors {
        if let Some(primary) = &primary_monitor {
            if monitor.name() != primary.name() {
                return Ok(Some(monitor.clone()));
            }
        } else {
            if monitors.len() > 1 {
                return Ok(Some(monitor.clone()));
            }
        }
    }

    Ok(None)
}

pub fn calculate_optimal_window_size(monitor: &tauri::window::Monitor) -> (f64, f64) {
    let size = monitor.size();
    let width = size.width as f64 * 0.8;
    let height = size.height as f64 * 0.8;
    (width, height)
}

pub fn calculate_center_position(
    monitor: &tauri::window::Monitor,
    window_width: f64,
    window_height: f64,
) -> (f64, f64) {
    let position = monitor.position();
    let size = monitor.size();
    let center_x = position.x as f64 + (size.width as f64 - window_width) / 2.0;
    let center_y = position.y as f64 + (size.height as f64 - window_height) / 2.0;
    (center_x, center_y)
}

pub fn get_secondary_screen_config<R: Runtime>(
    app_handle: &tauri::AppHandle<R>,
) -> Option<(f64, f64, f64, f64)> {
    match get_secondary_screen(app_handle) {
        Ok(Some(secondary_monitor)) => {
            let (width, height) = calculate_optimal_window_size(&secondary_monitor);
            let (x, y) = calculate_center_position(&secondary_monitor, width, height);
            Some((x, y, width, height))
        }
        _ => None,
    }
}
