use std::{
    io::{Cursor, Write},
    path::Path,
    process::{Command, Stdio},
};

use anyhow::Result;
use image::DynamicImage;

pub fn encode_mp4_direct(
    ffmpeg_path: &std::path::PathBuf,
    frames: &[DynamicImage],
    output_path: &Path,
    fps: f32,
    quality: Option<u8>,
    optimize: bool,
) -> Result<()> {
    if frames.is_empty() {
        return Err(anyhow::anyhow!("No frames provided for encoding"));
    }

    let crf = 28 - (quality.unwrap_or(10) as i32 - 1) * (10 / 9);
    let preset = if optimize { "slow" } else { "ultrafast" };

    let fps_str = fps.to_string();
    let crf_str = crf.to_string();

    let mut args = vec![
        "-y",
        "-f",
        "image2pipe",
        "-i",
        "pipe:0",
        "-framerate",
        &fps_str,
        "-c:v",
        "libx264",
        "-preset",
        preset,
        "-crf",
        &crf_str,
        "-tune",
        "animation",
        "-pix_fmt",
        "yuv420p",
    ];

    if cfg!(target_os = "windows") {
        args.extend_from_slice(&["-threads", "0"]);
    } else {
        args.extend_from_slice(&["-threads", "0", "-movflags", "+faststart"]);
    }

    args.push(output_path.to_str().unwrap());

    let mut cmd = Command::new(ffmpeg_path);
    cmd.args(&args);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn()?;
    let mut stdin = child.stdin.take().unwrap();

    for frame in frames {
        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);
        frame.write_to(&mut cursor, image::ImageFormat::Png)?;
        stdin.write_all(&buffer)?;
    }

    drop(stdin);
    let status = child.wait()?;

    if !status.success() {
        return Err(anyhow::anyhow!("FFmpeg MP4 encoding failed"));
    }

    Ok(())
}
