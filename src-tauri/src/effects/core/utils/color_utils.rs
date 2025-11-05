use anyhow::{anyhow, Result};

pub fn parse_hex_color(color: &str) -> Result<[u8; 3]> {
    let color = color.trim_start_matches('#');
    if color.len() != 6 {
        return Err(anyhow!("Invalid color format"));
    }

    let r = u8::from_str_radix(&color[0..2], 16)
        .map_err(|e| anyhow!("Failed to parse red component: {}", e))?;
    let g = u8::from_str_radix(&color[2..4], 16)
        .map_err(|e| anyhow!("Failed to parse green component: {}", e))?;
    let b = u8::from_str_radix(&color[4..6], 16)
        .map_err(|e| anyhow!("Failed to parse blue component: {}", e))?;

    Ok([r, g, b])
}
