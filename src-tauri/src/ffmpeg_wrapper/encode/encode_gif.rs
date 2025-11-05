use std::{
    io::{Cursor, Write},
    path::Path,
    process::{Command, Stdio},
};

use anyhow::Result;
use image::DynamicImage;

pub fn encode_gif_direct(
    ffmpeg_path: &std::path::PathBuf,
    frames: &[DynamicImage],
    output_path: &Path,
    fps: f32,
) -> Result<()> {
    if frames.is_empty() {
        return Err(anyhow::anyhow!("No frames provided for encoding"));
    }

    let _delay = (100.0 / fps) as u32;

    let fps_str = fps.to_string();
    let filter_str = format!(
        "fps={},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        fps
    );

    let mut cmd = Command::new(ffmpeg_path);
    cmd.args(&[
        "-y",
        "-f",
        "image2pipe",
        "-i",
        "pipe:0",
        "-framerate",
        &fps_str,
        "-vf",
        &filter_str,
        "-loop",
        "0",
        output_path.to_str().unwrap(),
    ]);

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
        return Err(anyhow::anyhow!("FFmpeg GIF encoding failed"));
    }

    Ok(())
}
