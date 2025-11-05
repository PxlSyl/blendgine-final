use std::path::Path;

fn main() {
    let ffmpeg_name = if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else if cfg!(target_os = "linux") {
        "ffmpeg-linux"
    } else if cfg!(target_os = "macos") {
        "ffmpeg-mac"
    } else {
        panic!("Unsupported platform for FFmpeg");
    };

    let bin_dir = "bin";
    if !Path::new(bin_dir).exists() {
        std::fs::create_dir_all(bin_dir).expect("Failed to create bin directory");
    }

    let ffmpeg_source_path = format!("bin/{}", ffmpeg_name);
    let ffmpeg_unified_path = "bin/ffmpeg";

    if Path::new(&ffmpeg_source_path).exists() {
        println!("cargo:rerun-if-changed={}", ffmpeg_source_path);
        println!(
            "cargo:warning=FFmpeg binary found at {}",
            ffmpeg_source_path
        );

        if !Path::new(ffmpeg_unified_path).exists() {
            if let Err(e) = std::fs::copy(&ffmpeg_source_path, ffmpeg_unified_path) {
                eprintln!("Warning: Failed to copy FFmpeg binary: {}", e);
            } else {
                println!(
                    "cargo:warning=FFmpeg binary copied to {}",
                    ffmpeg_unified_path
                );
            }
        } else {
            println!(
                "cargo:warning=FFmpeg binary already exists at {}",
                ffmpeg_unified_path
            );
        }
    } else {
        eprintln!("Warning: FFmpeg binary not found at {}", ffmpeg_source_path);
        eprintln!("Please ensure the appropriate FFmpeg binary is available in src-tauri/bin/");
    }

    tauri_build::build()
}
