@group(0) @binding(0) var base_texture: texture_2d<f32>;
@group(0) @binding(1) var overlay_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> opacity_buffer: OpacityUniform;

struct OpacityUniform {
    opacity: f32,
}

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pos = vec2<i32>(i32(global_id.x), i32(global_id.y));
    let output_size = textureDimensions(output_texture);
    
    if (pos.x >= i32(output_size.x) || pos.y >= i32(output_size.y)) {
        return;
    }
    
    let base = textureLoad(base_texture, vec2<u32>(pos), 0);
    var overlay = textureLoad(overlay_texture, vec2<u32>(pos), 0);
    
    overlay = vec4<f32>(overlay.rgb, overlay.a * opacity_buffer.opacity);
    
    let result_r_premult = min(overlay.r + base.r, 1.0);
    let result_g_premult = min(overlay.g + base.g, 1.0);
    let result_b_premult = min(overlay.b + base.b, 1.0);
    
    let result_a = min(overlay.a + base.a - overlay.a * base.a, 1.0);
    
    if (result_a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(0.0, 0.0, 0.0, 0.0));
        return;
    }
    
    let final_r = result_r_premult / result_a;
    let final_g = result_g_premult / result_a;
    let final_b = result_b_premult / result_a;
    
    textureStore(output_texture, vec2<u32>(pos), vec4<f32>(final_r, final_g, final_b, result_a));
}