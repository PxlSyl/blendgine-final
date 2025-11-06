use anyhow::Result;
use std::{
    env::current_dir,
    os::windows::process::CommandExt,
    path::PathBuf,
    process::{Command, Stdio},
};

pub fn get_ffmpeg_bin_dir() -> PathBuf {
    let project_dir = current_dir().unwrap_or_else(|_| PathBuf::from("."));
    project_dir.join("bin")
}

pub fn get_ffmpeg_path() -> Result<PathBuf> {
    let app_dir = get_ffmpeg_bin_dir();

    let bundled_path = app_dir.join("ffmpeg");
    if bundled_path.exists() {
        return Ok(bundled_path);
    }

    if let Ok(output) = {
        let mut cmd = Command::new("which");
        cmd.arg("ffmpeg");

        #[cfg(target_os = "windows")]
        {
            cmd.creation_flags(0x08000000);
        }

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).output()
    } {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout);
            let path = path_str.trim();
            return Ok(PathBuf::from(path));
        }
    }

    if cfg!(target_os = "windows") {
        if let Ok(output) = {
            let mut cmd = Command::new("where");
            cmd.arg("ffmpeg");

            #[cfg(target_os = "windows")]
            {
                cmd.creation_flags(0x08000000);
            }

            cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).output()
        } {
            if output.status.success() {
                let path_str = String::from_utf8_lossy(&output.stdout);
                let path = path_str.trim();
                return Ok(PathBuf::from(path));
            }
        }
    }

    Err(anyhow::anyhow!(
        "FFmpeg not found. Please ensure ffmpeg is available in PATH or in the bin/ directory."
    ))
}
