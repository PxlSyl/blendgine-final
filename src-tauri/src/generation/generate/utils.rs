use anyhow::Result;
use rayon::prelude::*;
use std::{
    fs::{remove_dir, remove_file},
    path::Path,
};
use tracing;
use walkdir::WalkDir;

pub fn clear_directory(directory: &Path) -> Result<()> {
    if !directory.exists() {
        tracing::info!("Directory does not exist: {}", directory.display());
        return Ok(());
    }

    let entries: Vec<_> = WalkDir::new(directory)
        .into_iter()
        .filter_map(|e| e.ok())
        .collect();

    let files: Vec<_> = entries.iter().filter(|e| e.file_type().is_file()).collect();

    files.par_iter().for_each(|entry| {
        if let Err(e) = remove_file(entry.path()) {
            tracing::warn!("Failed to remove file {}: {}", entry.path().display(), e);
        }
    });

    let dirs: Vec<_> = entries.iter().filter(|e| e.file_type().is_dir()).collect();

    dirs.par_iter().rev().for_each(|entry| {
        if let Err(e) = remove_dir(entry.path()) {
            tracing::warn!(
                "Failed to remove directory {}: {}",
                entry.path().display(),
                e
            );
        }
    });

    Ok(())
}
