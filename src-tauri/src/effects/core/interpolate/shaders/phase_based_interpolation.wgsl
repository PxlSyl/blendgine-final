@group(0) @binding(0) var frame1: texture_2d<f32>;
@group(0) @binding(1) var frame2: texture_2d<f32>;
@group(0) @binding(2) var output: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> uniforms: InterpolationUniforms;

struct InterpolationUniforms {
    alpha: f32,
    factor: f32,
    _padding: vec2<f32>,
}

fn rgba_to_gray(rgba: vec4<f32>) -> f32 {
    return 0.2126 * rgba.r + 0.7152 * rgba.g + 0.0722 * rgba.b;
}

fn abs_diff(a: f32, b: f32) -> f32 {
    return abs(a - b);
}

fn get_gaussian_coeff(i: i32, j: i32) -> f32 {
    var coeff = 0.0;
    if (i == -2 && j == -2) { coeff = 0.003765; }
    if (i == -2 && j == -1) { coeff = 0.015019; }
    if (i == -2 && j == 0) { coeff = 0.023792; }
    if (i == -2 && j == 1) { coeff = 0.015019; }
    if (i == -2 && j == 2) { coeff = 0.003765; }
    if (i == -1 && j == -2) { coeff = 0.015019; }
    if (i == -1 && j == -1) { coeff = 0.059912; }
    if (i == -1 && j == 0) { coeff = 0.094907; }
    if (i == -1 && j == 1) { coeff = 0.059912; }
    if (i == -1 && j == 2) { coeff = 0.015019; }
    if (i == 0 && j == -2) { coeff = 0.023792; }
    if (i == 0 && j == -1) { coeff = 0.094907; }
    if (i == 0 && j == 0) { coeff = 0.150342; }
    if (i == 0 && j == 1) { coeff = 0.094907; }
    if (i == 0 && j == 2) { coeff = 0.023792; }
    if (i == 1 && j == -2) { coeff = 0.015019; }
    if (i == 1 && j == -1) { coeff = 0.059912; }
    if (i == 1 && j == 0) { coeff = 0.094907; }
    if (i == 1 && j == 1) { coeff = 0.059912; }
    if (i == 1 && j == 2) { coeff = 0.015019; }
    if (i == 2 && j == -2) { coeff = 0.003765; }
    if (i == 2 && j == -1) { coeff = 0.015019; }
    if (i == 2 && j == 0) { coeff = 0.023792; }
    if (i == 2 && j == 1) { coeff = 0.015019; }
    if (i == 2 && j == 2) { coeff = 0.003765; }
    return coeff;
}

fn gaussian_blur_5x5_exact(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> f32 {
    var sum: f32 = 0.0;
    var weight_sum: f32 = 0.0;
    
    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                let pixel = textureLoad(tex, sample_pos, 0);
                let gray = rgba_to_gray(pixel);
                let weight = get_gaussian_coeff(i, j);
                sum += gray * weight;
                weight_sum += weight;
            }
        }
    }
    
    return sum / weight_sum;
}

fn gray_to_rgb(gray: f32) -> vec3<f32> {
    return vec3<f32>(gray, gray, gray);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let pixel1 = textureLoad(frame1, pos, 0);
    let pixel2 = textureLoad(frame2, pos, 0);
    
    let frame1_rgb = pixel1.rgb;
    let frame2_rgb = pixel2.rgb;
    let frame1_alpha = pixel1.a;
    let frame2_alpha = pixel2.a;
    
    let alpha = uniforms.alpha;
    
    let gray1 = rgba_to_gray(pixel1);
    let gray2 = rgba_to_gray(pixel2);
    let movement = abs_diff(gray1, gray2);
    
    let blurred_movement = gaussian_blur_5x5_exact(frame1, pos, size);
    let movement_ratio = clamp(blurred_movement / 255.0, 0.0, 0.5);
    
    let rgb_interpolated = frame1_rgb * (1.0 - alpha) + frame2_rgb * alpha;
    
    let final_rgb = rgb_interpolated;
    
    let alpha_interpolated = frame1_alpha * (1.0 - alpha) + frame2_alpha * alpha;
    
    let final_rgb_clamped = clamp(final_rgb, vec3<f32>(0.0), vec3<f32>(1.0));
    let final_alpha_clamped = clamp(alpha_interpolated, 0.0, 1.0);
    
    let result = vec4<f32>(final_rgb_clamped, final_alpha_clamped);
    textureStore(output, pos, result);
} 