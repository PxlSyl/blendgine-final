use num_cpus;
use sysinfo::System;

pub struct WorkerCalculator {
    generation_worker_count: u32,
    save_worker_count: u32,
}

impl WorkerCalculator {
    pub fn new() -> Self {
        let num_cpus = num_cpus::get();
        Self {
            generation_worker_count: std::cmp::min(num_cpus as u32, 100),
            save_worker_count: std::cmp::min(num_cpus as u32, 8),
        }
    }

    pub fn calculate_optimal_worker_distribution(
        &self,
        generation_demand: usize,
        save_demand: usize,
        renderer_preference: &str,
    ) -> (u32, u32) {
        let num_cpus = num_cpus::get();
        let total_cpus = num_cpus as u32;

        println!("🖥️ [WORKER CALC] CPU cores disponibles: {}", total_cpus);
        println!(
            "📊 [WORKER CALC] Demande: {} NFTs génération, {} fichiers sauvegarde",
            generation_demand, save_demand
        );

        let generation_weight = 2.0;
        let save_weight = 1.0;

        let weighted_generation = generation_demand as f64 * generation_weight;
        let weighted_save = save_demand as f64 * save_weight;
        let total_weighted_demand = weighted_generation + weighted_save;

        let generation_ratio = if total_weighted_demand > 0.0 {
            weighted_generation / total_weighted_demand
        } else {
            0.5
        };

        let save_ratio = 1.0 - generation_ratio;

        let mut generation_workers = (total_cpus as f64 * generation_ratio) as u32;
        let mut save_workers = (total_cpus as f64 * save_ratio) as u32;

        if generation_demand > 0 {
            generation_workers = std::cmp::min(generation_workers, generation_demand as u32);
        } else {
            generation_workers = 0;
        }

        if save_demand > 0 {
            save_workers = std::cmp::min(save_workers, save_demand as u32);
        } else {
            save_workers = 0;
        }

        if renderer_preference == "gpu" {
            let original_generation = generation_workers;
            let original_save = save_workers;

            generation_workers = std::cmp::max(1, generation_workers / 3);
            save_workers = std::cmp::max(1, save_workers / 2);

            println!(
                "🎮 [GPU OPTIM] Mode GPU - Réduction des workers: Génération {}→{}, Sauvegarde {}→{}",
                original_generation, generation_workers, original_save, save_workers
            );
        }

        let max_generation_workers = std::cmp::min(total_cpus, generation_demand as u32);
        let max_save_workers = std::cmp::min(std::cmp::min(total_cpus, save_demand as u32), 8);

        generation_workers = std::cmp::min(generation_workers, max_generation_workers);
        save_workers = std::cmp::min(save_workers, max_save_workers);

        if generation_demand > 0 && generation_workers == 0 {
            generation_workers = 1;
        }
        if save_demand > 0 && save_workers == 0 {
            save_workers = 1;
        }

        let total_workers = generation_workers + save_workers;

        println!("🎯 [WORKER CALC] Distribution finale:");
        println!(
            "   🎨 Génération: {} workers ({} NFTs)",
            generation_workers, generation_demand
        );
        println!(
            "   💾 Sauvegarde: {} workers ({} fichiers)",
            save_workers, save_demand
        );
        println!(
            "   🔢 Total: {} workers sur {} cœurs",
            total_workers, total_cpus
        );

        (generation_workers, save_workers)
    }

    pub fn get_detailed_system_info() -> String {
        let mut sys = System::new_all();
        sys.refresh_all();

        let cpu_count = sys.cpus().len();
        let cpu_freq = sys.global_cpu_info().frequency();
        let total_memory = sys.total_memory() / 1024 / 1024;
        let used_memory = sys.used_memory() / 1024 / 1024;
        let memory_percent = (used_memory as f64 / total_memory as f64) * 100.0;

        let cpu_freq_display = if cpu_freq > 0 {
            format!("{} MHz", cpu_freq)
        } else {
            "Variable (économie d'énergie)".to_string()
        };

        let cpu_name = sys.global_cpu_info().brand().trim();
        let cpu_name_short = if cpu_name.len() > 30 {
            format!("{}...", &cpu_name[..27])
        } else {
            cpu_name.to_string()
        };

        format!(
            "🖥️ CPU: {} cores ({}) @ {} | 💾 RAM: {}/{} GB ({:.1}%)",
            cpu_count, cpu_name_short, cpu_freq_display, used_memory, total_memory, memory_percent
        )
    }
}

impl Default for WorkerCalculator {
    fn default() -> Self {
        Self::new()
    }
}
