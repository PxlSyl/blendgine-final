use anyhow::Result;
use crossbeam::channel::bounded;
use tauri_plugin_dialog::DialogExt;

pub async fn show_error_dialog(
    app_handle: &tauri::AppHandle,
    title: &str,
    message: &str,
) -> Result<(), String> {
    let (tx, rx) = bounded(1);

    app_handle
        .dialog()
        .message(message)
        .title(title)
        .buttons(tauri_plugin_dialog::MessageDialogButtons::Ok)
        .show(move |result| {
            let _ = tx.send(result);
        });

    rx.recv().unwrap_or(false);
    Ok(())
}
