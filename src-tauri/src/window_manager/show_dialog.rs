use serde::{Deserialize, Serialize};
use tauri::Window;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DialogOptions {
    pub title: String,
    pub message: String,
    pub dialog_type: String,
}

#[tauri::command]
pub async fn show_dialog(window: Window, options: DialogOptions) -> Result<(), String> {
    let kind = match options.dialog_type.as_str() {
        "warning" => MessageDialogKind::Warning,
        "error" => MessageDialogKind::Error,
        "info" => MessageDialogKind::Info,
        _ => MessageDialogKind::Info,
    };

    window
        .dialog()
        .message(&options.message)
        .title(&options.title)
        .kind(kind)
        .buttons(MessageDialogButtons::Ok)
        .show(|_| {});
    Ok(())
}
