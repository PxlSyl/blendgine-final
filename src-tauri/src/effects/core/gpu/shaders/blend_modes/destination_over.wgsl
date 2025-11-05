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
    
    if (base.a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), overlay);
        return;
    }
    
    if (base.a >= 0.9999) {
        textureStore(output_texture, vec2<u32>(pos), base);
        return;
    }
    
    if (overlay.a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), base);
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
    
    var dst_r: f32;
    var dst_g: f32;
    var dst_b: f32;
    
    if (base.a > 0.0001) {
        dst_r = base.r / base.a;
        dst_g = base.g / base.a;
        dst_b = base.b / base.a;
    } else {
        dst_r = 0.0;
        dst_g = 0.0;
        dst_b = 0.0;
    }
    
    let src_r_premult = src_r * overlay.a;
    let src_g_premult = src_g * overlay.a;
    let src_b_premult = src_b * overlay.a;
    
    let inv_dest_a = 1.0 - base.a;
    
    let result_r = base.r + src_r_premult * inv_dest_a;
    let result_g = base.g + src_g_premult * inv_dest_a;
    let result_b = base.b + src_b_premult * inv_dest_a;
    
    let result_a = base.a + overlay.a * inv_dest_a;
    
    if (result_a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(0.0, 0.0, 0.0, 0.0));
        return;
    }
    
    let final_r = result_r / result_a;
    let final_g = result_g / result_a;
    let final_b = result_b / result_a;
    
    textureStore(output_texture, vec2<u32>(pos), vec4<f32>(final_r, final_g, final_b, result_a));
}