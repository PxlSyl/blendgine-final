use anyhow::Result;
use tokio::sync::oneshot;
use tauri_plugin_dialog::DialogExt;

pub async fn show_error_dialog(
    app_handle: &tauri::AppHandle,
    title: &str,
    message: &str,
) -> Result<(), String> {
    let (tx, rx) = oneshot::channel();

    app_handle
        .dialog()
        .message(message)
        .title(title)
        .buttons(tauri_plugin_dialog::MessageDialogButtons::Ok)
        .show(move |result| {
            let _ = tx.send(result);
        });

    rx.await.unwrap_or(false);
    Ok(())
}
