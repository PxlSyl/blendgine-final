use std::time::Duration;
use sysinfo::System;

#[derive(Debug, Clone)]
pub enum WorkerType {
    Generation,
    Save,
}

#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub worker_type: WorkerType,
    pub worker_count: u32,
    pub execution_time: Duration,
    pub memory_usage: u64,
    pub cpu_usage: f64,
    pub throughput: f64,
    pub lock_wait_time: Duration,
    pub errors_count: u32,
    pub items_processed: u32,
}

impl PerformanceMetrics {
    pub fn new_generation(
        worker_count: u32,
        execution_time: Duration,
        memory_usage: u64,
        cpu_usage: f64,
        throughput: f64,
        lock_wait_time: Duration,
        errors_count: u32,
        nfts_generated: u32,
    ) -> Self {
        Self {
            worker_type: WorkerType::Generation,
            worker_count,
            execution_time,
            memory_usage,
            cpu_usage,
            throughput,
            lock_wait_time,
            errors_count,
            items_processed: nfts_generated,
        }
    }
}
pub struct MetricsUtils;

impl MetricsUtils {
    pub fn calculate_throughput(items_processed: u32, execution_time: Duration) -> f64 {
        if execution_time.as_secs_f64() > 0.0 {
            items_processed as f64 / execution_time.as_secs_f64()
        } else {
            0.0
        }
    }

    pub fn calculate_memory_usage(initial_memory: u64, final_memory: u64) -> u64 {
        if final_memory > initial_memory {
            final_memory - initial_memory
        } else {
            0
        }
    }

    pub fn calculate_cpu_usage(initial_cpu: f64, final_cpu: f64) -> f64 {
        (initial_cpu + final_cpu) / 2.0
    }

    pub fn measure_system_performance() -> (f64, u64) {
        let mut sys = System::new_all();
        sys.refresh_all();

        let cpu_usage = sys.global_cpu_info().cpu_usage().into();
        let memory_usage = sys.used_memory() * 1024;

        (cpu_usage, memory_usage)
    }

    pub fn create_generation_metrics(
        worker_count: u32,
        execution_time: Duration,
        initial_memory: u64,
        final_memory: u64,
        initial_cpu: f64,
        final_cpu: f64,
        errors_count: u32,
        items_processed: u32,
    ) -> PerformanceMetrics {
        let memory_usage = Self::calculate_memory_usage(initial_memory, final_memory);
        let cpu_usage = Self::calculate_cpu_usage(initial_cpu, final_cpu);
        let throughput = Self::calculate_throughput(items_processed, execution_time);

        PerformanceMetrics::new_generation(
            worker_count,
            execution_time,
            memory_usage,
            cpu_usage,
            throughput,
            Duration::from_millis(0),
            errors_count,
            items_processed,
        )
    }

    pub fn display_metrics(metrics: &PerformanceMetrics) {
        let worker_type_str = match metrics.worker_type {
            WorkerType::Generation => "🎨 Génération",
            WorkerType::Save => "💾 Sauvegarde",
        };

        println!(
            "📊 [METRICS] {} - Enregistrement des métriques:",
            worker_type_str
        );
        println!(
            "   🧵 Workers: {} | ⏱️ Temps: {:.2}s | 📁 Items: {}",
            metrics.worker_count,
            metrics.execution_time.as_secs_f64(),
            metrics.items_processed
        );
        println!(
            "   💾 Memory: {} MB | 🖥️ CPU: {:.1}% | 🚀 Throughput: {:.2}",
            metrics.memory_usage / 1024 / 1024,
            metrics.cpu_usage,
            metrics.throughput
        );
        println!(
            "   🔒 Lock wait: {:.2}s | ❌ Errors: {}",
            metrics.lock_wait_time.as_secs_f64(),
            metrics.errors_count
        );
    }

    pub fn display_generation_metrics(
        worker_count: u32,
        total_generation_time: Duration,
        final_memory: u64,
        final_cpu: f64,
        throughput: f64,
        total_nfts: u32,
    ) {
        tracing::info!("📊 [GENERATION METRICS] Generation completed:");
        tracing::info!(
            "   🧵 Workers: {} | ⏱️ Time: {:.2}s | 📁 NFTs: {}",
            worker_count,
            total_generation_time.as_secs_f64(),
            total_nfts
        );
        tracing::info!(
            "   💾 Memory: {} MB | 🖥️ CPU: {:.1}% | 🚀 Throughput: {:.2}",
            final_memory / 1024 / 1024,
            final_cpu,
            throughput
        );
        println!("   🔒 Lock wait: 0.00s | ❌ Errors: 0");
    }
}
