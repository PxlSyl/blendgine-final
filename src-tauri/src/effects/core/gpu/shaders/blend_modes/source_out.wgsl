@group(0) @binding(0) var base_texture: texture_2d<f32>;
@group(0) @binding(1) var overlay_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pos = vec2<i32>(i32(global_id.x), i32(global_id.y));
    let output_size = textureDimensions(output_texture);
    
    if (pos.x >= i32(output_size.x) || pos.y >= i32(output_size.y)) {
        return;
    }
    
    let base = textureLoad(base_texture, vec2<u32>(pos), 0);
    let overlay = textureLoad(overlay_texture, vec2<u32>(pos), 0);
    
    let result_a = overlay.a * (1.0 - base.a);
    
    if (result_a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(0.0, 0.0, 0.0, 0.0));
        return;
    }
    
    var src_r: f32;
    var src_g: f32;
    var src_b: f32;
    
    if (overlay.a > 0.0001) {
        src_r = overlay.r / overlay.a;
        src_g = overlay.g / overlay.a;
        src_b = overlay.b / overlay.a;
    } else {
        src_r = 0.0;
        src_g = 0.0;
        src_b = 0.0;
    }
    
    let result_r = src_r * result_a;
    let result_g = src_g * result_a;
    let result_b = src_b * result_a;
    
    textureStore(output_texture, vec2<u32>(pos), vec4<f32>(result_r, result_g, result_b, result_a));
}