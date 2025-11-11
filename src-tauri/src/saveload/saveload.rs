use std::{
    fs,
    io::{Read, Write},
    result::Result::Ok,
    sync::{Arc, Mutex},
};

use dirs;
use serde_json::Value;
use tauri_plugin_dialog::{DialogExt, FilePath, MessageDialogButtons};
use zip::{read::ZipArchive, write::FileOptions, ZipWriter};

use tauri::AppHandle;
use tokio::sync::oneshot;

use crate::filesystem::temp_dir::get_secure_working_dir;

#[tauri::command]
pub async fn save_project_config(
    app: AppHandle,
    config: Value,
) -> Result<serde_json::Value, String> {
    let serializable_config = config.clone();

    let default_path = dirs::document_dir()
        .ok_or_else(|| "Could not get documents directory".to_string())?
        .join("nft-project-config.bdg");

    // Ask user the save mode
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .message("Do you want to save the project with assets (recommended for portability)?")
        .title("Save Mode")
        .buttons(MessageDialogButtons::YesNo)
        .show(move |result| {
            let _ = tx.send(result);
        });

    // Wait until user answers
    let full_save = rx.await.unwrap_or(false);

    let dialog = app
        .dialog()
        .file()
        .add_filter("BDG Files", &["bdg"])
        .set_file_name(default_path.to_str().unwrap_or_default())
        .set_title("Save Project Configuration");

    let (save_tx, save_rx) = oneshot::channel();

    dialog.save_file(move |file_path: Option<FilePath>| {
        if let Some(path) = file_path {
            if let Some(path) = path.as_path() {
                let config_to_save = serializable_config.clone();
                if full_save {
                    // Add full save logic here if needed
                    // config_to_save["assets"] = ...;
                }

                // Create a temporary file for the JSON
                let temp_json_path = match get_secure_working_dir() {
                    Ok(working_dir) => working_dir.join("config.json"),
                    Err(e) => {
                        let _ = save_tx.send(Ok(serde_json::json!({
                            "success": false,
                            "error": e.to_string()
                        })));
                        return;
                    }
                };

                // Write JSON to temporary file
                if let Err(error) = fs::write(
                    &temp_json_path,
                    serde_json::to_string_pretty(&config_to_save).unwrap_or_default(),
                ) {
                    let _ = save_tx.send(Ok(serde_json::json!({
                        "success": false,
                        "error": error.to_string()
                    })));
                    return;
                }

                // Create the zip file
                let file = match fs::File::create(path) {
                    Ok(file) => file,
                    Err(error) => {
                        let _ = save_tx.send(Ok(serde_json::json!({
                            "success": false,
                            "error": error.to_string()
                        })));
                        return;
                    }
                };

                let mut zip = ZipWriter::new(file);
                let options: FileOptions<'_, ()> = FileOptions::default();

                // Add the JSON file to the zip
                if let Err(error) = zip.start_file("config.json", options) {
                    let _ = save_tx.send(Ok(serde_json::json!({
                        "success": false,
                        "error": error.to_string()
                    })));
                    return;
                }

                if let Err(error) = zip.write_all(&fs::read(&temp_json_path).unwrap_or_default()) {
                    let _ = save_tx.send(Ok(serde_json::json!({
                        "success": false,
                        "error": error.to_string()
                    })));
                    return;
                }

                // Finalize the zip file
                if let Err(error) = zip.finish() {
                    let _ = save_tx.send(Ok(serde_json::json!({
                        "success": false,
                        "error": error.to_string()
                    })));
                    return;
                }

                // Clean up the temporary file
                let _ = fs::remove_file(&temp_json_path);

                let _ = save_tx.send(Ok(serde_json::json!({
                    "success": true,
                    "message": "Configuration saved successfully",
                    "full_save": full_save
                })));
            }
        }
    });

    save_rx
        .await
        .unwrap_or(Ok(serde_json::json!({
            "success": false,
            "message": "Save operation canceled by user"
        })))
}

#[tauri::command]
pub async fn load_project_config(app: AppHandle) -> Result<serde_json::Value, String> {
    let default_path =
        dirs::document_dir().ok_or_else(|| "Could not get documents directory".to_string())?;

    let load_result = Arc::new(Mutex::new(Ok(serde_json::json!({
        "success": false,
        "message": "Load operation canceled by user"
    }))));

    let load_result_clone = load_result.clone();

    app.dialog()
        .file()
        .set_title("Load Project Configuration")
        .set_directory(default_path)
        .add_filter("BDG Files", &["bdg"])
        .pick_file(move |file_path: Option<FilePath>| {
            if let Some(path) = file_path {
                if let Some(path) = path.as_path() {
                    // Try to read as a zip file first
                    if let Ok(file) = fs::File::open(path) {
                        if let Ok(mut archive) = ZipArchive::new(file) {
                            if let Ok(mut file) = archive.by_name("config.json") {
                                let mut contents = String::new();
                                if file.read_to_string(&mut contents).is_ok() {
                                    match serde_json::from_str::<Value>(&contents) {
                                        Ok(parsed_config) => {
                                            let mut result = load_result_clone.lock().unwrap();
                                            *result = Ok(serde_json::json!({
                                                "success": true,
                                                "config": parsed_config
                                            }));
                                        }
                                        Err(error) => {
                                            let mut result = load_result_clone.lock().unwrap();
                                            *result = Ok(serde_json::json!({
                                                "success": false,
                                                "error": error.to_string()
                                            }));
                                        }
                                    }
                                    return;
                                }
                            }
                        }
                    }

                    // If zip reading fails, try reading as a regular JSON file
                    match fs::read_to_string(path) {
                        Ok(config_data) => match serde_json::from_str::<Value>(&config_data) {
                            Ok(parsed_config) => {
                                let mut result = load_result_clone.lock().unwrap();
                                *result = Ok(serde_json::json!({
                                    "success": true,
                                    "config": parsed_config
                                }));
                            }
                            Err(error) => {
                                let mut result = load_result_clone.lock().unwrap();
                                *result = Ok(serde_json::json!({
                                    "success": false,
                                    "error": error.to_string()
                                }));
                            }
                        },
                        Err(error) => {
                            let mut result = load_result_clone.lock().unwrap();
                            *result = Ok(serde_json::json!({
                                "success": false,
                                "error": error.to_string()
                            }));
                        }
                    }
                }
            }
        });

    Arc::try_unwrap(load_result).unwrap().into_inner().unwrap()
}
