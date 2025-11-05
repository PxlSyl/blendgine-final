pub trait FloatExt {
    fn max_f32(self, other: f32) -> f32;
    fn min_f32(self, other: f32) -> f32;
}

impl FloatExt for f32 {
    fn max_f32(self, other: f32) -> f32 {
        if self > other {
            self
        } else {
            other
        }
    }
    fn min_f32(self, other: f32) -> f32 {
        if self < other {
            self
        } else {
            other
        }
    }
}
