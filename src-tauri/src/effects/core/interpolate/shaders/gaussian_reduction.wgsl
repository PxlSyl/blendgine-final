@group(0) @binding(0) var input_texture: texture_2d<f32>;
@group(0) @binding(1) var output_texture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> uniforms: GaussianReductionUniforms;

struct GaussianReductionUniforms {
    input_width: u32,
    input_height: u32,
    output_width: u32,
    output_height: u32,
    _padding: vec3<f32>,
}

fn get_gaussian_coeff(i: i32, j: i32) -> f32 {
    if (i == -2 && j == -2) { return 0.003765; }
    if (i == -2 && j == -1) { return 0.015019; }
    if (i == -2 && j == 0) { return 0.023792; }
    if (i == -2 && j == 1) { return 0.015019; }
    if (i == -2 && j == 2) { return 0.003765; }
    if (i == -1 && j == -2) { return 0.015019; }
    if (i == -1 && j == -1) { return 0.059912; }
    if (i == -1 && j == 0) { return 0.094907; }
    if (i == -1 && j == 1) { return 0.059912; }
    if (i == -1 && j == 2) { return 0.015019; }
    if (i == 0 && j == -2) { return 0.023792; }
    if (i == 0 && j == -1) { return 0.094907; }
    if (i == 0 && j == 0) { return 0.150342; }
    if (i == 0 && j == 1) { return 0.094907; }
    if (i == 0 && j == 2) { return 0.023792; }
    if (i == 1 && j == -2) { return 0.015019; }
    if (i == 1 && j == -1) { return 0.059912; }
    if (i == 1 && j == 0) { return 0.094907; }
    if (i == 1 && j == 1) { return 0.059912; }
    if (i == 1 && j == 2) { return 0.015019; }
    if (i == 2 && j == -2) { return 0.003765; }
    if (i == 2 && j == -1) { return 0.015019; }
    if (i == 2 && j == 0) { return 0.023792; }
    if (i == 2 && j == 1) { return 0.015019; }
    if (i == 2 && j == 2) { return 0.003765; }
    return 0.0;
}

fn sample_with_border(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> vec4<f32> {
    let clamped_pos = vec2<i32>(
        clamp(pos.x, 0, i32(size.x) - 1),
        clamp(pos.y, 0, i32(size.y) - 1)
    );
    return textureLoad(tex, clamped_pos, 0);
}

fn apply_gaussian_filter_5x5(tex: texture_2d<f32>, center_pos: vec2<i32>, size: vec2<u32>) -> vec4<f32> {
    var result = vec4<f32>(0.0);
    var weight_sum = 0.0;
    
    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            let sample_pos = center_pos + vec2<i32>(i, j);
            let weight = get_gaussian_coeff(i, j);
            
            let sample = sample_with_border(tex, sample_pos, size);
            result += sample * weight;
            weight_sum += weight;
        }
    }
    
    return result / weight_sum;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let output_pos = vec2<i32>(id.xy);
    let output_size = vec2<u32>(uniforms.output_width, uniforms.output_height);
    let input_size = vec2<u32>(uniforms.input_width, uniforms.input_height);
    
    if (output_pos.x >= i32(output_size.x) || output_pos.y >= i32(output_size.y)) {
        return;
    }
    
    let input_pos = vec2<i32>(output_pos.x * 2, output_pos.y * 2);
    
    let filtered = apply_gaussian_filter_5x5(input_texture, input_pos, input_size);
    
    textureStore(output_texture, output_pos, filtered);
} 