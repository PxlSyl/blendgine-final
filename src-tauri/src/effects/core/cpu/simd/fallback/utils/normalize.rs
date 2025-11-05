use rayon::prelude::*;

pub fn normalize_image_fallback(img: &mut image::RgbaImage) {
    let width = img.width() as usize;
    let height = img.height() as usize;
    let buffer = img.as_mut();

    let (min_val, max_val) = (0..height)
        .into_par_iter()
        .map(|y| {
            let row_start = y * width * 4;
            let row_end = row_start + width * 4;
            let row_slice = &buffer[row_start..row_end];

            let mut row_min = 255u8;
            let mut row_max = 0u8;

            for x in 0..width {
                let idx = x * 4;
                let r = row_slice[idx];
                let g = row_slice[idx + 1];
                let b = row_slice[idx + 2];

                let pixel_min = r.min(g).min(b);
                let pixel_max = r.max(g).max(b);

                row_min = row_min.min(pixel_min);
                row_max = row_max.max(pixel_max);
            }

            (row_min, row_max)
        })
        .reduce(
            || (255u8, 0u8),
            |(min1, max1), (min2, max2)| (min1.min(min2), max1.max(max2)),
        );

    if max_val > min_val {
        let range = (max_val - min_val) as f32;
        let scale = 255.0 / range;

        let processed_rows: Vec<_> = (0..height)
            .into_par_iter()
            .map(|y| {
                let row_start = y * width * 4;
                let row_end = row_start + width * 4;
                let input_row_slice = &buffer[row_start..row_end];
                let mut output_row = vec![0u8; width * 4];

                for x in 0..width {
                    let idx = x * 4;

                    for channel in 0..3 {
                        let value = input_row_slice[idx + channel];
                        let normalized = ((value - min_val) as f32 * scale) as u8;
                        output_row[idx + channel] = normalized.clamp(0, 255);
                    }

                    output_row[idx + 3] = input_row_slice[idx + 3];
                }

                (y, output_row)
            })
            .collect();

        for (y, output_row) in processed_rows {
            let row_start = y * width * 4;
            let row_end = row_start + width * 4;
            buffer[row_start..row_end].copy_from_slice(&output_row);
        }
    }
}
