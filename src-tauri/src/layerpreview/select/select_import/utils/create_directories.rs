use anyhow::Result;
use std::{fs::create_dir_all, path::PathBuf};

pub async fn setup_directories(dirs: &[&PathBuf]) -> Result<(), String> {
    for dir in dirs {
        if !dir.exists() {
            create_dir_all(dir)
                .map_err(|e| format!("Cannot create directory {}: {}", dir.display(), e))?;
        }
    }
    Ok(())
}
