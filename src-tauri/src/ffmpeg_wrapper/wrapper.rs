use std::{
    path::Path,
    process::{Command, Stdio},
};

use anyhow::Result;

use super::{
    encode_gif_direct, encode_mp4_direct, encode_webm_direct, encode_webp_direct, get_ffmpeg_path,
};

pub struct FFmpegWrapper {
    ffmpeg_path: std::path::PathBuf,
}

impl FFmpegWrapper {
    pub fn new() -> Result<Self> {
        let path = get_ffmpeg_path()?;

        if !path.exists() {
            return Err(anyhow::anyhow!(
                "FFmpeg not found at path: {}",
                path.display()
            ));
        }

        Ok(Self { ffmpeg_path: path })
    }

    pub fn extract_frames(
        &self,
        video_path: &Path,
        output_dir: &Path,
        width: Option<u32>,
        height: Option<u32>,
        fps: Option<f32>,
    ) -> Result<f32> {
        std::fs::create_dir_all(output_dir)?;

        let original_fps = self.get_video_fps(video_path)?;

        let mut filters = Vec::new();

        let scale_filter;
        if let (Some(w), Some(h)) = (width, height) {
            if w > 0 && h > 0 {
                scale_filter = format!("scale={}:{}:flags=lanczos", w, h);
                filters.push(scale_filter.as_str());
            }
        } else if let Some(w) = width {
            if w > 0 {
                scale_filter = format!("scale={}:-1:flags=lanczos", w);
                filters.push(scale_filter.as_str());
            }
        } else if let Some(h) = height {
            if h > 0 {
                scale_filter = format!("scale=-1:{}:flags=lanczos", h);
                filters.push(scale_filter.as_str());
            }
        }
        let fps_filter;
        if let Some(target_fps) = fps {
            fps_filter = format!("fps={}", target_fps);
            filters.push(fps_filter.as_str());
        }
        let filter_complex;
        if !filters.is_empty() {
            filter_complex = filters.join(",");
        } else {
            filter_complex = String::new();
        }
        let output_pattern = format!("{}/frame_%04d.png", output_dir.display());

        let mut args = vec!["-i", video_path.to_str().unwrap()];

        if !filter_complex.is_empty() {
            args.push("-vf");
            args.push(&filter_complex);
        }

        args.extend_from_slice(&["-pix_fmt", "rgba", "-frame_pts", "1", &output_pattern]);

        let mut cmd = Command::new(&self.ffmpeg_path);
        cmd.args(&args);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000);
        }

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        let output = cmd.output()?;
        if !output.status.success() {
            return Err(anyhow::anyhow!(
                "FFmpeg extraction failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(original_fps)
    }

    fn get_video_fps(&self, video_path: &Path) -> Result<f32> {
        let mut cmd = Command::new(&self.ffmpeg_path);
        cmd.args(&["-i", video_path.to_str().unwrap(), "-f", "null", "-"]);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000);
        }

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        let output = cmd.output()?;
        if !output.status.success() {
            return Err(anyhow::anyhow!("Failed to get video info"));
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        for line in stderr.lines() {
            if line.contains("Stream") && line.contains("Video") {
                if let Some(fps_start) = line.find("fps=") {
                    let fps_part = &line[fps_start + 4..];
                    if let Some(fps_end) = fps_part.find(' ') {
                        if let Ok(fps) = fps_part[..fps_end].parse::<f32>() {
                            return Ok(fps);
                        }
                    }
                }
            }
        }

        Ok(25.0)
    }

    pub fn encode_animation_direct(
        &self,
        frames: &[image::DynamicImage],
        output_path: &Path,
        format: &str,
        fps: f32,
        quality: Option<u8>,
        optimize: bool,
        lossless: Option<bool>,
        method: Option<u8>,
    ) -> Result<()> {
        match format {
            "mp4" => encode_mp4_direct(
                &self.ffmpeg_path,
                frames,
                output_path,
                fps,
                quality,
                optimize,
            ),
            "webm" => encode_webm_direct(
                &self.ffmpeg_path,
                frames,
                output_path,
                fps,
                quality,
                optimize,
            ),
            "webp" => encode_webp_direct(
                &self.ffmpeg_path,
                frames,
                output_path,
                fps,
                quality,
                lossless.unwrap_or(true),
                method.unwrap_or(10),
            ),
            "gif" => encode_gif_direct(&self.ffmpeg_path, frames, output_path, fps),
            _ => Err(anyhow::anyhow!("Unsupported format: {}", format)),
        }
    }
}
