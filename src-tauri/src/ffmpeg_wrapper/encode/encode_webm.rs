use std::{
    io::{Cursor, Write},
    path::Path,
    process::{Command, Stdio},
};

use anyhow::Result;
use image::{DynamicImage, GenericImageView};

pub fn encode_webm_direct(
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

    let vp9_quality = 40 - (quality.unwrap_or(10) as i32 - 1) * (20 / 9);
    let deadline = if optimize { "good" } else { "realtime" };

    let fps_str = fps.to_string();
    let vp9_quality_str = vp9_quality.to_string();

    let mut args = vec![
        "-y",
        "-f",
        "image2pipe",
        "-i",
        "pipe:0",
        "-framerate",
        &fps_str,
        "-c:v",
        "libvpx-vp9",
        "-crf",
        &vp9_quality_str,
        "-b:v",
        "0",
        "-deadline",
        deadline,
        "-auto-alt-ref",
        "0",
        "-pix_fmt",
        "yuv420p",
    ];

    if cfg!(target_os = "windows") {
        args.extend_from_slice(&["-threads", "0"]);
    } else {
        args.extend_from_slice(&["-threads", "0", "-cpu-used", "2"]);
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

    let (expected_width, expected_height) = frames[0].dimensions();

    for (idx, frame) in frames.iter().enumerate() {
        let (w, h) = frame.dimensions();
        if w != expected_width || h != expected_height {
            eprintln!(
                "⚠️ [WEBM] Frame {} has dimensions {}x{}, expected {}x{}",
                idx, w, h, expected_width, expected_height
            );
        }

        // Convert to RGBA8 to ensure consistent format
        let rgba_frame = frame.to_rgba8();
        let dynamic_frame = DynamicImage::ImageRgba8(rgba_frame);

        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);
        dynamic_frame.write_to(&mut cursor, image::ImageFormat::Png)?;
        stdin.write_all(&buffer)?;
    }

    drop(stdin);
    let status = child.wait()?;

    if !status.success() {
        return Err(anyhow::anyhow!("FFmpeg WebM encoding failed"));
    }

    Ok(())
}
