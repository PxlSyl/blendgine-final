@group(0) @binding(0) var frame1: texture_2d<f32>;
@group(0) @binding(1) var frame2: texture_2d<f32>;
@group(0) @binding(2) var output: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> uniforms: InterpolationUniforms;

struct InterpolationUniforms {
    alpha: f32,
    factor: f32,
    _padding: vec2<f32>,
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
    
    let alpha = uniforms.alpha;
    
    let weight1 = 1.0 - alpha;
    let weight2 = alpha;
    let gamma = 0.0;
    
    let interpolated = pixel1 * weight1 + pixel2 * weight2 + gamma;
    
    let clamped = clamp(interpolated, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped);
} 