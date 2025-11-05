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

fn compute_block_similarity(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    block_center: vec2<i32>,
    search_offset: vec2<i32>,
    block_size: u32,
    size: vec2<u32>
) -> f32 {
    var similarity = 0.0;
    var pixel_count = 0.0;
    
    let half_block = i32(block_size) / 2;
    
    for (var i = -half_block; i <= half_block; i++) {
        for (var j = -half_block; j <= half_block; j++) {
            let pos1 = block_center + vec2<i32>(i, j);
            let pos2 = block_center + search_offset + vec2<i32>(i, j);
            
            if (pos1.x >= 0 && pos1.x < i32(size.x) && pos1.y >= 0 && pos1.y < i32(size.y) &&
                pos2.x >= 0 && pos2.x < i32(size.x) && pos2.y >= 0 && pos2.y < i32(size.y)) {
                
                let pixel1 = rgba_to_gray(textureLoad(frame1, pos1, 0));
                let pixel2 = rgba_to_gray(textureLoad(frame2, pos2, 0));
                
                let diff = abs(pixel1 - pixel2);
                similarity += diff;
                pixel_count += 1.0;
            }
        }
    }
    
    if (pixel_count > 0.0) {
        return similarity / pixel_count;
    }
    
    return 1e6;
}

fn find_best_block_match(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    block_center: vec2<i32>,
    block_size: u32,
    search_radius: u32,
    size: vec2<u32>
) -> vec2<f32> {
    var best_offset = vec2<f32>(0.0);
    var best_similarity = 1e6;
    
    for (var i = -i32(search_radius); i <= i32(search_radius); i++) {
        for (var j = -i32(search_radius); j <= i32(search_radius); j++) {
            let search_offset = vec2<i32>(i, j);
            let similarity = compute_block_similarity(frame1, frame2, block_center, search_offset, block_size, size);
            
            if (similarity < best_similarity) {
                best_similarity = similarity;
                best_offset = vec2<f32>(f32(i), f32(j));
            }
        }
    }
    
    return best_offset;
}

fn compute_block_motion_vector(
    frame1: texture_2d<f32>,
    frame2: texture_2d<f32>,
    pos: vec2<i32>,
    size: vec2<u32>
) -> vec2<f32> {
    let block_size = 8u;
    let search_radius = 4u;
    
    let block_center = pos;
    let motion_vector = find_best_block_match(frame1, frame2, block_center, block_size, search_radius, size);
    
    let motion_magnitude = length(motion_vector);
    let max_motion = 10.0;
    
    if (motion_magnitude > max_motion) {
        return normalize(motion_vector) * max_motion;
    }
    
    return motion_vector;
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

fn simple_noise(pos: vec2<f32>) -> f32 {
    return fract(sin(dot(pos, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn compute_block_confidence(motion_vector: vec2<f32>, block_center: vec2<i32>, size: vec2<u32>) -> f32 {
    let motion_magnitude = length(motion_vector);
    let max_motion = 10.0;
    
    let motion_confidence = 1.0 - clamp(motion_magnitude / max_motion, 0.0, 1.0);
    
    let edge_distance = min(
        min(f32(block_center.x), f32(block_center.y)),
        min(f32(size.x) - f32(block_center.x), f32(size.y) - f32(block_center.y))
    );
    let border_confidence = clamp(edge_distance / 10.0, 0.0, 1.0);
    
    return motion_confidence * border_confidence;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    
    let motion_vector = compute_block_motion_vector(frame1, frame2, pos, size);
    let confidence = compute_block_confidence(motion_vector, pos, size);
    
    let interpolated_motion = motion_vector * alpha;
    let warped_pos = vec2<f32>(f32(pos.x), f32(pos.y)) + interpolated_motion;
    
    let warped_pixel1 = bilinear_interpolate_with_border(frame1, warped_pos, size);
    let warped_pixel2 = bilinear_interpolate_with_border(frame2, warped_pos, size);
    
    let motion_blend = mix(warped_pixel1, warped_pixel2, alpha);
    let simple_blend = mix(textureLoad(frame1, pos, 0), textureLoad(frame2, pos, 0), alpha);
    
    let final_pixel = mix(simple_blend, motion_blend, confidence);
    let clamped = clamp(final_pixel, vec4<f32>(0.0), vec4<f32>(1.0));
    
    textureStore(output, pos, clamped);
} 