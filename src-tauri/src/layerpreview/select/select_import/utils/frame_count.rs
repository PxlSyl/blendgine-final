use anyhow::Result;
use image::{self, codecs::gif::GifDecoder, AnimationDecoder};
use std::{io::Cursor, path::PathBuf};

pub fn detect_frame_count(img_data: &[u8], path: &PathBuf) -> Result<u32, String> {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();

        match ext.as_str() {
            "gif" => {
                if let Ok(decoder) = GifDecoder::new(Cursor::new(img_data)) {
                    let frames: Vec<_> = decoder.into_frames().collect();
                    Ok(frames.len() as u32)
                } else {
                    Ok(1)
                }
            }
            "webp" => {
                if img_data.len() >= 12 {
                    if &img_data[0..4] == b"RIFF" && &img_data[8..12] == b"WEBP" {
                        let mut pos = 12;
                        let mut has_anim_chunk = false;
                        let mut has_anmf_chunks = false;
                        let mut frame_count = 0;

                        while pos + 8 <= img_data.len() {
                            let chunk_header = &img_data[pos..pos + 4];
                            let chunk_size_bytes = &img_data[pos + 4..pos + 8];
                            let chunk_size =
                                u32::from_le_bytes(chunk_size_bytes.try_into().unwrap_or([0; 4]))
                                    as usize;

                            if chunk_header == b"ANIM" {
                                has_anim_chunk = true;
                            } else if chunk_header == b"ANMF" {
                                has_anmf_chunks = true;
                                frame_count += 1;
                            }

                            pos += 8 + chunk_size;
                        }

                        if has_anim_chunk && has_anmf_chunks {
                            Ok(frame_count)
                        } else {
                            Ok(1)
                        }
                    } else {
                        Ok(1)
                    }
                } else {
                    Ok(1)
                }
            }
            _ => Ok(1),
        }
    } else {
        Ok(1)
    }
}
