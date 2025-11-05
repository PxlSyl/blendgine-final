@group(0) @binding(0) var frame1: texture_2d<f32>;
@group(0) @binding(1) var frame2: texture_2d<f32>;
@group(0) @binding(2) var output: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> uniforms: InterpolationUniforms;
@group(0) @binding(4) var pyramid1_level0: texture_2d<f32>;
@group(0) @binding(5) var pyramid1_level1: texture_2d<f32>;
@group(0) @binding(6) var pyramid1_level2: texture_2d<f32>;
@group(0) @binding(7) var pyramid2_level0: texture_2d<f32>;
@group(0) @binding(8) var pyramid2_level1: texture_2d<f32>;
@group(0) @binding(9) var pyramid2_level2: texture_2d<f32>;

struct InterpolationUniforms {
    alpha: f32,
    factor: f32,
    _padding: vec2<f32>,
}

fn rgba_to_gray(rgba: vec4<f32>) -> f32 {
    return 0.2126 * rgba.r + 0.7152 * rgba.g + 0.0722 * rgba.b;
}

fn compute_gradients_sobel(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> vec2<f32> {
    var grad_x = 0.0;
    var grad_y = 0.0;
    
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            let sample_pos = pos + vec2<i32>(i, j);
            
            if (sample_pos.x >= 0 && sample_pos.x < i32(size.x) && 
                sample_pos.y >= 0 && sample_pos.y < i32(size.y)) {
                
                let pixel = textureLoad(tex, sample_pos, 0);
                let gray = rgba_to_gray(pixel);
                
                var sobel_x_coeff = 0.0;
                var sobel_y_coeff = 0.0;
                
                if (i == -1 && j == -1) { sobel_x_coeff = -1.0; sobel_y_coeff = -1.0; }
                if (i == -1 && j == 0) { sobel_x_coeff = 0.0; sobel_y_coeff = -2.0; }
                if (i == -1 && j == 1) { sobel_x_coeff = 1.0; sobel_y_coeff = -1.0; }
                if (i == 0 && j == -1) { sobel_x_coeff = -2.0; sobel_y_coeff = 0.0; }
                if (i == 0 && j == 0) { sobel_x_coeff = 0.0; sobel_y_coeff = 0.0; }
                if (i == 0 && j == 1) { sobel_x_coeff = 2.0; sobel_y_coeff = 0.0; }
                if (i == 1 && j == -1) { sobel_x_coeff = -1.0; sobel_y_coeff = 1.0; }
                if (i == 1 && j == 0) { sobel_x_coeff = 0.0; sobel_y_coeff = 2.0; }
                if (i == 1 && j == 1) { sobel_x_coeff = 1.0; sobel_y_coeff = 1.0; }
                
                grad_x += gray * sobel_x_coeff;
                grad_y += gray * sobel_y_coeff;
            }
        }
    }
    
    return vec2<f32>(grad_x / 8.0, grad_y / 8.0);
}

