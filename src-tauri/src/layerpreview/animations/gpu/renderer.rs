use bytemuck::{cast_slice, Pod, Zeroable};
use image::DynamicImage;
use tokio::sync::oneshot;
use wgpu::util::DeviceExt;
use wgpu::*;

fn compute_in_flight_limit(frames: &[DynamicImage], adapter: &wgpu::Adapter) -> usize {
    let width = frames[0].width();
    let height = frames[0].height();

    let bytes_per_frame = (width as u64) * (height as u64) * 4;

    let limits = adapter.limits();
    let hard_limit = (limits.max_storage_buffer_binding_size as u64).min(limits.max_buffer_size);

    let max_jobs = (hard_limit / bytes_per_frame).max(1);
    let safe_jobs = (max_jobs / 2).clamp(1, 8);

    tracing::info!(
        "Frame {}x{}, bytes/frame={}, GPU hard_limit={}MB → max_jobs={}, safe_jobs={}",
        width,
        height,
        bytes_per_frame,
        hard_limit / (1024 * 1024),
        max_jobs,
        safe_jobs
    );

    safe_jobs as usize
}

const COMPUTE_SHADER: &str = include_str!("spritesheet_compute.wgsl");

#[repr(C)]
#[derive(Copy, Clone, Pod, Zeroable)]
pub struct FrameData {
    pub frame_index: u32,
    pub col: u32,
    pub row: u32,
    pub frame_width: u32,
    pub frame_height: u32,
    pub spritesheet_width: u32,
    pub spritesheet_height: u32,
}

pub struct GpuSpritesheetRenderer {
    pub device: Device,
    pub queue: Queue,
    pub compute_pipeline: ComputePipeline,
    pub bind_group_layout: BindGroupLayout,
    pub input_buffer: Option<Buffer>,
    pub frame_buffer: Option<Buffer>,
    pub output_buffer: Option<Buffer>,
    pub input_bytes: u64,
    pub frame_bytes: u64,
    pub output_bytes: u64,
}

