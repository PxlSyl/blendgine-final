use anyhow::Result;
use std::{
    collections::VecDeque,
    fs::{read_dir, File},
    io::Read,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread::{sleep, spawn},
    time::{Duration, Instant},
};
use tauri::{Emitter, Window};
use tracing;
use walkdir::WalkDir;

static WATCHER_RUNNING: AtomicBool = AtomicBool::new(false);

fn is_file_stable(file_path: &Path) -> bool {
    if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
        if name.contains(".lock") || name.contains(".tmp") || name.contains(".part") {
            return false;
        }
    }

    let file = match File::open(file_path) {
        Ok(f) => f,
        Err(_) => return false,
    };
    let size = match file.metadata() {
        Ok(m) => m.len(),
        Err(_) => return false,
    };
    if size == 0 {
        return false;
    }

    sleep(Duration::from_millis(50));

    let mut file2 = match File::open(file_path) {
        Ok(f) => f,
        Err(_) => return false,
    };
    let size2 = match file2.metadata() {
        Ok(m) => m.len(),
        Err(_) => return false,
    };
    if size != size2 {
        return false;
    }

    let mut buffer = Vec::with_capacity(size as usize);
    match file2.read_to_end(&mut buffer) {
        Ok(_) => buffer.len() == size as usize,
        Err(_) => false,
    }
}

pub fn start_file_watcher(images_path: PathBuf, window: Window) -> Result<()> {
    if WATCHER_RUNNING.load(Ordering::Relaxed) {
        tracing::info!("File watcher already running, skipping start");
        return Ok(());
    }

    tracing::info!(
        "Starting file watcher for directory: {}",
        images_path.display()
    );
    WATCHER_RUNNING.store(true, Ordering::Relaxed);
    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_clone = stop_flag.clone();

    spawn(move || {
        let mut processed: VecDeque<String> = VecDeque::new();
        let mut last_activity = Instant::now();
        let mut last_file_count = 0;

        loop {
            if stop_clone.load(Ordering::Relaxed) {
                tracing::info!("File watcher: Stop signal received, exiting");
                break;
            }

            if images_path.exists() {
                let current_file_count = match read_dir(&images_path) {
                    Ok(entries) => entries.count(),
                    Err(_) => 0,
                };

                if current_file_count == last_file_count {
                    let elapsed = last_activity.elapsed();
                    if elapsed < Duration::from_secs(1) {
                        sleep(Duration::from_millis(50));
                    } else {
                        sleep(Duration::from_millis(250));
                    }
                    continue;
                }

                if current_file_count != last_file_count {
                    tracing::debug!(
                        "File count changed: {} -> {}",
                        last_file_count,
                        current_file_count
                    );
                }
                last_file_count = current_file_count;
                let mut new_files = Vec::new();

                for entry in WalkDir::new(&images_path)
                    .max_depth(1)
                    .into_iter()
                    .filter_map(|e| e.ok())
                    .filter(|e| e.file_type().is_file())
                {
                    let path = entry.path().to_path_buf();
                    let key = path.to_string_lossy().to_string();

                    if !processed.contains(&key) && is_file_stable(&path) {
                        new_files.push(path.clone());
                        processed.push_back(key);
                        last_activity = Instant::now();

                        if processed.len() > 50 {
                            processed.pop_front();
                        }
                    }
                }

                for file_path in new_files {
                    if let Some(name) = file_path.file_name().and_then(|n| n.to_str()) {
                        let format = file_path
                            .extension()
                            .and_then(|e| e.to_str())
                            .unwrap_or("unknown");
                        let normalized = file_path.to_string_lossy().replace('\\', "/");

                        tracing::info!("New file detected: {} ({})", name, format);

                        let event = serde_json::json!({
                            "type": "file_created",
                            "file_path": normalized,
                            "file_name": name,
                            "format": format
                        });
                        let _ = window.emit("file-created", event);
                    }
                }
            }

            let elapsed = last_activity.elapsed();
            if elapsed < Duration::from_secs(1) {
                sleep(Duration::from_millis(50));
            } else {
                sleep(Duration::from_millis(250));
            }
        }

        tracing::info!("File watcher thread exiting, setting WATCHER_RUNNING to false");
        WATCHER_RUNNING.store(false, Ordering::Relaxed);
    });

    Ok(())
}

pub fn stop_file_watcher() {
    tracing::info!("Stopping file watcher");
    WATCHER_RUNNING.store(false, Ordering::Relaxed);
}
