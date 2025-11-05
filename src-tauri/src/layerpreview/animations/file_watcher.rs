use anyhow::Result;
use serde_json::json;
use std::{
    collections::{HashMap, HashSet, VecDeque},
    fs::{metadata, read_dir},
    path::PathBuf,
    sync::atomic::{AtomicBool, Ordering},
    thread::{sleep, spawn},
    time::{Duration, SystemTime},
};
use tauri::{AppHandle, Emitter, Runtime};
use walkdir::WalkDir;

static ANIMATION_WATCHER_RUNNING: AtomicBool = AtomicBool::new(false);

struct WatcherState {
    completed_traits_set: HashSet<String>,
    completed_traits_order: VecDeque<String>,
}

impl WatcherState {
    fn new() -> Self {
        Self {
            completed_traits_set: HashSet::new(),
            completed_traits_order: VecDeque::new(),
        }
    }

    fn add_completed_trait(&mut self, trait_name: String, max_size: usize) -> bool {
        if self.completed_traits_set.contains(&trait_name) {
            return false;
        }

        self.completed_traits_set.insert(trait_name.clone());
        self.completed_traits_order.push_back(trait_name);

        if self.completed_traits_order.len() > max_size {
            if let Some(oldest) = self.completed_traits_order.pop_front() {
                self.completed_traits_set.remove(&oldest);
            }
        }

        true
    }

    fn contains_trait(&self, trait_name: &str) -> bool {
        self.completed_traits_set.contains(trait_name)
    }

    fn get_completed_count(&self) -> usize {
        self.completed_traits_set.len()
    }
}

fn check_spritesheets(dir_path: &PathBuf) -> bool {
    WalkDir::new(dir_path)
        .max_depth(3)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter(|e| {
            if let Some(ext) = e.path().extension() {
                ext.to_string_lossy().to_lowercase() == "png"
            } else {
                false
            }
        })
        .next()
        .is_some()
}

fn update_cache(
    cache: &mut HashMap<PathBuf, (SystemTime, bool)>,
    path: &PathBuf,
    has_spritesheets: bool,
    now: SystemTime,
) {
    if let Ok(dir_metadata) = metadata(path) {
        if let Ok(dir_modified) = dir_metadata.modified() {
            cache.insert(path.clone(), (dir_modified, has_spritesheets));
        } else {
            cache.insert(path.clone(), (now, has_spritesheets));
        }
    } else {
        cache.insert(path.clone(), (now, has_spritesheets));
    }
}

fn check_spritesheets_with_cache(
    cache: &mut HashMap<PathBuf, (SystemTime, bool)>,
    path: &PathBuf,
    should_full_scan: bool,
    now: SystemTime,
) -> bool {
    if let Some((cached_time, cached_has_spritesheets)) = cache.get(path) {
        if let Ok(dir_metadata) = metadata(path) {
            if let Ok(dir_modified) = dir_metadata.modified() {
                if dir_modified <= *cached_time && !should_full_scan {
                    return *cached_has_spritesheets;
                }
            }
        }
    }

    let has_spritesheets = check_spritesheets(path);
    update_cache(cache, path, has_spritesheets, now);
    has_spritesheets
}

