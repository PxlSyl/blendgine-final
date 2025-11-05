@group(0) @binding(0) var base_texture: texture_2d<f32>;
@group(0) @binding(1) var overlay_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;

fn rgb_to_hsl(rgb: vec3<f32>) -> vec3<f32> {
    let max_val = max(max(rgb.r, rgb.g), rgb.b);
    let min_val = min(min(rgb.r, rgb.g), rgb.b);
    let delta = max_val - min_val;
    
    var h: f32 = 0.0;
    let l: f32 = (max_val + min_val) * 0.5;
    var s: f32 = 0.0;
    
    if (delta != 0.0) {
        if (l < 0.5) {
            s = delta / (max_val + min_val);
        } else {
            s = delta / (2.0 - max_val - min_val);
        }
        
        if (max_val == rgb.r) {
            if (rgb.g < rgb.b) {
                h = (rgb.g - rgb.b) / delta + 6.0;
            } else {
                h = (rgb.g - rgb.b) / delta + 0.0;
            }
        } else if (max_val == rgb.g) {
            h = (rgb.b - rgb.r) / delta + 2.0;
        } else {
            h = (rgb.r - rgb.g) / delta + 4.0;
        }
        h = h / 6.0;
    }
    
    return vec3<f32>(h, s, l);
}

fn hsl_to_rgb(hsl: vec3<f32>) -> vec3<f32> {
    let h = hsl.x;
    let s = hsl.y;
    let l = hsl.z;
    
    if (s == 0.0) {
        return vec3<f32>(l, l, l);
    }
    
    var q: f32;
    if (l < 0.5) {
        q = l * (1.0 + s);
    } else {
        q = l + s - l * s;
    }
    let p = 2.0 * l - q;
    
    var r = h + 1.0/3.0;
    var g = h;
    var b = h - 1.0/3.0;
    
    if (r > 1.0) { r = r - 1.0; }
    if (g > 1.0) { g = g - 1.0; }
    if (b > 1.0) { b = b - 1.0; }
    
    if (r < 0.0) { r = r + 1.0; }
    if (g < 0.0) { g = g + 1.0; }
    if (b < 0.0) { b = b + 1.0; }
    
    var result_r: f32;
    var result_g: f32;
    var result_b: f32;
    
    if (r < 1.0/6.0) {
        result_r = p + (q - p) * 6.0 * r;
    } else if (r < 1.0/2.0) {
        result_r = q;
    } else if (r < 2.0/3.0) {
        result_r = p + (q - p) * (2.0/3.0 - r) * 6.0;
    } else {
        result_r = p;
    }
    
    if (g < 1.0/6.0) {
        result_g = p + (q - p) * 6.0 * g;
    } else if (g < 1.0/2.0) {
        result_g = q;
    } else if (g < 2.0/3.0) {
        result_g = p + (q - p) * (2.0/3.0 - g) * 6.0;
    } else {
        result_g = p;
    }
    
    if (b < 1.0/6.0) {
        result_b = p + (q - p) * 6.0 * b;
    } else if (b < 1.0/2.0) {
        result_b = q;
    } else if (b < 2.0/3.0) {
        result_b = p + (q - p) * (2.0/3.0 - b) * 6.0;
    } else {
        result_b = p;
    }
    
    return vec3<f32>(result_r, result_g, result_b);
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
    
    if (overlay.a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), base);
        return;
    }
    
    if (overlay.a >= 0.9999) {
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
        
        let src_hsl = rgb_to_hsl(vec3<f32>(src_r, src_g, src_b));
        let dst_hsl = rgb_to_hsl(vec3<f32>(dst_r, dst_g, dst_b));
        
        let blended_hsl = vec3<f32>(src_hsl.x, src_hsl.y, dst_hsl.z);
        let blended_rgb = hsl_to_rgb(blended_hsl);
        
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(blended_rgb, overlay.a));
        return;
    }
    
    if (base.a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), overlay);
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
    
    let src_hsl = rgb_to_hsl(vec3<f32>(src_r, src_g, src_b));
    let dst_hsl = rgb_to_hsl(vec3<f32>(dst_r, dst_g, dst_b));
    
    let blended_hsl = vec3<f32>(src_hsl.x, src_hsl.y, dst_hsl.z);
    let blended_rgb = hsl_to_rgb(blended_hsl);
    
    let blend_r_premult = blended_rgb.r * overlay.a;
    let blend_g_premult = blended_rgb.g * overlay.a;
    let blend_b_premult = blended_rgb.b * overlay.a;
    
    let inv_source_a = 1.0 - overlay.a;
    
    let result_r = blend_r_premult + base.r * inv_source_a;
    let result_g = blend_g_premult + base.g * inv_source_a;
    let result_b = blend_b_premult + base.b * inv_source_a;
    
    let result_a = overlay.a + base.a * inv_source_a;
    
    if (result_a <= 0.0001) {
        textureStore(output_texture, vec2<u32>(pos), vec4<f32>(0.0, 0.0, 0.0, 0.0));
        return;
    }
    
    let final_r = result_r / result_a;
    let final_g = result_g / result_a;
    let final_b = result_b / result_a;
    
    textureStore(output_texture, vec2<u32>(pos), vec4<f32>(final_r, final_g, final_b, result_a));
}