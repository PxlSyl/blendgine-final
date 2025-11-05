use crate::generation::generate::{
    pausecancel::check_cancelled,
    task_manager::metrics::{MetricsUtils, PerformanceMetrics},
};
use anyhow::Result;
use std::{
    sync::atomic::{AtomicUsize, Ordering},
    sync::Mutex,
    time::{Duration, Instant},
};

#[derive(Debug)]
pub struct SaveWorkerPool {
    total_files: usize,
    completed: AtomicUsize,
    pub errors: Mutex<Vec<String>>,

    start_time: Mutex<Instant>,
    initial_cpu: f64,
    initial_memory: u64,
    end_time: Mutex<Option<Instant>>,
    final_cpu: Mutex<Option<f64>>,
    final_memory: Mutex<Option<u64>>,
}

impl Clone for SaveWorkerPool {
    fn clone(&self) -> Self {
        Self {
            total_files: self.total_files,
            completed: AtomicUsize::new(self.completed.load(Ordering::Relaxed)),
            errors: Mutex::new(self.errors.lock().unwrap().clone()),
            start_time: Mutex::new(*self.start_time.lock().unwrap()),
            initial_cpu: self.initial_cpu,
            initial_memory: self.initial_memory,
            end_time: Mutex::new(*self.end_time.lock().unwrap()),
            final_cpu: Mutex::new(*self.final_cpu.lock().unwrap()),
            final_memory: Mutex::new(*self.final_memory.lock().unwrap()),
        }
    }
}

impl SaveWorkerPool {
    pub fn new(_max_workers: usize, total_files: usize) -> Self {
        let (initial_cpu, initial_memory) = MetricsUtils::measure_system_performance();

        Self {
            total_files,
            completed: AtomicUsize::new(0),
            errors: Mutex::new(Vec::new()),
            start_time: Mutex::new(Instant::now()),
            initial_cpu,
            initial_memory,
            end_time: Mutex::new(None),
            final_cpu: Mutex::new(None),
            final_memory: Mutex::new(None),
        }
    }

    pub fn execute_save_task(
        &self,
        save_fn: impl FnOnce() -> Result<()> + Send + 'static,
    ) -> Result<()> {
        let mut start_time = self.start_time.lock().unwrap();
        *start_time = Instant::now();
        drop(start_time);

        println!(
            "💾 [SAVE POOL] Executing save task for {} files",
            self.total_files
        );

        if let Err(_) = check_cancelled() {
            println!("🛑 [SAVE POOL] Save task cancelled - generation was cancelled");
            self.completed.store(self.total_files, Ordering::Relaxed);
            return Ok(());
        }

        match save_fn() {
            Ok(()) => {
                println!("✅ [SAVE POOL] Save task completed successfully");
                self.completed.store(self.total_files, Ordering::Relaxed);
            }
            Err(e) => {
                let error_msg = format!("Save task failed: {}", e);
                self.errors.lock().unwrap().push(error_msg.clone());
                println!("❌ [SAVE POOL] {}", error_msg);
                return Err(e);
            }
        }

        let batch_end_time = Instant::now();
        let (final_cpu, final_memory) = MetricsUtils::measure_system_performance();

        *self.end_time.lock().unwrap() = Some(batch_end_time);
        *self.final_cpu.lock().unwrap() = Some(final_cpu);
        *self.final_memory.lock().unwrap() = Some(final_memory);

        let start_time = self.start_time.lock().unwrap();
        let save_time = batch_end_time.duration_since(*start_time);

        println!(
            "📊 [SAVE POOL] Save task completed in {:.2}s",
            save_time.as_secs_f64()
        );
        println!(
            "📊 [SAVE POOL] Files processed: {} | Errors: {}",
            self.total_files,
            self.errors.lock().unwrap().len()
        );

        Ok(())
    }

    pub fn get_performance_metrics(&self) -> PerformanceMetrics {
        let end_time = self.end_time.lock().unwrap();
        let start_time = self.start_time.lock().unwrap();

        let save_time = if let Some(end_time) = *end_time {
            end_time.duration_since(*start_time)
        } else {
            Duration::from_secs(0)
        };

        let final_memory = self
            .final_memory
            .lock()
            .unwrap()
            .unwrap_or(self.initial_memory);
        let final_cpu = self.final_cpu.lock().unwrap().unwrap_or(self.initial_cpu);

        let memory_usage = MetricsUtils::calculate_memory_usage(self.initial_memory, final_memory);
        let cpu_usage = MetricsUtils::calculate_cpu_usage(self.initial_cpu, final_cpu);
        let throughput = MetricsUtils::calculate_throughput(
            self.completed.load(Ordering::Relaxed) as u32,
            save_time,
        );

        PerformanceMetrics::new_save(
            1, // Un seul worker de sauvegarde
            save_time,
            memory_usage,
            cpu_usage,
            throughput,
            Duration::from_millis(0), // lock wait time
            self.errors.lock().unwrap().len() as u32,
            self.completed.load(Ordering::Relaxed) as u32,
        )
    }

    pub fn get_active_workers_count(&self) -> usize {
        if self.completed.load(Ordering::Relaxed) < self.total_files {
            1 // Un seul worker actif
        } else {
            0 // Terminé
        }
    }

    pub fn cancel_all_workers(&self) {
        println!("🔄 [SAVE POOL] Cancelling save task...");
        self.completed.store(self.total_files, Ordering::Relaxed);
    }
}
