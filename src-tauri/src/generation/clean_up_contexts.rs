use crate::generation::generate::cache::clear_generation_files_caches;
use crate::generation::generate::generate_single::static_single::static_dispatcher::cleanup_static_caches_final_by_preference;
use crate::{
    effects::core::{
        dispatch::{blendmodes::BlendConverter, resize::ResizeConverter},
        interpolate::InterpolationEngine,
    },
    generation::generate::generate_single::file_watcher,
};
pub fn cleanup_all_global_contexts() {
    println!("🧹 [GENERATE] Stopping grid file watcher...");
    file_watcher::stop_file_watcher();
    println!("🧹 [CLEANUP] Cleaning up all global contexts...");
    // gpu
    BlendConverter::clear_global_gpu_context();
    InterpolationEngine::clear_global_context();
    ResizeConverter::clear_global_gpu_manager();
    // generation
    cleanup_static_caches_final_by_preference();
    clear_generation_files_caches();
    println!("🧹 [CLEANUP] All global contexts cleaned up");
}
