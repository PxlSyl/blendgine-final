use crate::generation::generate::cache::clear_generation_files_caches;
use crate::generation::generate::generate_single::static_single::reset_shared_gpu_pipeline;
use crate::{
    effects::core::{gpu::blend_modes_gpu::GpuBlendContext, interpolate::InterpolationEngine},
    generation::generate::generate_single::file_watcher,
};

pub async fn cleanup_all_global_contexts() {
    println!("🧹 [GENERATE] Stopping grid file watcher...");
    file_watcher::stop_file_watcher();
    println!("🧹 [CLEANUP] Cleaning up all global contexts...");
    
    // GPU contexts
    GpuBlendContext::clear_global();
    InterpolationEngine::clear_global_context().await;
    
    // Generation GPU pipeline
    if let Err(e) = reset_shared_gpu_pipeline() {
        eprintln!("⚠️ [CLEANUP] Error while resetting GPU pipeline: {}", e);
    }
    
    clear_generation_files_caches();
    println!("🧹 [CLEANUP] All global contexts cleaned up");
}
