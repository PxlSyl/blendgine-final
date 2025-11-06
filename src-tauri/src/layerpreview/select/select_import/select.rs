use crate::types::{ImageDimensions, ProjectSetupState, SpritesheetLayout};
use crate::{
    filesystem::{
        constants::StorageFiles,
        folderhash::{calculate_folder_hash, get_previous_hash, save_folder_hash},
        persist::{load_projectsetup_state, save_storage_command},
    },
    layerpreview::select::select_import::{
        get_layers_content::get_layers_content,
        utils::{
            base_dimensions::get_base_dimensions, config_files::setup_config_files,
            create_directories::setup_directories, error_dialog::show_error_dialog,
            notify::notify_processing_started, process_animated::process_animated_layers,
            structs::LayerContent,
        },
    },
};
use anyhow::Result;
use crossbeam::channel::bounded;
use serde::Serialize;
use std::{fs::metadata, path::PathBuf};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tracing;

#[derive(Debug, Serialize)]
pub struct InitialFolderData {
    pub folder_path: String,
    pub layers: Vec<LayerContent>,
    pub base_dimensions: ImageDimensions,
    pub is_animated_collection: bool,
    pub frame_count: Option<u32>,
    pub spritesheet_layout: Option<SpritesheetLayout>,
}

#[tauri::command]
pub async fn select_and_load_folder_data(
    app_handle: tauri::AppHandle,
) -> Result<Option<InitialFolderData>, String> {
    tracing::info!("Starting folder selection and loading process");

    let folder_path = match select_folder(app_handle.clone()).await? {
        Some(path) => path,
        _none => return Ok(None),
    };

    if let Err(e) = metadata(&folder_path) {
        let msg = format!("Cannot access the selected folder: {}", e);
        tracing::error!("{}", msg);
        return Err(msg);
    }

    let current_hash = calculate_folder_hash(folder_path.clone())
        .await
        .map_err(|e| {
            let msg = format!("Failed to calculate folder hash: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

    let previous_hash = get_previous_hash(folder_path.clone(), app_handle.state::<StorageFiles>())
        .await
        .map_err(|e| {
            let msg = format!("Failed to get previous hash: {}", e);
            tracing::error!("{}", msg);
            msg
        })?;

    if let Some(hash) = previous_hash {
        if hash == current_hash {
            tracing::info!("Same folder selected, hash unchanged");
            let (tx, rx) = bounded(1);

            app_handle.dialog()
                .message("You have selected the same folder that is already loaded. Please select a different folder to continue.")
                .title("Same Folder Selected")
                .buttons(tauri_plugin_dialog::MessageDialogButtons::Ok)
                .show(move |result| {
                    let _ = tx.send(result);
                });

            rx.recv().unwrap_or(false);
            return Ok(None);
        }
    }

    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let config_dir = app_data_dir.join("config");

    tracing::info!("Setting up directories and config files");
    setup_directories(&[&app_data_dir, &config_dir]).await?;

    setup_config_files(&config_dir)?;

    save_folder_hash(
        folder_path.clone(),
        current_hash,
        app_handle.state::<StorageFiles>(),
    )
    .await
    .map_err(|e| {
        let msg = format!("Failed to save folder hash: {}", e);
        tracing::error!("{}", msg);
        msg
    })?;

    tracing::info!("Notifying processing started and getting layers content");
    notify_processing_started(&app_handle).await?;

    let layers = get_layers_content(&folder_path).await?;

    tracing::info!("Getting base dimensions and processing animated layers");
    let base_dimensions = get_base_dimensions(&layers)?;

    let (is_animated_collection, frame_count, spritesheet_layout) =
        process_animated_layers(&folder_path, &layers, &app_handle).await?;

    tracing::info!(
        "Folder data loaded successfully: {} layers, animated={}",
        layers.len(),
        is_animated_collection
    );

    Ok(Some(InitialFolderData {
        folder_path,
        layers,
        base_dimensions,
        is_animated_collection,
        frame_count,
        spritesheet_layout,
    }))
}

#[tauri::command]
pub async fn select_folder(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    loop {
        let file_path = app_handle.dialog().file().blocking_pick_folder();

        match file_path {
            Some(path) => {
                let path_string = path.to_string();
                let path_str = path_string.clone();
                let path_buf = PathBuf::from(&path_str);

                if !path_buf.exists() || !path_buf.is_dir() {
                    show_error_dialog(
                        &app_handle,
                        "Invalid Selection",
                        "The selected path is not a valid directory. Please select a folder that contains layer subdirectories.",
                    )
                    .await?;
                    continue;
                }

                match get_layers_content(&path_str).await {
                    Ok(layers) => {
                        if layers.is_empty() {
                            show_error_dialog(
                                &app_handle,
                                "No Valid Media Found",
                                "Selected folder does not contain any valid layer directories with supported formats (.png, .webp, .gif, .mp4, .webm, .mov, .avi, .mkv)",
                            )
                            .await?;
                            continue;
                        }

                        let mut project_setup = match load_projectsetup_state(app_handle.state())
                            .await
                        {
                            Ok(Some(setup)) => setup,
                            Ok(_none) => ProjectSetupState::default(),
                            Err(e) => return Err(format!("Failed to load project setup: {}", e)),
                        };

                        project_setup.selected_folder = Some(path_str.clone());
                        save_storage_command(
                            app_handle.clone(),
                            "project_setup.json",
                            &project_setup,
                        )
                        .await
                        .map_err(|e| format!("Failed to save project setup: {}", e))?;

                        return Ok(Some(path_str));
                    }
                    Err(e) => return Err(format!("Failed to read layers: {}", e)),
                }
            }
            _none => return Ok(None),
        }
    }
}
