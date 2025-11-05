@group(0) @binding(0) var base_texture: texture_2d<f32>;
@group(0) @binding(1) var overlay_texture: texture_2d<f32>;
@group(0) @binding(2) var output_texture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pos = vec2<i32>(i32(global_id.x), i32(global_id.y));
    let output_size = textureDimensions(output_texture);
    
    if (pos.x >= i32(output_size.x) || pos.y >= i32(output_size.y)) {
        return;
    }
    
    let overlay = textureLoad(overlay_texture, vec2<u32>(pos), 0);
    
    textureStore(output_texture, vec2<u32>(pos), overlay);
}