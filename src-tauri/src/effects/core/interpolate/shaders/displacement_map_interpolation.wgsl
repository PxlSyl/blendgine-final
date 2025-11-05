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

fn compute_displacement_field(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let grad1 = compute_gradient_sobel(frame1, pos, size);
    let grad2 = compute_gradient_sobel(frame2, pos, size);
    
    let pixel1 = rgba_to_gray(textureLoad(frame1, pos, 0));
    let pixel2 = rgba_to_gray(textureLoad(frame2, pos, 0));
    let intensity_diff = pixel2 - pixel1;
    
    let grad_avg = (grad1 + grad2) * 0.5;
    let grad_magnitude = length(grad_avg);
    
    if (grad_magnitude > 0.001) {
        let normalized_grad = grad_avg / grad_magnitude;
        let displacement_magnitude = intensity_diff * 2.0;
        let max_displacement = 5.0;
        
        let clamped_magnitude = clamp(displacement_magnitude, -max_displacement, max_displacement);
        return normalized_grad * clamped_magnitude;
    }
    
    return vec2<f32>(0.0);
}

fn compute_laplacian(tex: texture_2d<f32>, pos: vec2<i32>, size: vec2<u32>) -> f32 {
    var laplacian = 0.0;
    let center_pixel = rgba_to_gray(textureLoad(tex, pos, 0));
    
    let offset1 = vec2<i32>(-1, 0);
    let offset2 = vec2<i32>(1, 0);
    let offset3 = vec2<i32>(0, -1);
    let offset4 = vec2<i32>(0, 1);
    
    let neighbor1 = pos + offset1;
    let neighbor2 = pos + offset2;
    let neighbor3 = pos + offset3;
    let neighbor4 = pos + offset4;
    
    if (neighbor1.x >= 0 && neighbor1.x < i32(size.x) && neighbor1.y >= 0 && neighbor1.y < i32(size.y)) {
        let neighbor_pixel = rgba_to_gray(textureLoad(tex, neighbor1, 0));
        laplacian += neighbor_pixel - center_pixel;
    }
    
    if (neighbor2.x >= 0 && neighbor2.x < i32(size.x) && neighbor2.y >= 0 && neighbor2.y < i32(size.y)) {
        let neighbor_pixel = rgba_to_gray(textureLoad(tex, neighbor2, 0));
        laplacian += neighbor_pixel - center_pixel;
    }
    
    if (neighbor3.x >= 0 && neighbor3.x < i32(size.x) && neighbor3.y >= 0 && neighbor3.y < i32(size.y)) {
        let neighbor_pixel = rgba_to_gray(textureLoad(tex, neighbor3, 0));
        laplacian += neighbor_pixel - center_pixel;
    }
    
    if (neighbor4.x >= 0 && neighbor4.x < i32(size.x) && neighbor4.y >= 0 && neighbor4.y < i32(size.y)) {
        let neighbor_pixel = rgba_to_gray(textureLoad(tex, neighbor4, 0));
        laplacian += neighbor_pixel - center_pixel;
    }
    
    return laplacian;
}

fn compute_curvature_field(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let laplacian1 = compute_laplacian(frame1, pos, size);
    let laplacian2 = compute_laplacian(frame2, pos, size);
    let laplacian_diff = laplacian2 - laplacian1;
    
    let grad = compute_gradient_sobel(frame1, pos, size);
    let grad_magnitude = length(grad);
    
    if (grad_magnitude > 0.001) {
        let normalized_grad = grad / grad_magnitude;
        let curvature_magnitude = laplacian_diff * 0.5;
        let max_curvature = 3.0;
        
        let clamped_magnitude = clamp(curvature_magnitude, -max_curvature, max_curvature);
        return normalized_grad * clamped_magnitude;
    }
    
    return vec2<f32>(0.0);
}

fn compute_combined_displacement(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let intensity_displacement = compute_displacement_field(frame1, frame2, pos, size);
    let curvature_displacement = compute_curvature_field(frame1, frame2, pos, size);
    
    let combined = intensity_displacement + curvature_displacement * 0.3;
    let max_displacement = 8.0;
    let displacement_magnitude = length(combined);
    
    if (displacement_magnitude > max_displacement) {
        return normalize(combined) * max_displacement;
    }
    
    return combined;
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
    
    return mix(p0, p1, fx);
}

fn compute_displacement_confidence(displacement: vec2<f32>, pos: vec2<i32>, size: vec2<u32>) -> f32 {
    let displacement_magnitude = length(displacement);
    let max_displacement = 8.0;
    
    let displacement_confidence = 1.0 - clamp(displacement_magnitude / max_displacement, 0.0, 1.0);
    
    let edge_distance = min(
        min(f32(pos.x), f32(pos.y)),
        min(f32(size.x) - f32(pos.x), f32(size.y) - f32(pos.y))
    );
    let border_confidence = clamp(edge_distance / 10.0, 0.0, 1.0);
    
    let grad = compute_gradient_sobel(frame1, pos, size);
    let grad_magnitude = length(grad);
    let gradient_confidence = clamp(grad_magnitude / 2.0, 0.0, 1.0);
    
    return displacement_confidence * border_confidence * gradient_confidence;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    
    let displacement = compute_combined_displacement(frame1, frame2, pos, size);
    let confidence = compute_displacement_confidence(displacement, pos, size);
    
    let interpolated_displacement = displacement * alpha;
    let warped_pos = vec2<f32>(f32(pos.x), f32(pos.y)) + interpolated_displacement;
    
    let warped_pixel1 = bilinear_interpolate_with_border(frame1, warped_pos, size);
    let warped_pixel2 = bilinear_interpolate_with_border(frame2, warped_pos, size);
    
    let displacement_blend = mix(warped_pixel1, warped_pixel2, alpha);
    let simple_blend = mix(textureLoad(frame1, pos, 0), textureLoad(frame2, pos, 0), alpha);
    
    let final_pixel = mix(simple_blend, displacement_blend, confidence);
    let clamped = clamp(final_pixel, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped);
} 