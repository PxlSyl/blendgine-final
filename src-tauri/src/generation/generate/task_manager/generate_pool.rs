use anyhow::Result;
use crossbeam::channel::{unbounded, Receiver, Sender, TryRecvError};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, Instant};

use crate::generation::generate::{
    generate::WorkerParamsArc,
    generate_single::generate_single_artwork::generate_single_artwork,
    pausecancel::{check_cancelled, wait_for_pause},
    task_manager::metrics::{MetricsUtils, PerformanceMetrics},
};

use crate::types::GenerationResult;
type WorkerResult = Result<Option<GenerationResult>>;

#[derive(Debug)]
pub struct WorkerPool {
    tx: Sender<WorkerResult>,
    rx: Receiver<WorkerResult>,
    active_workers: AtomicUsize,
    max_workers: usize,
    total_nfts: usize,
    completed: AtomicUsize,
    pub errors: Vec<String>,

    start_time: Instant,
    initial_cpu: f64,
    initial_memory: u64,
    end_time: Option<Instant>,
    final_cpu: Option<f64>,
    final_memory: Option<u64>,
}

impl Clone for WorkerPool {
    fn clone(&self) -> Self {
        Self {
            tx: self.tx.clone(),
            rx: self.rx.clone(),
            active_workers: AtomicUsize::new(self.active_workers.load(Ordering::Relaxed)),
            max_workers: self.max_workers,
            total_nfts: self.total_nfts,
            completed: AtomicUsize::new(self.completed.load(Ordering::Relaxed)),
            errors: self.errors.clone(),
            start_time: self.start_time,
            initial_cpu: self.initial_cpu,
            initial_memory: self.initial_memory,
            end_time: self.end_time,
            final_cpu: self.final_cpu,
            final_memory: self.final_memory,
        }
    }
}

impl WorkerPool {
    pub fn new(max_workers: usize, total_nfts: usize) -> Self {
        let (tx, rx) = unbounded();
        let (initial_cpu, initial_memory) = MetricsUtils::measure_system_performance();

        Self {
            tx,
            rx,
            active_workers: AtomicUsize::new(0),
            max_workers,
            total_nfts,
            completed: AtomicUsize::new(0),
            errors: Vec::new(),

            start_time: Instant::now(),
            initial_cpu,
            initial_memory,
            end_time: None,
            final_cpu: None,
            final_memory: None,
        }
    }

    pub fn spawn_worker(&self, nft_index: u32, params: &WorkerParamsArc) -> Result<()> {
        let tx = self.tx.clone();
        let mut worker_params = params.clone();
        worker_params.global_index = nft_index;

        std::thread::Builder::new()
            .stack_size(2 * 1024 * 1024)
            .spawn(move || {
                let result = generate_single_artwork(
                    worker_params.global_index,
                    &**worker_params.input_folder,
                    &**worker_params.export_folder,
                    &**worker_params.collection_name,
                    &**worker_params.collection_description,
                    worker_params.include_rarity,
                    &worker_params.rarity_config,
                    &worker_params.active_layer_order,
                    worker_params.base_width,
                    worker_params.base_height,
                    worker_params.final_width,
                    worker_params.final_height,
                    &**worker_params.image_format,
                    &worker_params.incompatibility_map,
                    &worker_params.set_forced_combinations,
                    worker_params.allow_duplicates,
                    &worker_params.set_id,
                    worker_params.total_to_generate,
                    worker_params.blockchain,
                    worker_params.is_animated_collection,
                    worker_params.include_spritesheets,
                    worker_params.sprites_path.as_ref().map(|p| &***p),
                    worker_params.fps,
                    worker_params.solana_config.as_deref(),
                    worker_params.animation_quality.as_deref(),
                    worker_params.resize_config.as_deref(),
                    Some(worker_params.total_frames_count),
                    worker_params.spritesheet_layout.as_deref(),
                    worker_params.working_folder.as_ref().map(|p| &***p),
                    &worker_params.window,
                    &worker_params.global_caches,
                );

                if let Err(e) = tx.send(result) {
                    if !e.to_string().contains("disconnected") {
                        eprintln!("❌ [DEBUG] Error sending result from worker: {}", e);
                    }
                }
            })?;

        self.active_workers.fetch_add(1, Ordering::Relaxed);
        Ok(())
    }

    fn spawn_initial_workers(&self, params: &WorkerParamsArc) -> Result<()> {
        let worker_count = std::cmp::min(self.max_workers, self.total_nfts);

        println!(
            "🚀 [DEBUG] Launching initial pool of {} workers for {} NFTs",
            worker_count, self.total_nfts
        );

        for i in 0..worker_count {
            let nft_index = params.global_index + i as u32;
            self.spawn_worker(nft_index, params)?;
        }

        println!(
            "🚀 [DEBUG] Initial worker pool launched: {} workers",
            self.active_workers.load(Ordering::Relaxed)
        );
        Ok(())
    }

