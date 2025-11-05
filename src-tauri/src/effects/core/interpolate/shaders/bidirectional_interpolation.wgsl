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

fn get_sobel_x_coeff(i: i32, j: i32) -> f32 {
    var coeff = 0.0;
    if (i == -1 && j == -1) { coeff = -1.0; }
    if (i == -1 && j == 0) { coeff = 0.0; }
    if (i == -1 && j == 1) { coeff = 1.0; }
    if (i == 0 && j == -1) { coeff = -2.0; }
    if (i == 0 && j == 0) { coeff = 0.0; }
    if (i == 0 && j == 1) { coeff = 2.0; }
    if (i == 1 && j == -1) { coeff = -1.0; }
    if (i == 1 && j == 0) { coeff = 0.0; }
    if (i == 1 && j == 1) { coeff = 1.0; }
    return coeff;
}

fn get_sobel_y_coeff(i: i32, j: i32) -> f32 {
    var coeff = 0.0;
    if (i == -1 && j == -1) { coeff = -1.0; }
    if (i == -1 && j == 0) { coeff = -2.0; }
    if (i == -1 && j == 1) { coeff = -1.0; }
    if (i == 0 && j == -1) { coeff = 0.0; }
    if (i == 0 && j == 0) { coeff = 0.0; }
    if (i == 0 && j == 1) { coeff = 0.0; }
    if (i == 1 && j == -1) { coeff = 1.0; }
    if (i == 1 && j == 0) { coeff = 2.0; }
    if (i == 1 && j == 1) { coeff = 1.0; }
    return coeff;
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

fn calculate_gradients_improved(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec3<f32> {
    var grad_x = 0.0;
    var grad_y = 0.0;
    var grad_t = 0.0;
    var weight_sum = 0.0;
    
    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                
                let pixel1 = textureLoad(frame1, sample_pos, 0);
                let pixel2 = textureLoad(frame2, sample_pos, 0);
                let gray1 = rgba_to_gray(pixel1);
                let gray2 = rgba_to_gray(pixel2);
                
                var local_grad_x = 0.0;
                var local_grad_y = 0.0;
                
                for (var di = -1; di <= 1; di++) {
                    for (var dj = -1; dj <= 1; dj++) {
                        let neighbor_pos = sample_pos + vec2<i32>(di, dj);
                        if (neighbor_pos.x >= 0 && neighbor_pos.x < i32(size.x) && 
                            neighbor_pos.y >= 0 && neighbor_pos.y < i32(size.y)) {
                            
                            let neighbor_pixel = textureLoad(frame1, neighbor_pos, 0);
                            let neighbor_gray = rgba_to_gray(neighbor_pixel);
                            
                            local_grad_x += neighbor_gray * get_sobel_x_coeff(di, dj);
                            local_grad_y += neighbor_gray * get_sobel_y_coeff(di, dj);
                        }
                    }
                }
                
                let weight = get_gaussian_coeff(i, j);
                
                grad_x += local_grad_x * weight;
                grad_y += local_grad_y * weight;
                grad_t += (gray2 - gray1) * weight;
                weight_sum += weight;
            }
        }
    }
    
    if (weight_sum > 0.0) {
        return vec3<f32>(grad_x / weight_sum, grad_y / weight_sum, grad_t / weight_sum);
    }
    
    return vec3<f32>(0.0);
}

fn calculate_harris_detector_improved(
    frame1: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> f32 {
    var grad_xx_sum = 0.0;
    var grad_yy_sum = 0.0;
    var grad_xy_sum = 0.0;
    var weight_sum = 0.0;
    
    for (var i = -2; i <= 2; i++) {
        for (var j = -2; j <= 2; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                
                let pixel = textureLoad(frame1, sample_pos, 0);
                let gray = rgba_to_gray(pixel);
                
                var grad_x = 0.0;
                var grad_y = 0.0;
                
                for (var di = -1; di <= 1; di++) {
                    for (var dj = -1; dj <= 1; dj++) {
                        let neighbor_pos = sample_pos + vec2<i32>(di, dj);
                        if (neighbor_pos.x >= 0 && neighbor_pos.x < i32(size.x) && 
                            neighbor_pos.y >= 0 && neighbor_pos.y < i32(size.y)) {
                            
                            let neighbor_pixel = textureLoad(frame1, neighbor_pos, 0);
                            let neighbor_gray = rgba_to_gray(neighbor_pixel);
                            
                            grad_x += neighbor_gray * get_sobel_x_coeff(di, dj);
                            grad_y += neighbor_gray * get_sobel_y_coeff(di, dj);
                        }
                    }
                }
                
                let weight = get_gaussian_coeff(i, j);
                
                grad_xx_sum += grad_x * grad_x * weight;
                grad_yy_sum += grad_y * grad_y * weight;
                grad_xy_sum += grad_x * grad_y * weight;
                weight_sum += weight;
            }
        }
    }
    
    if (weight_sum > 0.0) {
        let grad_xx = grad_xx_sum / weight_sum;
        let grad_yy = grad_yy_sum / weight_sum;
        let grad_xy = grad_xy_sum / weight_sum;
        
        let det = grad_xx * grad_yy - grad_xy * grad_xy;
        let trace = grad_xx + grad_yy;
        let harris = det - 0.04 * trace * trace;
        
        return harris;
    }
    
    return 0.0;
}

