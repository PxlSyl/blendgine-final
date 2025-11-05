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

fn compute_gradient_sobel(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> vec2<f32> {
    var grad_x = 0.0;
    var grad_y = 0.0;
    
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                let pixel = rgba_to_gray(textureLoad(tex, sample_pos, 0));
                
                var sobel_x_coeff = 0.0;
                var sobel_y_coeff = 0.0;
                
                if (i == -1 && j == -1) { sobel_x_coeff = -1.0; sobel_y_coeff = -1.0; }
                else if (i == 0 && j == -1) { sobel_x_coeff = 0.0; sobel_y_coeff = -2.0; }
                else if (i == 1 && j == -1) { sobel_x_coeff = 1.0; sobel_y_coeff = -1.0; }
                else if (i == -1 && j == 0) { sobel_x_coeff = -2.0; sobel_y_coeff = 0.0; }
                else if (i == 0 && j == 0) { sobel_x_coeff = 0.0; sobel_y_coeff = 0.0; }
                else if (i == 1 && j == 0) { sobel_x_coeff = 2.0; sobel_y_coeff = 0.0; }
                else if (i == -1 && j == 1) { sobel_x_coeff = -1.0; sobel_y_coeff = 1.0; }
                else if (i == 0 && j == 1) { sobel_x_coeff = 0.0; sobel_y_coeff = 2.0; }
                else if (i == 1 && j == 1) { sobel_x_coeff = 1.0; sobel_y_coeff = 1.0; }
                
                grad_x += pixel * sobel_x_coeff;
                grad_y += pixel * sobel_y_coeff;
            }
        }
    }
    
    return vec2<f32>(grad_x / 8.0, grad_y / 8.0);
}

fn compute_harris_corner_detector(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> f32 {
    var Ixx = 0.0;
    var Iyy = 0.0;
    var Ixy = 0.0;
    var weight_sum = 0.0;
    
    let window_size = 5;
    let sigma = 1.0;
    
    for (var i = -window_size/2; i <= window_size/2; i++) {
        for (var j = -window_size/2; j <= window_size/2; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                
                let grad = compute_gradient_sobel(tex, sample_pos, size);
                let gaussian_weight = exp(-(f32(i*i + j*j)) / (2.0 * sigma * sigma));
                
                Ixx += grad.x * grad.x * gaussian_weight;
                Iyy += grad.y * grad.y * gaussian_weight;
                Ixy += grad.x * grad.y * gaussian_weight;
                weight_sum += gaussian_weight;
            }
        }
    }
    
    if (weight_sum > 0.0) {
        Ixx /= weight_sum;
        Iyy /= weight_sum;
        Ixy /= weight_sum;
        
        let det = Ixx * Iyy - Ixy * Ixy;
        let trace = Ixx + Iyy;
        let k = 0.04;
        let harris_response = det - k * trace * trace;
        
        return harris_response;
    }
    
    return 0.0;
}

fn compute_lucas_kanade_flow(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let window_size = 7;
    var A_00 = 0.0;
    var A_01 = 0.0;
    var A_10 = 0.0;
    var A_11 = 0.0;
    var b = vec2<f32>(0.0);
    var weight_sum = 0.0;
    
    for (var i = -window_size/2; i <= window_size/2; i++) {
        for (var j = -window_size/2; j <= window_size/2; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                
                let grad1 = compute_gradient_sobel(frame1, sample_pos, size);
                let grad2 = compute_gradient_sobel(frame2, sample_pos, size);
                
                let Ix = (grad1.x + grad2.x) * 0.5;
                let Iy = (grad1.y + grad2.y) * 0.5;
                
                let pixel1 = rgba_to_gray(textureLoad(frame1, sample_pos, 0));
                let pixel2 = rgba_to_gray(textureLoad(frame2, sample_pos, 0));
                let It = pixel2 - pixel1;
                
                let gaussian_weight = exp(-(f32(i*i + j*j)) / (2.0 * 2.0));
                
                A_00 += Ix * Ix * gaussian_weight;
                A_01 += Ix * Iy * gaussian_weight;
                A_10 += Ix * Iy * gaussian_weight;
                A_11 += Iy * Iy * gaussian_weight;
                
                b.x += -Ix * It * gaussian_weight;
                b.y += -Iy * It * gaussian_weight;
                
                weight_sum += gaussian_weight;
            }
        }
    }
    
    if (weight_sum > 0.0) {
        A_00 /= weight_sum;
        A_01 /= weight_sum;
        A_10 /= weight_sum;
        A_11 /= weight_sum;
        b.x /= weight_sum;
        b.y /= weight_sum;
        
        let det = A_00 * A_11 - A_01 * A_10;
        let min_eigenvalue = 0.001;
        
        if (abs(det) > min_eigenvalue) {
            let inv_det = 1.0 / det;
            let u = (A_11 * b.x - A_01 * b.y) * inv_det;
            let v = (-A_10 * b.x + A_00 * b.y) * inv_det;
            
            let flow_magnitude = length(vec2<f32>(u, v));
            let max_flow = 10.0;
            
            if (flow_magnitude < max_flow) {
                return vec2<f32>(u, v);
            }
        }
    }
    
    return vec2<f32>(0.0);
}

fn bilinear_interpolate_with_border(tex: texture_2d<f32>, pos: vec2<f32>, size: vec2<u32>) -> vec4<f32> {
    let x = pos.x;
    let y = pos.y;
    
    let x0 = i32(floor(x));
    let y0 = i32(floor(y));
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    
    let fx = x - floor(x);
    let fy = y - floor(y);
    
    let x0_clamped = clamp(x0, 0, i32(size.x) - 1);
    let y0_clamped = clamp(y0, 0, i32(size.y) - 1);
    let x1_clamped = clamp(x1, 0, i32(size.x) - 1);
    let y1_clamped = clamp(y1, 0, i32(size.y) - 1);
    
    let p00 = textureLoad(tex, vec2<i32>(x0_clamped, y0_clamped), 0);
    let p01 = textureLoad(tex, vec2<i32>(x0_clamped, y1_clamped), 0);
    let p10 = textureLoad(tex, vec2<i32>(x1_clamped, y0_clamped), 0);
    let p11 = textureLoad(tex, vec2<i32>(x1_clamped, y1_clamped), 0);
    
    let p0 = mix(p00, p01, fy);
    let p1 = mix(p10, p11, fy);
    let result = mix(p0, p1, fx);
    
    return result;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    
    let harris_response = compute_harris_corner_detector(frame1, pos, size);
    let harris_threshold = 0.01;
    
    let flow = compute_lucas_kanade_flow(frame1, frame2, pos, size);
    let flow_magnitude = length(flow);
    
    let feature_confidence = clamp(harris_response / harris_threshold, 0.0, 1.0);
    let flow_confidence = 1.0 - clamp(flow_magnitude / 10.0, 0.0, 1.0);
    let total_confidence = feature_confidence * flow_confidence;
    
    let interpolated_pos = vec2<f32>(f32(pos.x), f32(pos.y)) + flow * alpha;
    
    let warped_pixel1 = bilinear_interpolate_with_border(frame1, interpolated_pos, size);
    let warped_pixel2 = bilinear_interpolate_with_border(frame2, interpolated_pos, size);
    
    let motion_blend = mix(warped_pixel1, warped_pixel2, alpha);
    let simple_blend = mix(textureLoad(frame1, pos, 0), textureLoad(frame2, pos, 0), alpha);
    
    let final_pixel = mix(simple_blend, motion_blend, total_confidence);
    let clamped = clamp(final_pixel, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped);
} 