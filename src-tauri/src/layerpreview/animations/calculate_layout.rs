use crate::types::SpritesheetLayout;

impl SpritesheetLayout {
    pub fn calculate(
        frame_width: u32,
        frame_height: u32,
        total_frames: u32,
        max_texture_size: u32,
    ) -> Self {
        let frames_per_side = (total_frames as f32).sqrt().ceil() as u32;
        let mut rows = frames_per_side;
        let mut cols = frames_per_side;

        let total_width = cols * frame_width;
        let total_height = rows * frame_height;

        if total_width > max_texture_size || total_height > max_texture_size {
            let max_frames_per_row = max_texture_size / frame_width;
            let max_frames_per_col = max_texture_size / frame_height;
            let max_frames_per_sheet = max_frames_per_row * max_frames_per_col;

            let total_sheets = (total_frames as f32 / max_frames_per_sheet as f32).ceil() as u32;

            cols = (max_frames_per_sheet as f32).sqrt().ceil() as u32;
            rows = ((max_frames_per_sheet as f32) / cols as f32).ceil() as u32;

            while cols * rows < max_frames_per_sheet {
                if cols * frame_width < max_texture_size {
                    cols += 1;
                } else {
                    rows += 1;
                }
            }

            Self {
                rows,
                cols,
                total_sheets,
                frames_per_sheet: max_frames_per_sheet,
                frame_width,
                frame_height,
                total_frames,
            }
        } else {
            Self {
                rows,
                cols,
                total_sheets: 1,
                frames_per_sheet: total_frames,
                frame_width,
                frame_height,
                total_frames,
            }
        }
    }
}
