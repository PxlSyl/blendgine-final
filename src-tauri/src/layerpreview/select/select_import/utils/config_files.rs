use crate::filesystem::default_json::get_default_json_content;
use anyhow::Result;
use std::{
    fs::{remove_file, write},
    path::PathBuf,
};
use tracing;

pub fn setup_config_files(config_dir: &PathBuf) -> Result<(), String> {
    tracing::info!(
        "Setting up config files in directory: {}",
        config_dir.display()
    );

    let files = [
        (
            "project_setup.json",
            get_default_json_content("project_setup.json"),
        ),
        (
            "ordered_layers.json",
            get_default_json_content("ordered_layers.json"),
        ),
        (
            "rarity_config.json",
            get_default_json_content("rarity_config.json"),
        ),
        (
            "incompatibility.json",
            get_default_json_content("incompatibility.json"),
        ),
        (
            "forced_combination.json",
            get_default_json_content("forced_combination.json"),
        ),
        (
            "filter_config.json",
            get_default_json_content("filter_config.json"),
        ),
        (
            "image_setup.json",
            get_default_json_content("image_setup.json"),
        ),
        (
            "other_parameters.json",
            get_default_json_content("other_parameters.json"),
        ),
    ];

    for (filename, content) in files.iter() {
        let file_path = config_dir.join(filename);
        let _ = remove_file(&file_path);

        tracing::debug!("Creating config file: {}", filename);

        write(&file_path, content).map_err(|e| {
            let msg = format!("Failed to write {}: {}", filename, e);
            tracing::error!("{}", msg);
            msg
        })?;

        tracing::debug!("Config file created successfully: {}", filename);
    }

    tracing::info!("All config files created successfully");
    Ok(())
}
