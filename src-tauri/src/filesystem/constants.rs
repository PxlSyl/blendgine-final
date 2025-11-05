use std::{fs, path::PathBuf};
use tauri::Manager;

pub struct StorageFiles {
    pub project_setup: PathBuf,
    pub ordered_layers: PathBuf,
    pub rarity_config: PathBuf,
    pub incompatibility: PathBuf,
    pub forced_combination: PathBuf,
    pub filter_config: PathBuf,
    pub image_setup: PathBuf,
    pub other_parameters: PathBuf,
    pub preferences: PathBuf,
    pub global_rarity: PathBuf,
}

impl StorageFiles {
    pub fn new(app_handle: &tauri::AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;

        let config_dir = app_data_dir.join("config");

        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        let storage_files = StorageFiles {
            project_setup: config_dir.join("project_setup.json"),
            ordered_layers: config_dir.join("ordered_layers.json"),
            rarity_config: config_dir.join("rarity_config.json"),
            incompatibility: config_dir.join("incompatibility.json"),
            forced_combination: config_dir.join("forced_combination.json"),
            filter_config: config_dir.join("filter_config.json"),
            image_setup: config_dir.join("image_setup.json"),
            other_parameters: config_dir.join("other_parameters.json"),
            preferences: config_dir.join("preferences.json"),
            global_rarity: config_dir.join("global_rarity.json"),
        };

        Ok(storage_files)
    }

    pub fn get_config_dir(&self) -> PathBuf {
        let dir = self.project_setup.parent().unwrap().to_path_buf();
        dir
    }

    pub fn check_files_exist(&self) -> bool {
        let exists = self.project_setup.exists()
            && self.ordered_layers.exists()
            && self.rarity_config.exists()
            && self.incompatibility.exists()
            && self.forced_combination.exists()
            && self.filter_config.exists()
            && self.image_setup.exists()
            && self.other_parameters.exists()
            && self.preferences.exists()
            && self.global_rarity.exists();

        exists
    }

    pub fn get_path_for_filename(&self, filename: &str) -> Option<&PathBuf> {
        match filename {
            "project_setup.json" => Some(&self.project_setup),
            "ordered_layers.json" => Some(&self.ordered_layers),
            "rarity_config.json" => Some(&self.rarity_config),
            "incompatibility.json" => Some(&self.incompatibility),
            "forced_combination.json" => Some(&self.forced_combination),
            "filter_config.json" => Some(&self.filter_config),
            "image_setup.json" => Some(&self.image_setup),
            "other_parameters.json" => Some(&self.other_parameters),
            "preferences.json" => Some(&self.preferences),
            "global_rarity.json" => Some(&self.global_rarity),
            _ => None,
        }
    }
}

impl Default for StorageFiles {
    fn default() -> Self {
        Self {
            project_setup: "project_setup.json".to_string().into(),
            ordered_layers: "ordered_layers.json".to_string().into(),
            rarity_config: "rarity_config.json".to_string().into(),
            incompatibility: "incompatibility.json".to_string().into(),
            forced_combination: "forced_combination.json".to_string().into(),
            filter_config: "filter_config.json".to_string().into(),
            image_setup: "image_setup.json".to_string().into(),
            other_parameters: "other_parameters.json".to_string().into(),
            preferences: "preferences.json".to_string().into(),
            global_rarity: "global_rarity.json".to_string().into(),
        }
    }
}
