use serde_json::Value;
use std::{fs, sync::mpsc};
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};

#[tauri::command]
pub async fn save_single_json_file_dialog(
    app: AppHandle,
    data: Value,
    default_file_name: Option<String>,
) -> Result<serde_json::Value, String> {
    let cloned_data = data.clone();

    let mut dialog = app.dialog().file().add_filter("JSON Files", &["json"]);

    if let Some(file_name) = default_file_name {
        dialog = dialog.set_file_name(&file_name);
    }

    let (tx, rx) = mpsc::channel();

    dialog.save_file(move |file_path: Option<FilePath>| {
        let result = if let Some(path) = file_path {
            match fs::write(
                path.to_string(),
                serde_json::to_string_pretty(&cloned_data).unwrap_or_default(),
            ) {
                Ok(_) => Ok(serde_json::json!({
                    "success": true,
                    "filePath": path.to_string().to_owned()
                })),
                Err(error) => Ok(serde_json::json!({
                    "success": false,
                    "error": error.to_string()
                })),
            }
        } else {
            Ok(serde_json::json!({
                "success": false,
                "error": "Save dialog cancelled"
            }))
        };

        tx.send(result).unwrap();
    });

    rx.recv().unwrap()
}
