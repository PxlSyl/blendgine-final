use crate::{
    effects::core::{gpu::blend_modes_gpu::GpuBlendContext, interpolate::InterpolationEngine},
    generation::generate::{
        cache::clear_generation_files_caches,
        generate_single::{
            file_watcher::stop_file_watcher, static_single::reset_shared_gpu_pipeline,
        },
    },
};

pub async fn cleanup_all_global_contexts() {
    stop_file_watcher();
    GpuBlendContext::clear_global();
    InterpolationEngine::clear_global_context().await;

    if let Err(e) = reset_shared_gpu_pipeline() {
        tracing::error!("Error while resetting GPU pipeline: {}", e);
    }

    clear_generation_files_caches();
}