fn calc_optical_flow_farneback_improved(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let pyr_scale = 0.5;
    let levels = 5u;
    let winsize = 15u;
    let iterations = 3u;
    let poly_n = 7u;
    let poly_sigma = 1.5;
    
    var flow = vec2<f32>(0.0);
    
    for (var level = 0u; level < levels; level++) {
        let scale = pow(pyr_scale, f32(level));
        let scaled_size = vec2<u32>(u32(f32(size.x) * scale), u32(f32(size.y) * scale));
        let scaled_pos = vec2<i32>(i32(f32(pos.x) * scale), i32(f32(pos.y) * scale));
        
        if (scaled_pos.x >= 0 && scaled_pos.x < i32(scaled_size.x) && 
            scaled_pos.y >= 0 && scaled_pos.y < i32(scaled_size.y)) {
            
            let gradients = calculate_gradients_improved(frame1, frame2, scaled_pos, scaled_size);
            let grad_x = gradients.x;
            let grad_y = gradients.y;
            let grad_t = gradients.z;
            
            let grad_xx = grad_x * grad_x;
            let grad_yy = grad_y * grad_y;
            let grad_xy = grad_x * grad_y;
            let grad_xt = grad_x * grad_t;
            let grad_yt = grad_y * grad_t;
            
            let harris = calculate_harris_detector_improved(frame1, scaled_pos, scaled_size);
            
            if (harris > 0.001) {
                let det = grad_xx * grad_yy - grad_xy * grad_xy;
                let det_safe = max(det, 1e-6);
                
                let flow_x = -(grad_yy * grad_xt - grad_xy * grad_yt) / det_safe;
                let flow_y = -(grad_xx * grad_yt - grad_xy * grad_xt) / det_safe;
                
                let flow_magnitude = length(vec2<f32>(flow_x, flow_y));
                let smooth_factor = exp(-flow_magnitude * poly_sigma);
                
                var refined_flow = vec2<f32>(flow_x, flow_y);
                for (var iter = 0u; iter < iterations; iter++) {
                    refined_flow *= smooth_factor;
                }
                
                flow += refined_flow * scale;
            }
        }
    }
    
    return flow;
}

fn bilinear_interpolate_with_border(tex: texture_2d<f32>, pos: vec2<f32>, size: vec2<u32>) -> vec4<f32> {
    let x = pos.x;
    let y = pos.y;
    
    let x0 = i32(floor(x));
    let y0 = i32(floor(y));
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    
    let fx = x - f32(x0);
    let fy = y - f32(y0);
    
    let clamp_x0 = clamp(x0, 0, i32(size.x) - 1);
    let clamp_y0 = clamp(y0, 0, i32(size.y) - 1);
    let clamp_x1 = clamp(x1, 0, i32(size.x) - 1);
    let clamp_y1 = clamp(y1, 0, i32(size.y) - 1);
    
    let p00 = textureLoad(tex, vec2<i32>(clamp_x0, clamp_y0), 0);
    let p01 = textureLoad(tex, vec2<i32>(clamp_x0, clamp_y1), 0);
    let p10 = textureLoad(tex, vec2<i32>(clamp_x1, clamp_y0), 0);
    let p11 = textureLoad(tex, vec2<i32>(clamp_x1, clamp_y1), 0);
    
    let p0 = mix(p00, p01, fy);
    let p1 = mix(p10, p11, fy);
    
    return mix(p0, p1, fx);
}

fn calculate_flow_magnitude(flow: vec2<f32>) -> f32 {
    return sqrt(flow.x * flow.x + flow.y * flow.y);
}

fn calculate_confidence(flow_magnitude: f32) -> f32 {
    return exp(-flow_magnitude * 0.5);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    
    let flow_forward = calc_optical_flow_farneback_improved(frame1, frame2, pos, size);
    
    let flow_backward = calc_optical_flow_farneback_improved(frame2, frame1, pos, size);
    
    let map_x = f32(pos.x);
    let map_y = f32(pos.y);
    
    let map_x_forward = map_x + flow_forward.x * alpha;
    let map_y_forward = map_y + flow_forward.y * alpha;
    let map_x_backward = map_x - flow_backward.x * (1.0 - alpha);
    let map_y_backward = map_y - flow_backward.y * (1.0 - alpha);
    
    let frame1_warped_rgb = bilinear_interpolate_with_border(frame1, vec2<f32>(map_x_forward, map_y_forward), size);
    let frame2_warped_rgb = bilinear_interpolate_with_border(frame2, vec2<f32>(map_x_backward, map_y_backward), size);
    
    let flow_magnitude_forward = calculate_flow_magnitude(flow_forward);
    let flow_magnitude_backward = calculate_flow_magnitude(flow_backward);
    
    let clipped_forward = clamp(flow_magnitude_forward, 0.0, 100.0);
    let clipped_backward = clamp(flow_magnitude_backward, 0.0, 100.0);
    
    let base_weight1 = 1.0 - alpha;
    let base_weight2 = alpha;
    
    let confidence1 = calculate_confidence(clipped_forward);
    let confidence2 = calculate_confidence(clipped_backward);
    
    let weight1 = base_weight1 * confidence1;
    let weight2 = base_weight2 * confidence2;
    
    let weight1_final = max(weight1, 0.1);
    let weight2_final = max(weight2, 0.1);
    
    let total_weight = weight1_final + weight2_final;
    let normalized_weight1 = weight1_final / total_weight;
    let normalized_weight2 = weight2_final / total_weight;
    
    let rgb_interpolated = frame1_warped_rgb * normalized_weight1 + frame2_warped_rgb * normalized_weight2;
    
    let clamped_rgb = clamp(rgb_interpolated, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped_rgb);
} 