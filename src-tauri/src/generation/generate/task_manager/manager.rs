use anyhow::Result;
use num_cpus;
use once_cell::sync::Lazy;
use std::{
    future::Future,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    spawn,
    sync::{RwLock, Semaphore, SemaphorePermit},
    task::{spawn_blocking, JoinHandle},
    time::sleep,
};
use tokio_util::sync::CancellationToken;

use crate::generation::generate::task_manager::MetricsUtils;

static CURRENT_SESSION_TOKEN: Lazy<Arc<RwLock<CancellationToken>>> =
    Lazy::new(|| Arc::new(RwLock::new(CancellationToken::new())));

pub static GENERATION_SEMAPHORE: Lazy<Arc<Semaphore>> =
    Lazy::new(|| Arc::new(Semaphore::new(num_cpus::get())));

pub static SAVE_SEMAPHORE: Lazy<Arc<Semaphore>> =
    Lazy::new(|| Arc::new(Semaphore::new(num_cpus::get() * 2)));

const TASK_TIMEOUT: Duration = Duration::from_secs(300);
const BACKPRESSURE_SLEEP: Duration = Duration::from_millis(10);
const MAX_BACKPRESSURE_ATTEMPTS: u32 = 100;

async fn acquire_with_backpressure<'a>(
    sema: &'a Semaphore,
    task_type: &str,
) -> Result<SemaphorePermit<'a>> {
    for attempt in 1..=MAX_BACKPRESSURE_ATTEMPTS {
        if let Ok(permit) = sema.try_acquire() {
            return Ok(permit);
        }

        if attempt % 10 == 0 {
            tracing::debug!(
                "⏳ [{}] Backpressure: waiting for semaphore (attempt {}/{})",
                task_type.to_uppercase(),
                attempt,
                MAX_BACKPRESSURE_ATTEMPTS
            );
        }

        sleep(BACKPRESSURE_SLEEP).await;
    }

    tracing::warn!(
        "⚠️ [{}] Backpressure timeout, falling back to blocking acquire",
        task_type.to_uppercase()
    );

    sema.acquire().await.map_err(|e| {
        anyhow::anyhow!(
            "Failed to acquire {} semaphore permit after backpressure: {}",
            task_type,
            e
        )
    })
}

async fn run_with_semaphore<F, Fut, T>(
    sema: &Semaphore,
    task_id: String,
    task: F,
    task_type: &str,
) -> Result<T>
where
    F: FnOnce() -> Fut + Send,
    Fut: Future<Output = Result<T>> + Send,
    T: Send,
{
    let permit = acquire_with_backpressure(sema, task_type).await?;

    let cancel_token = get_current_session_token().await;
    let id = task_id.clone();

    let result = tokio::select! {
        result = task() => {
            match &result {
                Ok(_) => tracing::debug!("✅ [{}] Task {} completed successfully", task_type.to_uppercase(), id),
                Err(e) => tracing::error!("❌ [{}] Task {} failed: {:?}", task_type.to_uppercase(), id, e),
            }
            result
        }
        _ = cancel_token.cancelled() => {
            tracing::info!("🛑 [{}] Task {} cancelled", task_type.to_uppercase(), id);
            Err(anyhow::anyhow!("Task cancelled"))
        }
        _ = sleep(TASK_TIMEOUT) => {
            tracing::error!("⏰ [{}] Task {} timed out after {:?}", task_type.to_uppercase(), id, TASK_TIMEOUT);
            Err(anyhow::anyhow!("Task timed out after {:?}", TASK_TIMEOUT))
        }
    };

    drop(permit);
    result
}

async fn run_save_with_semaphore<F, C>(
    sema: &Semaphore,
    task_id: String,
    save_fn: F,
    cancellation_check: Option<C>,
) -> Result<()>
where
    F: FnOnce() -> Result<()> + Send + 'static,
    C: Fn() -> bool + Send + 'static,
{
    let _permit = acquire_with_backpressure(sema, "save").await?;

    let cancel_token = get_current_session_token().await;
    let id = task_id.clone();
    let id_for_logging = id.clone();

    if cancel_token.is_cancelled() {
        tracing::info!(
            "🛑 [SAVE] Task cancelled before execution: {}",
            id_for_logging
        );
        return Err(anyhow::anyhow!("Save task cancelled"));
    }

    let result = spawn_blocking(move || {
        let start_time = Instant::now();
        let task_id_for_inner = id.clone();
        tracing::debug!("🔄 [SAVE] Executing task: {}", task_id_for_inner);

        if let Some(check_fn) = cancellation_check {
            if check_fn() {
                return Err(anyhow::anyhow!("Save task cancelled before execution"));
            }
        }
        let save_result = save_fn();

        let duration = start_time.elapsed();
        tracing::debug!(
            "⏱️ [SAVE] Task {} completed in {:?}",
            task_id_for_inner,
            duration
        );

        save_result
    })
    .await;

    match result {
        Ok(Ok(())) => {
            tracing::info!("✅ [SAVE] Task completed successfully: {}", id_for_logging);
            Ok(())
        }
        Ok(Err(e)) => {
            tracing::error!("❌ [SAVE] Task failed: {} - Error: {}", id_for_logging, e);
            Err(e)
        }
        Err(e) => {
            tracing::error!(
                "❌ [SAVE] Task join error: {} - Error: {}",
                id_for_logging,
                e
            );
            Err(anyhow::anyhow!("Task join error: {}", e))
        }
    }
}

