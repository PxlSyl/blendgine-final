use crate::window_manager::{
    layer_order_zoom_window::close_layer_order_zoom_window,
    layersview_window::close_layersview_window, rules_window::close_rules_window,
    shortcuts_window::close_shortcuts_window, theme_colors_window::close_theme_colors_window,
    zoom_effects_window::close_zoom_effects_window,
};
use tauri::{Manager, Runtime, WebviewWindow};

#[tauri::command]
pub async fn close_window<R: Runtime>(window: WebviewWindow<R>) -> Result<(), String> {
    let app_handle = window.app_handle();

    close_layersview_window(app_handle.clone()).await?;
    close_rules_window(app_handle.clone()).await?;
    close_shortcuts_window(app_handle.clone()).await?;
    close_theme_colors_window(app_handle.clone()).await?;
    close_layer_order_zoom_window(app_handle.clone()).await?;
    close_zoom_effects_window(app_handle.clone()).await?;

    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    window.close().unwrap_or_default();
    Ok(())
}