fn farneback_optical_flow_with_pyramids(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pyramid1_level0: texture_2d<f32>,
    pyramid1_level1: texture_2d<f32>,
    pyramid1_level2: texture_2d<f32>,
    pyramid2_level0: texture_2d<f32>,
    pyramid2_level1: texture_2d<f32>,
    pyramid2_level2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let iterations = 3u;
    let poly_sigma = 1.2;
    
    var flow = vec2<f32>(0.0);
    var prev_flow = vec2<f32>(0.0);
    
    for (var level = 0u; level < 3u; level++) {
        let scale = pow(0.5, f32(level));
        let scaled_size = vec2<u32>(u32(f32(size.x) * scale), u32(f32(size.y) * scale));
        let scaled_pos = vec2<i32>(i32(f32(pos.x) * scale), i32(f32(pos.y) * scale));
        
        if (scaled_pos.x < 0 || scaled_pos.x >= i32(scaled_size.x) || 
            scaled_pos.y < 0 || scaled_pos.y >= i32(scaled_size.y)) {
            continue;
        }
        
        var grad1 = vec2<f32>(0.0);
        var grad2 = vec2<f32>(0.0);
        var gray1 = 0.0;
        var gray2 = 0.0;
        
        if (level == 0u) {
            grad1 = compute_gradients_sobel(pyramid1_level0, scaled_pos, scaled_size);
            grad2 = compute_gradients_sobel(pyramid2_level0, scaled_pos, scaled_size);
            let pixel1 = textureLoad(pyramid1_level0, scaled_pos, 0);
            let pixel2 = textureLoad(pyramid2_level0, scaled_pos, 0);
            gray1 = rgba_to_gray(pixel1);
            gray2 = rgba_to_gray(pixel2);
        } else if (level == 1u) {
            grad1 = compute_gradients_sobel(pyramid1_level1, scaled_pos, scaled_size);
            grad2 = compute_gradients_sobel(pyramid2_level1, scaled_pos, scaled_size);
            let pixel1 = textureLoad(pyramid1_level1, scaled_pos, 0);
            let pixel2 = textureLoad(pyramid2_level1, scaled_pos, 0);
            gray1 = rgba_to_gray(pixel1);
            gray2 = rgba_to_gray(pixel2);
        } else {
            grad1 = compute_gradients_sobel(pyramid1_level2, scaled_pos, scaled_size);
            grad2 = compute_gradients_sobel(pyramid2_level2, scaled_pos, scaled_size);
            let pixel1 = textureLoad(pyramid1_level2, scaled_pos, 0);
            let pixel2 = textureLoad(pyramid2_level2, scaled_pos, 0);
            gray1 = rgba_to_gray(pixel1);
            gray2 = rgba_to_gray(pixel2);
        }
        
        let Ix = (grad1.x + grad2.x) * 0.5;
        let Iy = (grad1.y + grad2.y) * 0.5;
        let It = gray2 - gray1;
        
        let Ixx = Ix * Ix;
        let Iyy = Iy * Iy;
        let Ixy = Ix * Iy;
        let Ixt = Ix * It;
        let Iyt = Iy * It;
        
        let det = Ixx * Iyy - Ixy * Ixy;
        let det_threshold = 1e-6;
        
        if (abs(det) > det_threshold) {
            let inv_det = 1.0 / det;
            let u = -(Iyy * Ixt - Ixy * Iyt) * inv_det;
            let v = -(Ixx * Iyt - Ixy * Ixt) * inv_det;
            
            let flow_magnitude = length(vec2<f32>(u, v));
            let max_flow = 10.0;
            
            if (flow_magnitude < max_flow) {
                var refined_flow = vec2<f32>(u, v);
                
                for (var iter = 0u; iter < iterations; iter++) {
                    let smooth_weight = exp(-flow_magnitude * poly_sigma);
                    refined_flow *= smooth_weight;
                }
                
                flow = prev_flow + refined_flow * scale;
                prev_flow = flow;
            }
        }
    }
    
    return flow;
}

fn bilinear_interpolate_safe(tex: texture_2d<f32>, pos: vec2<f32>, size: vec2<u32>) -> vec4<f32> {
    let x = pos.x;
    let y = pos.y;
    
    let x0 = i32(floor(x));
    let y0 = i32(floor(y));
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    
    let fx = x - f32(x0);
    let fy = y - f32(y0);
    
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
    
    return mix(p0, p1, fx);
}

fn compute_confidence(flow: vec2<f32>, grad_magnitude: f32) -> f32 {
    let flow_magnitude = length(flow);
    let max_flow = 10.0;
    let max_grad = 2.0;
    
    let flow_confidence = 1.0 - clamp(flow_magnitude / max_flow, 0.0, 1.0);
    let grad_confidence = clamp(grad_magnitude / max_grad, 0.0, 1.0);
    
    return flow_confidence * grad_confidence;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    
    let flow = farneback_optical_flow_with_pyramids(
        frame1, frame2,
        pyramid1_level0, pyramid1_level1, pyramid1_level2,
        pyramid2_level0, pyramid2_level1, pyramid2_level2,
        pos, size
    );
    
    let grad1 = compute_gradients_sobel(frame1, pos, size);
    let grad_magnitude = length(grad1);
    let confidence = compute_confidence(flow, grad_magnitude);
    
    let intermediate_flow = flow * alpha;
    let warped_pos = vec2<f32>(f32(pos.x), f32(pos.y)) + intermediate_flow;
    
    let warped_pixel1 = bilinear_interpolate_safe(frame1, warped_pos, size);
    let pixel2 = textureLoad(frame2, pos, 0);
    
    let motion_weight = clamp(confidence, 0.0, 1.0);
    let simple_blend = mix(textureLoad(frame1, pos, 0), pixel2, alpha);
    let motion_blend = mix(warped_pixel1, pixel2, alpha);
    
    let final_pixel = mix(simple_blend, motion_blend, motion_weight);
    let clamped = clamp(final_pixel, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped);
} 