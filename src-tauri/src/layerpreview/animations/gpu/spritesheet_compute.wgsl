@group(0) @binding(0) var<storage, read> input_frames: array<u32>;
@group(0) @binding(1) var<storage, read> frame_data: array<FrameData>;
@group(0) @binding(2) var<storage, read_write> output_spritesheet: array<u32>;

struct FrameData {
    frame_index: u32,
    col: u32,
    row: u32,
    frame_width: u32,
    frame_height: u32,
    spritesheet_width: u32,
    spritesheet_height: u32,
};

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fi = gid.z;
    if (fi >= arrayLength(&frame_data)) { return; }
    let fd = frame_data[fi];

    let x = gid.x;
    let y = gid.y;
    if (x >= fd.frame_width || y >= fd.frame_height) { return; }

    let src = fd.frame_index * fd.frame_width * fd.frame_height + y * fd.frame_width + x;
    let tx = fd.col * fd.frame_width + x;
    let ty = fd.row * fd.frame_height + y;
    let dst = ty * fd.spritesheet_width + tx;

    if (src < arrayLength(&input_frames) && dst < arrayLength(&output_spritesheet)) {
        output_spritesheet[dst] = input_frames[src];
    }
}
