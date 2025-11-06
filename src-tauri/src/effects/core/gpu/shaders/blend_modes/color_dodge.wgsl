@group(0) @binding(0) var base_texture: texture_2d<f32>;
@group(0) @binding(1) var overlay_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> opacity_buffer: OpacityUniform;

struct OpacityUniform {
    opacity: f32,
}

fn color_dodge_channel(source: f32, destination: f32) -> f32 {
    if (source >= 1.0) {
        return 1.0;
    }
    if (destination <= 0.0) {
        return 0.0;
    }
    if (source <= 0.0) {
        return destination;
    }
    return min(1.0, destination / (1.0 - source));
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
        
        let dodge_r = color_dodge_channel(src_r, dst_r);
        let dodge_g = color_dodge_channel(src_g, dst_g);
        let dodge_b = color_dodge_channel(src_b, dst_b);
        
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(dodge_r, dodge_g, dodge_b, overlay_alpha));
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
    
    let dodge_r = color_dodge_channel(src_r, dst_r);
    let dodge_g = color_dodge_channel(src_g, dst_g);
    let dodge_b = color_dodge_channel(src_b, dst_b);
    
    let dodge_r_premult = dodge_r * overlay_alpha;
    let dodge_g_premult = dodge_g * overlay_alpha;
    let dodge_b_premult = dodge_b * overlay_alpha;
    
    let inv_source_a = 1.0 - overlay_alpha;
    
    let result_r = dodge_r_premult + base.r * inv_source_a;
    let result_g = dodge_g_premult + base.g * inv_source_a;
    let result_b = dodge_b_premult + base.b * inv_source_a;
    
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