    pub fn run_with_ref(&mut self, params: WorkerParamsArc) -> Result<Vec<GenerationResult>> {
        self.start_time = Instant::now();

        self.spawn_initial_workers(&params)?;

        let mut results = Vec::new();

        let mut loop_count = 0;
        let mut empty_loop_count = 0;
        while self.completed.load(Ordering::Relaxed) < self.total_nfts {
            loop_count += 1;

            wait_for_pause()?;
            check_cancelled()?;

            let completed = self.completed.load(Ordering::Relaxed);
            if completed % 100 == 0 && completed > 0 {
                let progress = (completed as f64 / self.total_nfts as f64) * 100.0;
                println!(
                    "📊 Progress: {:.1}% ({}/{})",
                    progress, completed, self.total_nfts
                );
            }

            match self.rx.try_recv() {
                Ok(result) => {
                    match result {
                        Ok(Some(nft)) => {
                            let nft_index = nft.original_index;
                            results.push(nft);
                            println!("✅ [DEBUG] NFT {} completed", nft_index);
                        }
                        Ok(None) => {
                            println!("⚠️ [DEBUG] Empty NFT result");
                        }
                        Err(e) => {
                            let error_msg = e.to_string();
                            self.errors.push(error_msg.clone());
                            println!("❌ [DEBUG] NFT error: {}", error_msg);
                        }
                    }

                    let completed_count = self.completed.fetch_add(1, Ordering::Relaxed) + 1;
                    self.active_workers.fetch_sub(1, Ordering::Relaxed);

                    let next_nft_index = params.global_index + completed_count as u32;
                    if next_nft_index < params.global_index + self.total_nfts as u32 {
                        self.spawn_worker(next_nft_index, &params)?;
                    }

                    if completed_count % 20 == 0 {
                        let progress = (completed_count as f64 / self.total_nfts as f64) * 100.0;
                        println!(
                            "📊 Progress: {:.1}% ({}/{})",
                            progress, completed_count, self.total_nfts
                        );
                    }
                }
                Err(TryRecvError::Empty) => {
                    empty_loop_count += 1;

                    if loop_count % 100 == 0 {
                        if self.active_workers.load(Ordering::Relaxed) == 0 {
                            println!("✅ [DEBUG] No more active workers, generation complete");
                            break;
                        }
                    }

                    if empty_loop_count > 1000 {
                        std::thread::sleep(Duration::from_millis(5));
                        empty_loop_count = 0;
                    } else if empty_loop_count > 100 {
                        std::thread::sleep(Duration::from_millis(2));
                    } else {
                        std::thread::sleep(Duration::from_millis(1));
                    }

                    continue;
                }
                Err(TryRecvError::Disconnected) => {
                    if self.active_workers.load(Ordering::Relaxed) == 0 {
                        println!("✅ [DEBUG] All workers completed, channel closed normally");
                        break;
                    } else {
                        println!("⚠️ [DEBUG] Channel disconnected but workers still active, continuing...");
                        std::thread::sleep(Duration::from_millis(10));
                        continue;
                    }
                }
            }
        }

        let batch_end_time = Instant::now();
        let (final_cpu, final_memory) = MetricsUtils::measure_system_performance();

        self.end_time = Some(batch_end_time);
        self.final_cpu = Some(final_cpu);
        self.final_memory = Some(final_memory);

        let generation_time = batch_end_time.duration_since(self.start_time);

        let memory_usage = MetricsUtils::calculate_memory_usage(self.initial_memory, final_memory);
        let cpu_usage = MetricsUtils::calculate_cpu_usage(self.initial_cpu, final_cpu);
        let throughput = MetricsUtils::calculate_throughput(
            self.completed.load(Ordering::Relaxed) as u32,
            generation_time,
        );

        println!(
            "📊 [DEBUG] Worker pool completed in {:.2}s",
            generation_time.as_secs_f64()
        );
        println!("📊 [DEBUG] Throughput: {:.2} NFTs/sec", throughput);
        println!("📊 [DEBUG] Memory usage: {} MB", memory_usage);
        println!("📊 [DEBUG] CPU usage: {:.1}%", cpu_usage);
        println!(
            "📊 [DEBUG] Errors: {} | Lock wait: 0.00s",
            self.errors.len()
        );
        println!(
            "🚀 [OPTIMIZATION] Loop efficiency: {} total loops, {} empty loops",
            loop_count, empty_loop_count
        );

        println!("⏳ [DEBUG] Waiting for GPU context stabilization...");
        std::thread::sleep(Duration::from_millis(500));
        println!("✅ [DEBUG] GPU context stabilized");

        Ok(results)
    }

    pub fn get_performance_metrics(&self) -> PerformanceMetrics {
        let generation_time = if let Some(end_time) = self.end_time {
            end_time.duration_since(self.start_time)
        } else {
            Duration::from_secs(0)
        };

        let final_memory = self.final_memory.unwrap_or(self.initial_memory);
        let final_cpu = self.final_cpu.unwrap_or(self.initial_cpu);

        MetricsUtils::create_generation_metrics(
            self.max_workers as u32,
            generation_time,
            self.initial_memory,
            final_memory,
            self.initial_cpu,
            final_cpu,
            self.errors.len() as u32,
            self.completed.load(Ordering::Relaxed) as u32,
        )
    }

    pub fn get_active_workers_count(&self) -> usize {
        self.active_workers.load(Ordering::Relaxed)
    }

    pub fn cancel_all_workers(&self) {
        println!("🔄 [WORKER_POOL] Cancelling all workers...");
        self.completed.store(self.total_nfts, Ordering::Relaxed);
        drop(self.tx.clone());
    }
}
