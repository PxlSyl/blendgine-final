use crate::filesystem::{constants::StorageFiles, persist::load_projectsetup_state};
use anyhow::Result;
use tokio::sync::oneshot;
use std::fs::read_dir;
use tauri::State;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn select_export_folder(
    app_handle: tauri::AppHandle,
    storage_files: State<'_, StorageFiles>,
) -> Result<Option<String>, String> {
    let import_folder = match load_projectsetup_state(storage_files).await {
        Ok(Some(state)) => state.selected_folder,
        _ => Some(String::new()),
    };

    loop {
        let file_path = app_handle.dialog().file().blocking_pick_folder();

        if let Some(path) = file_path {
            let path_string = path.to_string();

            if let Some(folder) = &import_folder {
                if !folder.is_empty() && path_string == *folder {
                    let (tx, rx) = oneshot::channel();

                    app_handle
                        .dialog()
                        .message("You cannot select the same folder for import and export. Please select a different folder.")
                        .title("Invalid Export Folder")
                        .buttons(tauri_plugin_dialog::MessageDialogButtons::Ok)
                        .show(move |_| {
                            let _ = tx.send(());
                        });

                    rx.await.unwrap_or_default();
                    continue;
                }
            }

            if let Ok(entries) = read_dir(&path_string) {
                if entries.count() > 0 {
                    let (tx, rx) = oneshot::channel();

                    app_handle
                        .dialog()
                        .message("The selected folder is not empty. Files in this folder may be overwritten. Do you want to continue?")
                        .title("Warning: Non-empty Folder")
                        .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancel)
                        .show(move |result| {
                            let _ = tx.send(result);
                        });

                    if !rx.await.unwrap_or(false) {
                        continue;
                    }
                }
            }

            return Ok(Some(path_string));
        } else {
            return Ok(None);
        }
    }
}
