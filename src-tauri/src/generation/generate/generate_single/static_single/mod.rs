pub mod static_gpu;

pub use static_gpu::{
    get_or_init_shared_gpu_pipeline, process_static_single_gpu as process_static_single,
    reset_shared_gpu_pipeline,
};
