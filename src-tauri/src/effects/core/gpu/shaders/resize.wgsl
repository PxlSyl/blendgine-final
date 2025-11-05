struct Uniforms {
    src_width: f32,
    src_height: f32,
    dst_width: f32,
    dst_height: f32,
    algorithm: u32,
    filter_type: u32,
    super_sampling_factor: u32,
    _padding: u32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var input_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;

fn sample_nearest(uv: vec2<f32>) -> vec4<f32> {
    let tex_coord = vec2<u32>(
        min(u32(round(uv.x * (uniforms.src_width - 1.0))), u32(uniforms.src_width) - 1u),
        min(u32(round(uv.y * (uniforms.src_height - 1.0))), u32(uniforms.src_height) - 1u)
    );
    return textureLoad(input_texture, vec2<i32>(i32(tex_coord.x), i32(tex_coord.y)), 0);
}

fn sample_bilinear(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    let x0 = u32(src_pos_floor.x);
    let y0 = u32(src_pos_floor.y);
    let x1 = min(x0 + 1u, u32(uniforms.src_width) - 1u);
    let y1 = min(y0 + 1u, u32(uniforms.src_height) - 1u);
    
    let c00 = textureLoad(input_texture, vec2<i32>(i32(x0), i32(y0)), 0);
    let c10 = textureLoad(input_texture, vec2<i32>(i32(x1), i32(y0)), 0);
    let c01 = textureLoad(input_texture, vec2<i32>(i32(x0), i32(y1)), 0);
    let c11 = textureLoad(input_texture, vec2<i32>(i32(x1), i32(y1)), 0);
    
    let fx = src_pos_frac.x;
    let fy = src_pos_frac.y;
    
    let top = mix(c00, c10, fx);
    let bottom = mix(c01, c11, fx);
    
    return mix(top, bottom, fy);
}

fn sample_bicubic(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    var result = vec4<f32>(0.0);
    var total_weight = 0.0;
    
    for (var dy = -1; dy <= 2; dy++) {
        for (var dx = -1; dx <= 2; dx++) {
            let x = i32(src_pos_floor.x) + dx;
            let y = i32(src_pos_floor.y) + dy;
            
            if (x >= 0 && x < i32(uniforms.src_width) && y >= 0 && y < i32(uniforms.src_height)) {
                let weight_x = bicubic_weight(f32(dx) - src_pos_frac.x);
                let weight_y = bicubic_weight(f32(dy) - src_pos_frac.y);
                let weight = weight_x * weight_y;
                
                let pixel = textureLoad(input_texture, vec2<i32>(x, y), 0);
                result += pixel * weight;
                total_weight += weight;
            }
        }
    }
    
    return result / max(total_weight, 0.0001);
}

fn bicubic_weight(t: f32) -> f32 {
    let abs_t = abs(t);
    if (abs_t < 1.0) {
        return 0.5 * abs_t * abs_t * abs_t - abs_t * abs_t + 2.0 / 3.0;
    } else if (abs_t < 2.0) {
        return -1.0 / 6.0 * abs_t * abs_t * abs_t + abs_t * abs_t - 2.0 * abs_t + 4.0 / 3.0;
    }
    return 0.0;
}

fn hamming_weight(t: f32) -> f32 {
    let abs_t = abs(t);
    if (abs_t < 2.0) {
        let pi_t = 3.14159265359 * abs_t;
        var sinc: f32;
        if (abs_t < 1e-6) {
            sinc = 1.0;
        } else {
            sinc = sin(pi_t) / pi_t;
        }
        
        let window = 0.54 + 0.46 * cos(3.14159265359 * abs_t / 2.0);
        
        return sinc * window;
    }
    return 0.0;
}

fn mitchell_weight(t: f32) -> f32 {
    let abs_t = abs(t);
    let b = 1.0 / 3.0;
    let c = 1.0 / 3.0;
    
    if (abs_t < 1.0) {
        let t2 = abs_t * abs_t;
        let t3 = t2 * abs_t;
        return ((12.0 - 9.0 * b - 6.0 * c) * t3 + (-18.0 + 12.0 * b + 6.0 * c) * t2 + (6.0 - 2.0 * b)) / 6.0;
    } else if (abs_t < 2.0) {
        let t2 = abs_t * abs_t;
        let t3 = t2 * abs_t;
        return ((-b - 6.0 * c) * t3 + (6.0 * b + 30.0 * c) * t2 + (-12.0 * b - 48.0 * c) * abs_t + (8.0 * b + 24.0 * c)) / 6.0;
    }
    return 0.0;
}

fn gaussian_weight(t: f32) -> f32 {
    let abs_t = abs(t);
    if (abs_t < 3.0) {
        let sigma = 0.75;
        return exp(-(abs_t * abs_t) / (2.0 * sigma * sigma));
    }
    return 0.0;
}

fn sample_lanczos(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    var result = vec4<f32>(0.0);
    var total_weight = 0.0;
    
    let radius = 3.0;
    
    for (var dy = -3; dy <= 3; dy++) {
        for (var dx = -3; dx <= 3; dx++) {
            let x = i32(src_pos_floor.x) + dx;
            let y = i32(src_pos_floor.y) + dy;
            
            if (x >= 0 && x < i32(uniforms.src_width) && y >= 0 && y < i32(uniforms.src_height)) {
                let dist_x = f32(dx) - src_pos_frac.x;
                let dist_y = f32(dy) - src_pos_frac.y;
                
                let weight_x = lanczos_weight(dist_x, radius);
                let weight_y = lanczos_weight(dist_y, radius);
                let weight = weight_x * weight_y;
                
                let pixel = textureLoad(input_texture, vec2<i32>(x, y), 0);
                result += pixel * weight;
                total_weight += weight;
            }
        }
    }
    
    return result / max(total_weight, 0.0001);
}

fn sample_hamming(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    var result = vec4<f32>(0.0);
    var total_weight = 0.0;
    
    for (var dy = -2; dy <= 2; dy++) {
        for (var dx = -2; dx <= 2; dx++) {
            let x = i32(src_pos_floor.x) + dx;
            let y = i32(src_pos_floor.y) + dy;
            
            if (x >= 0 && x < i32(uniforms.src_width) && y >= 0 && y < i32(uniforms.src_height)) {
                let dist_x = f32(dx) - src_pos_frac.x;
                let dist_y = f32(dy) - src_pos_frac.y;
                
                let weight_x = hamming_weight(dist_x);
                let weight_y = hamming_weight(dist_y);
                let weight = weight_x * weight_y;
                
                let pixel = textureLoad(input_texture, vec2<i32>(x, y), 0);
                result += pixel * weight;
                total_weight += weight;
            }
        }
    }
    
    return result / max(total_weight, 0.0001);
}

fn sample_mitchell(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    var result = vec4<f32>(0.0);
    var total_weight = 0.0;
    
    for (var dy = -2; dy <= 2; dy++) {
        for (var dx = -2; dx <= 2; dx++) {
            let x = i32(src_pos_floor.x) + dx;
            let y = i32(src_pos_floor.y) + dy;
            
            if (x >= 0 && x < i32(uniforms.src_width) && y >= 0 && y < i32(uniforms.src_height)) {
                let dist_x = f32(dx) - src_pos_frac.x;
                let dist_y = f32(dy) - src_pos_frac.y;
                
                let weight_x = mitchell_weight(dist_x);
                let weight_y = mitchell_weight(dist_y);
                let weight = weight_x * weight_y;
                
                let pixel = textureLoad(input_texture, vec2<i32>(x, y), 0);
                result += pixel * weight;
                total_weight += weight;
            }
        }
    }
    
    return result / max(total_weight, 0.0001);
}

fn sample_gaussian(uv: vec2<f32>) -> vec4<f32> {
    let src_pos = uv * vec2<f32>(uniforms.src_width - 1.0, uniforms.src_height - 1.0);
    let src_pos_floor = floor(src_pos);
    let src_pos_frac = src_pos - src_pos_floor;
    
    var result = vec4<f32>(0.0);
    var total_weight = 0.0;
    
    for (var dy = -3; dy <= 3; dy++) {
        for (var dx = -3; dx <= 3; dx++) {
            let x = i32(src_pos_floor.x) + dx;
            let y = i32(src_pos_floor.y) + dy;
            
            if (x >= 0 && x < i32(uniforms.src_width) && y >= 0 && y < i32(uniforms.src_height)) {
                let dist_x = f32(dx) - src_pos_frac.x;
                let dist_y = f32(dy) - src_pos_frac.y;
                
                let weight_x = gaussian_weight(dist_x);
                let weight_y = gaussian_weight(dist_y);
                let weight = weight_x * weight_y;
                
                let pixel = textureLoad(input_texture, vec2<i32>(x, y), 0);
                result += pixel * weight;
                total_weight += weight;
            }
        }
    }
    
    return result / max(total_weight, 0.0001);
}

fn lanczos_weight(t: f32, radius: f32) -> f32 {
    if (abs(t) >= radius) {
        return 0.0;
    }
    
    if (abs(t) < 1e-6) {
        return 1.0;
    }
    
    let pi_t = 3.14159265359 * t;
    let pi_t_over_radius = pi_t / radius;
    
    return (radius * sin(pi_t) * sin(pi_t_over_radius)) / max(pi_t * pi_t, 1e-6);
}

fn apply_filter(uv: vec2<f32>) -> vec4<f32> {
    if (uniforms.filter_type == 0u) {
        return sample_nearest(uv);
    } else if (uniforms.filter_type == 1u) {
        return sample_bilinear(uv);
    } else if (uniforms.filter_type == 2u) {
        return sample_bicubic(uv);
    } else if (uniforms.filter_type == 3u) {
        return sample_lanczos(uv);
    } else if (uniforms.filter_type == 4u) {
        return sample_hamming(uv);
    } else if (uniforms.filter_type == 5u) {
        return sample_mitchell(uv);
    } else if (uniforms.filter_type == 6u) {
        return sample_gaussian(uv);
    } else {
        return sample_lanczos(uv);
    }
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(output_texture);
    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }
    
    let dst_x = f32(global_id.x);
    let dst_y = f32(global_id.y);
    
    let uv = (vec2<f32>(dst_x + 0.5, dst_y + 0.5)) / vec2<f32>(uniforms.dst_width, uniforms.dst_height);
    
    var result: vec4<f32>;
    
    if (uniforms.algorithm == 0u) {
        result = sample_nearest(uv);
    } else if (uniforms.algorithm == 1u) {
        result = apply_filter(uv);
    } else if (uniforms.algorithm == 2u) {
        result = apply_filter(uv);
    } else if (uniforms.algorithm == 3u) {
        var super_result = vec4<f32>(0.0);
        let factor = f32(uniforms.super_sampling_factor);
        
        for (var sy = 0.0; sy < factor; sy += 1.0) {
            for (var sx = 0.0; sx < factor; sx += 1.0) {
                let offset_x = (sx + 0.5) / factor - 0.5;
                let offset_y = (sy + 0.5) / factor - 0.5;
                let offset_uv = uv + vec2<f32>(
                    offset_x / uniforms.src_width,
                    offset_y / uniforms.src_height
                );
                
                let sample_result = apply_filter(offset_uv);
                super_result += sample_result;
            }
        }
        result = super_result / (factor * factor);
    } else {
        result = apply_filter(uv);
    }
    
    textureStore(output_texture, vec2<u32>(global_id.xy), result);
}