pub async fn spawn_generation_task<F, Fut, T>(
    task_id: String,
    task_fn: F,
) -> Result<JoinHandle<Result<T>>>
where
    F: FnOnce() -> Fut + Send + 'static,
    Fut: Future<Output = Result<T>> + Send,
    T: Send + 'static,
{
    tracing::debug!("🚀 [GENERATION] Starting task: {}", task_id);

    let task_id_for_logging = task_id.clone();
    let handle = spawn(async move {
        run_with_semaphore(&GENERATION_SEMAPHORE, task_id, task_fn, "generation").await
    });

    tracing::debug!(
        "🚀 [GENERATION] Task {} spawned successfully",
        task_id_for_logging
    );
    Ok(handle)
}

pub async fn spawn_save_task<F>(task_id: String, save_fn: F) -> Result<JoinHandle<Result<()>>>
where
    F: FnOnce() -> Result<()> + Send + 'static,
{
    spawn_save_task_with_cancellation(task_id, save_fn, None::<fn() -> bool>).await
}

pub async fn spawn_save_task_with_cancellation<F, C>(
    task_id: String,
    save_fn: F,
    cancellation_check: Option<C>,
) -> Result<JoinHandle<Result<()>>>
where
    F: FnOnce() -> Result<()> + Send + 'static,
    C: Fn() -> bool + Send + 'static,
{
    tracing::debug!("🔄 [SAVE] Starting task: {}", task_id);

    let task_id_for_logging = task_id.clone();
    let handle = spawn(async move {
        let result = run_save_with_semaphore(
            &SAVE_SEMAPHORE,
            task_id.clone(),
            save_fn,
            cancellation_check,
        )
        .await;
        tracing::debug!("🧹 [SAVE] Task completed: {}", task_id);
        result
    });

    tracing::debug!(
        "🚀 [SAVE] Task {} spawned successfully",
        task_id_for_logging
    );
    Ok(handle)
}

pub async fn cancel_all_tasks() -> Result<()> {
    tracing::info!("🔄 [CANCEL] Cancelling current session tasks...");
    let session_token = CURRENT_SESSION_TOKEN.read().await;
    session_token.cancel();
    tracing::info!("✅ [CANCEL] Session cancellation signal sent");
    Ok(())
}

pub async fn create_generation_session() -> CancellationToken {
    let new_token = CancellationToken::new();
    {
        let mut session_token = CURRENT_SESSION_TOKEN.write().await;
        *session_token = new_token.clone();
    }
    tracing::info!("🆕 [SESSION] New generation session created");
    new_token
}

pub async fn get_current_session_token() -> CancellationToken {
    let session_token = CURRENT_SESSION_TOKEN.read().await;
    session_token.clone()
}

pub fn get_system_info() -> String {
    let num_cpus = num_cpus::get();
    let (cpu_usage, memory_usage) = MetricsUtils::measure_system_performance();

    let generation_available = GENERATION_SEMAPHORE.available_permits();
    let save_available = SAVE_SEMAPHORE.available_permits();

    format!(
        "🖥️ System Info:\n\
         💻 CPU Cores: {}\n\
         📊 CPU Usage: {:.1}%\n\
         💾 Memory: {} MB\n\
         🎯 Generation Workers: {}/{} available\n\
         💾 Save Workers: {}/{} available\n\
         🚀 Task Management: Auto-Adaptive Semaphores",
        num_cpus,
        cpu_usage,
        memory_usage / 1024 / 1024,
        generation_available,
        num_cpus,
        save_available,
        num_cpus * 2
    )
}

pub fn get_semaphore_info() -> String {
    let num_cpus = num_cpus::get();
    let generation_available = GENERATION_SEMAPHORE.available_permits();
    let save_available = SAVE_SEMAPHORE.available_permits();

    format!(
        "🎯 Semaphore Status:\n\
         - Generation: {}/{} workers available\n\
         - Save: {}/{} workers available\n\
         - Total CPU Cores: {}",
        generation_available,
        num_cpus,
        save_available,
        num_cpus * 2,
        num_cpus
    )
}
