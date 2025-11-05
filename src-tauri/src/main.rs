#![allow(dependency_on_unit_never_type_fallback)]
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Modules internes
mod editmetadata;
mod effects;
mod ffmpeg_wrapper;
mod filesystem;
mod generation;
mod layerpreview;
mod legendaries;
mod renderer;
mod saveload;
mod theme;
mod types;
mod window_manager;

// Bibliothèques externes
use tauri::Manager;
use tracing;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Thème
use theme::{get_color_theme, get_theme, init_theme, set_color_theme, set_theme};

// Gestion des fenêtres
use window_manager::{
    layer_order_zoom_window::{
        close_layer_order_zoom_window, is_layer_order_zoom_window_open,
        open_layer_order_zoom_window,
    },
    layersview_window::{
        close_layersview_window, is_layersview_window_open, open_layersview_window,
    },
    rules_window::{close_rules_window, is_rules_window_open, open_rules_window},
    shortcuts_window::{close_shortcuts_window, is_shortcuts_window_open, open_shortcuts_window},
    show_dialog::show_dialog,
    theme_colors_window::{
        close_theme_colors_window, is_theme_colors_window_open, open_theme_colors_window,
    },
    window_communication::emit_to_window,
    window_manager::*,
    zoom_effects_window::{
        close_zoom_effects_window, is_zoom_effects_window_open, open_zoom_effects_window,
    },
};

// Système de fichiers
use filesystem::{
    constants::StorageFiles, folderhash::*, persist::*, rarity::*, rename::*,
    storage::load_storage, temp_dir::*, utils::*,
};

// Prévisualisation des calques
use layerpreview::{
    select::{
        select_export::select_export_folder,
        select_import::{
            check_animated::check_animated_images,
            get_layer_names::get_layer_image_names,
            select::{select_and_load_folder_data, select_folder},
        },
    },
    traitsandlayers::{
        base_dimensions::get_base_dimensions, image_dimensions::get_image_dimensions,
        image_path::get_layer_image_path, read_layers::read_layers, read_traits::read_traits,
        spritesheet_path::get_spritesheet_image_path,
    },
    validation::validate::validate_and_reload_layers,
};

// Génération
use generation::{
    generate::pausecancel::{
        cancel_nft_generation, get_generation_status, toggle_generation_pause, WINDOW,
    },
    generation_main::*,
};

// Autres fonctionnalités
use editmetadata::editmetadata::*;
use legendaries::legendaries::*;
use renderer::{
    check_gpu_availability, set_current_renderer_preference, update_renderer_preference,
};
use saveload::saveload::*;
use types::Preferences;

use crate::layerpreview::animations::commands::{
    extract_frames, get_spritesheet_metadata, get_spritesheets_path,
};

fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    init_theme();
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tracing::info!("Starting app setup");

            let app_handle = app.handle();
            let setup_handle = app_handle.clone();
            let window_handle = app_handle.clone();

            tauri::async_runtime::spawn(async move {
                if let Err(e) = setup_app(setup_handle).await {
                    tracing::error!("Error during setup: {}", e);
                }
            });

            if let Some(window) = window_handle.get_webview_window("main") {
                let mut global_window = WINDOW.lock();
                *global_window = Some(window.clone());

                let window_clone = window.clone();
                let is_closing = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));

                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        if is_closing.load(std::sync::atomic::Ordering::SeqCst) {
                            return;
                        }

                        api.prevent_close();
                        is_closing.store(true, std::sync::atomic::Ordering::SeqCst);
                        let window_clone = window_clone.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = close_window(window_clone).await {
                                tracing::error!("Error closing windows: {}", e);
                            }
                        });
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window manager commands
            close_window,
            set_theme,
            get_theme,
            set_color_theme,
            get_color_theme,
            // Rules window commands
            open_rules_window,
            close_rules_window,
            is_rules_window_open,
            // Shortcuts window commands
            open_shortcuts_window,
            close_shortcuts_window,
            is_shortcuts_window_open,
            // Theme colors window commands
            open_theme_colors_window,
            close_theme_colors_window,
            is_theme_colors_window_open,
            // Layersview window commands
            open_layersview_window,
            close_layersview_window,
            is_layersview_window_open,
            // Zoom effects window commands
            open_zoom_effects_window,
            close_zoom_effects_window,
            is_zoom_effects_window_open,
            // Layer order zoom window commands
            open_layer_order_zoom_window,
            close_layer_order_zoom_window,
            is_layer_order_zoom_window_open,
            // hash handling
            is_folder_modified,
            calculate_folder_hash,
            get_previous_hash,
            save_folder_hash,
            // Persist commands
            load_preferences,
            save_preferences,
            check_gpu_availability,
            update_renderer_preference,
            save_projectsetup_state,
            load_projectsetup_state,
            load_layer_order_state,
            save_layer_order_state,
            load_rarity_config,
            save_rarity_config,
            load_global_rarity,
            save_global_rarity,
            update_global_rarity_from_config,
            get_rarity_data,
            save_storage_command,
            load_storage_command,
            //
            rename_item,
            is_folder_empty,
            get_image_dimensions,
            validate_rarity_config,
            get_base_dimensions,
            check_folder_exists,
            get_documents_path,
            clean_previews_folder,
            delete_file,
            load_image_setup_state,
            save_image_setup_state,
            load_incompatibility_state,
            save_incompatibility_state,
            load_forced_combination_state,
            save_forced_combination_state,
            ensure_config_folder,
            quit,
            // utilities
            show_dialog,
            // legendaries
            read_folder,
            select_legendary_nfts_folder,
            validate_legendary_nfts_folder,
            mix_legendary_nfts,
            // edit metadata
            save_single_json_file_dialog,
            // save and load
            save_project_config,
            load_project_config,
            // layerpreview
            select_folder,
            select_and_load_folder_data,
            select_export_folder,
            get_layer_image_names,
            get_layer_image_path,
            get_spritesheet_image_path,
            check_animated_images,
            get_spritesheets_path,
            extract_frames,
            validate_and_reload_layers,
            read_layers,
            read_traits,
            // nft generation
            start_nft_generation,
            cancel_nft_generation,
            toggle_generation_pause,
            get_generation_status,
            get_spritesheet_metadata,
            // window communication
            emit_to_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn setup_app(app_handle: tauri::AppHandle) -> anyhow::Result<()> {
    let storage_files = StorageFiles::new(&app_handle)
        .map_err(|e| anyhow::anyhow!("Failed to create storage files: {}", e))?;

    if !storage_files.check_files_exist() {
        let config_dir = storage_files.get_config_dir();
        tokio::fs::create_dir_all(&config_dir)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create config directory: {}", e))?;
    }

    if let Ok(Some(prefs)) = load_storage::<Preferences>(&storage_files.preferences).await {
        let renderer = prefs.renderer.unwrap_or_else(|| "gpu".to_string());
        set_current_renderer_preference(renderer);
    } else {
        set_current_renderer_preference("gpu".to_string());
    }

    app_handle.manage(storage_files);

    if let Err(e) = cleanup_old_temp_dirs() {
        tracing::warn!("Failed to cleanup old temp directories: {}", e);
    }

    Ok(())
}
