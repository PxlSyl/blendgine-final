#[cfg(target_arch = "x86_64")]
pub mod avx2;
#[cfg(target_arch = "aarch64")]
pub mod neon;
pub mod simd_architecture;
pub mod simd_filter;
#[cfg(target_arch = "x86_64")]
pub mod sse;

#[cfg(target_arch = "x86_64")]
pub use avx2::*;
#[cfg(target_arch = "aarch64")]
pub use neon::*;
pub use simd_architecture::*;
pub use simd_filter::*;
#[cfg(target_arch = "x86_64")]
pub use sse::*;
