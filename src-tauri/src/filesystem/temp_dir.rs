use anyhow::Result;
use std::{fs, path::PathBuf};
use tracing;

pub fn get_secure_working_dir() -> Result<PathBuf> {
    let app_data_dir = dirs::data_local_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not get local data directory"))?
        .join("Blendgine")
        .join("temp");

    if !app_data_dir.exists() {
        tracing::debug!("[TempDir] Creating working directory: {:?}", app_data_dir);
        fs::create_dir_all(&app_data_dir)?;
    }

    Ok(app_data_dir)
}

pub fn create_secure_temp_dir(prefix: &str) -> Result<PathBuf> {
    let base_dir = get_secure_working_dir()?;
    let temp_dir = base_dir.join(format!(
        "{}_{}",
        prefix,
        chrono::Utc::now().timestamp_millis()
    ));

    if !temp_dir.exists() {
        tracing::debug!("[TempDir] Creating temp directory: {:?}", temp_dir);
        fs::create_dir_all(&temp_dir)?;
    }

    Ok(temp_dir)
}

pub fn cleanup_old_temp_dirs() -> Result<()> {
    let base_dir = get_secure_working_dir()?;
    let cutoff_time = chrono::Utc::now() - chrono::Duration::hours(24);

    tracing::debug!(
        "[TempDir] Cleaning up temp dirs older than: {:?}",
        cutoff_time
    );

    if let Ok(entries) = fs::read_dir(&base_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    if let Ok(metadata) = fs::metadata(&path) {
                        if let Ok(created) = metadata.created() {
                            let created_time: chrono::DateTime<chrono::Utc> =
                                chrono::DateTime::from(created);
                            if created_time < cutoff_time {
                                tracing::debug!("[TempDir] Removing old temp dir: {:?}", path);
                                let _ = fs::remove_dir_all(&path);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}