impl GpuSpritesheetRenderer {
    pub async fn new_with_max_in_flight(frames: &[DynamicImage]) -> Result<(Self, usize), String> {
        let instance = Instance::new(InstanceDescriptor::default());
        let adapter = instance
            .request_adapter(&RequestAdapterOptions::default())
            .await
            .ok_or("Failed to get WGPU adapter")?;

        let max_in_flight = if !frames.is_empty() {
            compute_in_flight_limit(frames, &adapter)
        } else {
            4
        };

        let (device, queue) = adapter
            .request_device(
                &DeviceDescriptor {
                    label: None,
                    features: Features::empty(),
                    limits: Limits::default(),
                },
                None,
            )
            .await
            .map_err(|e| format!("request_device: {:?}", e))?;

        let shader = device.create_shader_module(ShaderModuleDescriptor {
            label: Some("spritesheet_compute"),
            source: ShaderSource::Wgsl(COMPUTE_SHADER.into()),
        });

        let bind_group_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: Some("spritesheet_bgl"),
            entries: &[
                BindGroupLayoutEntry {
                    binding: 0,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 1,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Storage { read_only: true },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
                BindGroupLayoutEntry {
                    binding: 2,
                    visibility: ShaderStages::COMPUTE,
                    ty: BindingType::Buffer {
                        ty: BufferBindingType::Storage { read_only: false },
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                },
            ],
        });

        let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
            label: Some("spritesheet_pl"),
            bind_group_layouts: &[&bind_group_layout],
            push_constant_ranges: &[],
        });

        let compute_pipeline = device.create_compute_pipeline(&ComputePipelineDescriptor {
            label: Some("spritesheet_cp"),
            layout: Some(&pipeline_layout),
            module: &shader,
            entry_point: "main",
        });

        let renderer = Self {
            device,
            queue,
            compute_pipeline,
            bind_group_layout,
            input_buffer: None,
            frame_buffer: None,
            output_buffer: None,
            input_bytes: 0,
            frame_bytes: 0,
            output_bytes: 0,
        };

        Ok((renderer, max_in_flight))
    }

    fn ensure_buffer(
        device: &Device,
        buf: &mut Option<Buffer>,
        current_size: &mut u64,
        needed: u64,
        usage: BufferUsages,
        label: &str,
    ) {
        if buf.is_none() || *current_size < needed {
            *buf = Some(device.create_buffer(&BufferDescriptor {
                label: Some(label),
                size: needed.max(16),
                usage,
                mapped_at_creation: false,
            }));
            *current_size = needed;
        }
    }

    fn create_bind_group(&self, input: &Buffer, frame: &Buffer, output: &Buffer) -> BindGroup {
        self.device.create_bind_group(&BindGroupDescriptor {
            label: Some("spritesheet_bg"),
            layout: &self.bind_group_layout,
            entries: &[
                BindGroupEntry {
                    binding: 0,
                    resource: input.as_entire_binding(),
                },
                BindGroupEntry {
                    binding: 1,
                    resource: frame.as_entire_binding(),
                },
                BindGroupEntry {
                    binding: 2,
                    resource: output.as_entire_binding(),
                },
            ],
        })
    }

    pub fn dispatch_and_stage(
        &mut self,
        frames_w: u32,
        frames_h: u32,
        num_frames_in_batch: u32,
        frame_data_bytes: &[u8],
        input_u32: &[u32],
        output_pixels_count: usize,
    ) -> (
        Buffer,
        oneshot::Receiver<Result<(), wgpu::BufferAsyncError>>,
    ) {
        let input_bytes = (input_u32.len() * 4) as u64;
        let frame_bytes = frame_data_bytes.len() as u64;
        let output_bytes = (output_pixels_count * 4) as u64;

        Self::ensure_buffer(
            &self.device,
            &mut self.input_buffer,
            &mut self.input_bytes,
            input_bytes,
            BufferUsages::STORAGE | BufferUsages::COPY_DST,
            "input_buffer",
        );
        Self::ensure_buffer(
            &self.device,
            &mut self.frame_buffer,
            &mut self.frame_bytes,
            frame_bytes,
            BufferUsages::STORAGE | BufferUsages::COPY_DST,
            "frame_buffer",
        );

        if self.output_buffer.is_none() || self.output_bytes < output_bytes {
            let transparent_pixels: Vec<u32> = vec![0x00000000; output_pixels_count];
            let new_buf = self
                .device
                .create_buffer_init(&wgpu::util::BufferInitDescriptor {
                    label: Some("output_buffer"),
                    contents: cast_slice(&transparent_pixels),
                    usage: BufferUsages::STORAGE | BufferUsages::COPY_SRC | BufferUsages::COPY_DST,
                });
            self.output_buffer = Some(new_buf);
            self.output_bytes = output_bytes;
        }

        let input_buf = self.input_buffer.as_ref().unwrap();
        let frame_buf = self.frame_buffer.as_ref().unwrap();
        let output_buf = self.output_buffer.as_ref().unwrap();

        let transparent_pixels: Vec<u32> = vec![0x00000000; output_pixels_count];
        self.queue
            .write_buffer(output_buf, 0, cast_slice(&transparent_pixels));

        self.queue.write_buffer(input_buf, 0, cast_slice(input_u32));
        self.queue.write_buffer(frame_buf, 0, frame_data_bytes);

        self.queue.submit(std::iter::empty());

        let bind_group = self.create_bind_group(input_buf, frame_buf, output_buf);

        let mut encoder = self
            .device
            .create_command_encoder(&CommandEncoderDescriptor {
                label: Some("encoder"),
            });
        {
            let mut pass = encoder.begin_compute_pass(&ComputePassDescriptor {
                label: Some("compute_pass"),
            });
            pass.set_pipeline(&self.compute_pipeline);
            pass.set_bind_group(0, &bind_group, &[]);

            let wg_x = (frames_w + 15) / 16;
            let wg_y = (frames_h + 15) / 16;
            pass.dispatch_workgroups(wg_x, wg_y, num_frames_in_batch);
        }

        let staging = self.device.create_buffer(&BufferDescriptor {
            label: Some("staging_buffer"),
            size: output_bytes,
            usage: BufferUsages::MAP_READ | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        encoder.copy_buffer_to_buffer(output_buf, 0, &staging, 0, output_bytes);

        self.queue.submit(Some(encoder.finish()));

        self.device.poll(Maintain::Poll);

        let slice = staging.slice(..);
        let (tx, rx) = oneshot::channel();
        slice.map_async(MapMode::Read, move |res| {
            let _ = tx.send(res);
        });

        (staging, rx)
    }
}
