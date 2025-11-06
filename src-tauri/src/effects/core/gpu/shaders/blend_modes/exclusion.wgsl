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
    let overlay = textureLoad(overlay_texture, vec2<u32>(pos), 0);
    
    let overlay_alpha = overlay.a * opacity_buffer.opacity;
    
    if (overlay_alpha <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), base);
        return;
    }
    
    if (overlay_alpha >= 0.9999) {
        let src_r = overlay.r / overlay.a;
        let src_g = overlay.g / overlay.a;
        let src_b = overlay.b / overlay.a;
        
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
        
        let exclusion_r = src_r + dst_r - 2.0 * src_r * dst_r;
        let exclusion_g = src_g + dst_g - 2.0 * src_g * dst_g;
        let exclusion_b = src_b + dst_b - 2.0 * src_b * dst_b;
        
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(exclusion_r, exclusion_g, exclusion_b, overlay_alpha));
        return;
    }
    
    if (base.a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(overlay.rgb, overlay_alpha));
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
    
    let exclusion_r = src_r + dst_r - 2.0 * src_r * dst_r;
    let exclusion_g = src_g + dst_g - 2.0 * src_g * dst_g;
    let exclusion_b = src_b + dst_b - 2.0 * src_b * dst_b;
    
    let exclusion_r_premult = exclusion_r * overlay_alpha;
    let exclusion_g_premult = exclusion_g * overlay_alpha;
    let exclusion_b_premult = exclusion_b * overlay_alpha;
    
    let inv_source_a = 1.0 - overlay_alpha;
    
    let result_r = exclusion_r_premult + base.r * inv_source_a;
    let result_g = exclusion_g_premult + base.g * inv_source_a;
    let result_b = exclusion_b_premult + base.b * inv_source_a;
    
    let result_a = overlay_alpha + base.a * inv_source_a;
    
    if (result_a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(0.0, 0.0, 0.0, 0.0));
        return;
    }
    
    let final_r = result_r / result_a;
    let final_g = result_g / result_a;
    let final_b = result_b / result_a;
    
    textureStore(output_texture, vec2<u32>(pos), vec4<f32>(final_r, final_g, final_b, result_a));
}