pub fn start_animation_file_watcher<R: Runtime>(
    spritesheets_dir: PathBuf,
    app_handle: AppHandle<R>,
    total_files_to_process: u32,
) -> Result<()> {
    if ANIMATION_WATCHER_RUNNING.load(Ordering::Relaxed) {
        return Ok(());
    }

    ANIMATION_WATCHER_RUNNING.store(true, Ordering::Relaxed);

    spawn(move || {
        let mut directory_cache: HashMap<PathBuf, (SystemTime, bool)> = HashMap::new();
        let mut last_full_scan = SystemTime::now();
        let full_scan_interval = Duration::from_secs(5);
        let max_cache_size = (total_files_to_process * 2).max(1000) as usize;
        let mut watcher_state = WatcherState::new();

        app_handle
            .emit(
                "processing_progress",
                json!({
                    "progress": 0,
                    "status": format!("Starting trait processing ({} files to process)", total_files_to_process)
                }),
            )
            .ok();

        loop {
            if spritesheets_dir.exists() {
                let completed_count = watcher_state.get_completed_count();
                if completed_count % 10 == 0 {
                    tracing::info!(
                        "File watcher: Current state - completed: {}, total: {}, cache size: {}",
                        completed_count,
                        total_files_to_process,
                        directory_cache.len()
                    );
                }

                let mut newly_completed_traits = Vec::new();
                let mut total_dirs_found = 0;
                let mut dirs_with_spritesheets = 0;
                let now = SystemTime::now();

                let should_full_scan = now.duration_since(last_full_scan).unwrap_or(Duration::ZERO)
                    > full_scan_interval;

                if let Ok(entries) = read_dir(&spritesheets_dir) {
                    for layer_entry in entries.flatten() {
                        if layer_entry.file_type().map_or(false, |ft| ft.is_dir()) {
                            let layer_name = layer_entry.file_name().to_string_lossy().to_string();

                            if let Ok(trait_entries) = read_dir(&layer_entry.path()) {
                                for trait_entry in trait_entries.flatten() {
                                    if trait_entry.file_type().map_or(false, |ft| ft.is_dir()) {
                                        total_dirs_found += 1;
                                        let trait_name = format!(
                                            "{}/{}",
                                            layer_name,
                                            trait_entry.file_name().to_string_lossy()
                                        );

                                        let trait_spritesheets_dir = trait_entry.path();

                                        let has_spritesheets = check_spritesheets_with_cache(
                                            &mut directory_cache,
                                            &trait_spritesheets_dir,
                                            should_full_scan,
                                            now,
                                        );

                                        if has_spritesheets {
                                            dirs_with_spritesheets += 1;
                                        }

                                        if has_spritesheets
                                            && !watcher_state.contains_trait(&trait_name)
                                        {
                                            if watcher_state.add_completed_trait(
                                                trait_name.clone(),
                                                max_cache_size,
                                            ) {
                                                newly_completed_traits.push(trait_name);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if directory_cache.len() > max_cache_size * 2 {
                    let mut to_remove = Vec::new();
                    for (path, _) in &directory_cache {
                        if !path.exists() {
                            to_remove.push(path.clone());
                        }
                    }
                    for path in to_remove {
                        directory_cache.remove(&path);
                    }
                }

                if should_full_scan {
                    last_full_scan = now;
                }

                if total_dirs_found > 0 {
                    let current_completed = watcher_state.get_completed_count();
                    tracing::info!(
                        "File watcher: Found {} directories, {} with spritesheets, {} completed (cache: {})",
                        total_dirs_found,
                        dirs_with_spritesheets,
                        current_completed,
                        directory_cache.len()
                    );

                    if current_completed as u32 >= total_files_to_process {
                        tracing::info!(
                            "File watcher: All traits completed ({} / {}), stopping watcher",
                            current_completed,
                            total_files_to_process
                        );
                        break;
                    }
                }

                if !newly_completed_traits.is_empty() {
                    let completed_count = watcher_state.get_completed_count() as u32;

                    let progress = ((completed_count as f32 / total_files_to_process as f32)
                        * 100.0)
                        .min(100.0);

                    app_handle
                        .emit(
                            "processing_progress",
                            json!({
                                "progress": progress.round() as u32,
                                "status": format!("Completed {} / {} total files",
                                     completed_count, total_files_to_process)
                            }),
                        )
                        .ok();

                    tracing::info!(
                        "File watcher: Completed {} new traits, progress: {}%",
                        newly_completed_traits.len(),
                        progress
                    );

                    if progress >= 100.0 {
                        tracing::info!("File watcher: 100% reached, stopping watcher");
                        break;
                    }
                }
            }

            sleep(Duration::from_millis(100));
        }

        directory_cache.clear();
        watcher_state.completed_traits_set.clear();
        watcher_state.completed_traits_order.clear();

        ANIMATION_WATCHER_RUNNING.store(false, Ordering::Relaxed);
        tracing::info!("File watcher: Thread exited and caches cleaned up");
    });

    Ok(())
}
