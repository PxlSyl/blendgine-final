@group(0) @binding(0) var frame1: texture_2d<f32>;
@group(0) @binding(1) var frame2: texture_2d<f32>;
@group(0) @binding(2) var output: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> uniforms: InterpolationUniforms;

struct InterpolationUniforms {
    alpha: f32,
    factor: f32,
    _padding: vec2<f32>,
}

fn rgba_to_luminance(rgba: vec4<f32>) -> f32 {
    return 0.2126 * rgba.r + 0.7152 * rgba.g + 0.0722 * rgba.b;
}

fn hash_noise(pos: vec2<f32>) -> f32 {
    return fract(sin(dot(pos, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn perlin_noise(pos: vec2<f32>) -> f32 {
    let i = floor(pos);
    let f = fract(pos);
    let u = f * f * (3.0 - 2.0 * f);
    
    let a = hash_noise(i);
    let b = hash_noise(i + vec2<f32>(1.0, 0.0));
    let c = hash_noise(i + vec2<f32>(0.0, 1.0));
    let d = hash_noise(i + vec2<f32>(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fractal_noise(pos: vec2<f32>, octaves: u32) -> f32 {
    var noise = 0.0;
    var amplitude = 1.0;
    var frequency = 1.0;
    var max_value = 0.0;
    
    for (var i = 0u; i < octaves; i++) {
        noise += perlin_noise(pos * frequency) * amplitude;
        max_value += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return noise / max_value;
}

fn particle_diffusion_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let normalized_pos = pos / vec2<f32>(f32(size.x), f32(size.y));
    
    let base_noise = fractal_noise(normalized_pos * 8.0, 4u);
    let detail_noise = fractal_noise(normalized_pos * 16.0, 2u);
    
    let particle_density = base_noise * 0.7 + detail_noise * 0.3;
    let diffusion_factor = alpha * 2.0;
    
    let particle_threshold = 1.0 - diffusion_factor;
    let particle_mask = step(particle_threshold, particle_density);
    
    return particle_mask * (particle_density - particle_threshold) / (1.0 - particle_threshold);
}

fn multi_threshold_dissolve_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let normalized_pos = pos / vec2<f32>(f32(size.x), f32(size.y));
    
    let noise1 = fractal_noise(normalized_pos * 4.0, 3u);
    let noise2 = fractal_noise(normalized_pos * 8.0, 2u);
    let noise3 = fractal_noise(normalized_pos * 16.0, 1u);
    
    let threshold1 = alpha * 0.3;
    let threshold2 = alpha * 0.6;
    let threshold3 = alpha * 0.9;
    
    let mask1 = step(threshold1, noise1);
    let mask2 = step(threshold2, noise2);
    let mask3 = step(threshold3, noise3);
    
    return (mask1 + mask2 + mask3) / 3.0;
}

fn luminance_based_dissolve_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let pixel1 = textureLoad(frame1, vec2<i32>(pos), 0);
    let pixel2 = textureLoad(frame2, vec2<i32>(pos), 0);
    
    let luminance1 = rgba_to_luminance(pixel1);
    let luminance2 = rgba_to_luminance(pixel2);
    
    let luminance_diff = abs(luminance2 - luminance1);
    let noise = fractal_noise(pos / vec2<f32>(f32(size.x), f32(size.y)) * 6.0, 2u);
    
    let luminance_threshold = alpha * (1.0 + luminance_diff * 2.0);
    let noise_threshold = alpha * 0.5;
    
    let luminance_mask = step(luminance_threshold, luminance_diff);
    let noise_mask = step(noise_threshold, noise);
    
    return (luminance_mask + noise_mask) * 0.5;
}

fn morphing_dissolve_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let normalized_pos = pos / vec2<f32>(f32(size.x), f32(size.y));
    
    let morphing_noise = fractal_noise(normalized_pos * 6.0, 3u);
    let edge_noise = fractal_noise(normalized_pos * 12.0, 2u);
    
    let morphing_factor = alpha * 2.0;
    let edge_factor = alpha * 1.5;
    
    let morphing_mask = smoothstep(morphing_factor - 0.2, morphing_factor + 0.2, morphing_noise);
    let edge_mask = smoothstep(edge_factor - 0.1, edge_factor + 0.1, edge_noise);
    
    let combined_mask = morphing_mask * 0.7 + edge_mask * 0.3;
    
    return combined_mask;
}

fn dispersion_dissolve_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let center = vec2<f32>(f32(size.x), f32(size.y)) * 0.5;
    let direction = normalize(pos - center);
    let distance = length(pos - center);
    
    let dispersion_noise = fractal_noise(direction * distance * 0.01, 2u);
    let radial_noise = fractal_noise(vec2<f32>(distance * 0.02, 0.0), 3u);
    
    let dispersion_factor = alpha * 1.5;
    let radial_factor = alpha * 0.8;
    
    let dispersion_mask = smoothstep(dispersion_factor - 0.3, dispersion_factor + 0.3, dispersion_noise);
    let radial_mask = smoothstep(radial_factor - 0.2, radial_factor + 0.2, radial_noise);
    
    return (dispersion_mask + radial_mask) * 0.5;
}

fn advanced_dissolve_mask(pos: vec2<f32>, alpha: f32, size: vec2<u32>) -> f32 {
    let particle_mask = particle_diffusion_mask(pos, alpha, size);
    let multi_mask = multi_threshold_dissolve_mask(pos, alpha, size);
    let luminance_mask = luminance_based_dissolve_mask(pos, alpha, size);
    let morphing_mask = morphing_dissolve_mask(pos, alpha, size);
    let dispersion_mask = dispersion_dissolve_mask(pos, alpha, size);
    
    let weight1 = 0.25;
    let weight2 = 0.2;
    let weight3 = 0.2;
    let weight4 = 0.2;
    let weight5 = 0.15;
    
    return particle_mask * weight1 + multi_mask * weight2 + luminance_mask * weight3 + 
           morphing_mask * weight4 + dispersion_mask * weight5;
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

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let pos = vec2<i32>(id.xy);
    let size = textureDimensions(frame1);
    
    if (pos.x >= i32(size.x) || pos.y >= i32(size.y)) {
        return;
    }
    
    let alpha = uniforms.alpha;
    let pos_f = vec2<f32>(f32(pos.x), f32(pos.y));
    
    let pixel1 = textureLoad(frame1, pos, 0);
    let pixel2 = textureLoad(frame2, pos, 0);
    
    let dissolve_mask = advanced_dissolve_mask(pos_f, alpha, size);
    
    let transition_width = 0.15;
    let threshold = alpha;
    let transition_factor = smoothstep(threshold - transition_width, threshold + transition_width, dissolve_mask);
    
    let warped_pos = pos_f + (dissolve_mask - 0.5) * 2.0;
    let warped_pixel1 = bilinear_interpolate_with_border(frame1, warped_pos, size);
    let warped_pixel2 = bilinear_interpolate_with_border(frame2, warped_pos, size);
    
    let morphing_blend = mix(warped_pixel1, warped_pixel2, transition_factor);
    let simple_blend = mix(pixel1, pixel2, transition_factor);
    
    let morphing_weight = dissolve_mask * 0.3;
    let final_result = mix(simple_blend, morphing_blend, morphing_weight);
    
    let clamped = clamp(final_result, vec4<f32>(0.0), vec4<f32>(1.0));
    textureStore(output, pos, clamped);
} 