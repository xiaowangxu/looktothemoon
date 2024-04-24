import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderStateShaderType } from "../render_state_objects/pipeline/RenderStateShader";
import { RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTextureUsage } from "../render_state_objects/texture/RenderStateTexture";
import { WebGPURenderState } from "./WebGPURenderState";
import { RenderStateAttributeRowType } from "../render_state_objects/pipeline/RenderStateAttributeLayout";
import { RenderStateBufferUniformType, RenderStateSamplerUniformType, RenderStateTextureUniformSampleType, RenderStateTextureUniformType } from "../render_state_objects/uniform/RenderStateUniformLayout";

async function init() {

    const rs = new WebGPURenderState(null as any, {});
    await rs.init();

    const canvas = document.getElementById('render-server-canvas') as HTMLCanvasElement;
    const canvas_ctx = canvas.getContext('webgpu')!;
    canvas_ctx.configure({
        device: rs.device,
        format: 'rgba16float'
    });

    const width = canvas.width, height = canvas.height;

    let color_multisampled_texture = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.RGBA16F, width, height, 4).expect();
    // const depth_texture = rs.create_Texture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.D32F, RenderStateTextureDimension.D2, width, height, 1, 1).expect();

    const shader_code = `
    struct VSUniforms {
      worldViewProjection: mat4x4f,
      worldInverseTranspose: mat4x4f,
    };
    @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
  
    struct MyVSInput {
        @location(0) position: vec4f,
        @location(1) color: vec3f,
    };
  
    struct MyVSOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec3f,
    };
  
    @vertex
    fn vs_main(v: MyVSInput) -> MyVSOutput {
      var vsOut: MyVSOutput;
      vsOut.position = v.position;
      vsOut.color = v.color;
      return vsOut;
    }
  
    struct FSUniforms {
      lightDirection: vec3f,
    };
  
    @group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;
    @group(0) @binding(2) var diffuseSampler: sampler;
    @group(0) @binding(3) var diffuseTexture: texture_2d<f32>;
  
    @fragment
    fn fs_main(v: MyVSOutput) -> @location(0) vec4f {
      return vec4f(v.color, 1.0);
    }
    `;

    const shader = rs.create_Shader(RenderStateShaderType.Vertex | RenderStateShaderType.Fragment, shader_code).expect();

    const program = rs.create_Program(shader, shader).expect();

    const program_state = rs.create_ProgramState();

    const uniform_layout = rs.create_UniformLayout();

    uniform_layout.add_BufferUniform('vertex_uniform', RenderStateShaderType.Vertex, 0);
    uniform_layout.add_Uniform('fragment_light', RenderStateBufferUniformType.Vector3, RenderStateShaderType.Fragment, 1);
    uniform_layout.add_Sampler('fragment_tex_sampler', RenderStateSamplerUniformType.Filter, RenderStateShaderType.Fragment, 2);
    uniform_layout.add_Texture('fragment_tex', RenderStateTextureUniformType.Tex2D, RenderStateTextureUniformSampleType.Float, RenderStateShaderType.Fragment, 3);
    uniform_layout.finish();

    const pipeline = rs.create_RenderPipeline(program, program_state,
        {
            depth_stencil_format: RenderStateTextureFormat.D32F,
            multi_sample_count: 4,
            alpha_to_coverage: false,
            attachments: [
                {
                    format: RenderStateTextureFormat.RGBA16F,
                    blend: false,
                }
            ],
        },
        [
            uniform_layout,
        ],
        [
            // positions
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 0, offset: 0, type: RenderStateAttributeRowType.Vec3 },
                ],
            },
            // colors
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 1, offset: 0, type: RenderStateAttributeRowType.Vec3 },
                ],
            },
        ]).expect();

    const sampler = rs.create_TextureSampler().expect();

    function createBuffer(device: GPUDevice, data: Float32Array | Uint32Array, usage: number) {
        const buffer = device.createBuffer({
            size: data.byteLength,
            usage,
            mappedAtCreation: true,
        });
        const dst = new (data.constructor as any)(buffer.getMappedRange());
        dst.set(data);
        buffer.unmap();
        return buffer;
    }

    const positions = new Float32Array(
        [
            0, 0.75, 0,
            -0.75, -0.75, 0,
            0.75, -0.75, 0,
        ]
    );
    const colors = new Float32Array(
        [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ]
    );
    const indices = new Uint32Array([0, 1, 2]);

    const positionBuffer = createBuffer(rs.device, positions, GPUBufferUsage.VERTEX);
    const colorBuffer = createBuffer(rs.device, colors, GPUBufferUsage.VERTEX);
    const indicesBuffer = createBuffer(rs.device, indices, GPUBufferUsage.INDEX);

    const tex = rs.device.createTexture({
        size: [2, 2],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST,
    });
    rs.device.queue.writeTexture(
        { texture: tex },
        new Uint8Array([
            255, 255, 128, 255,
            128, 255, 255, 255,
            255, 128, 255, 255,
            255, 128, 128, 255,
        ]),
        { bytesPerRow: 8, rowsPerImage: 2 },
        { width: 2, height: 2 },
    );

    const vUniformBufferSize = 2 * 16 * 4; // 2 mat4s * 16 floats per mat * 4 bytes per float
    const fUniformBufferSize = 3 * 4;      // 1 vec3 * 3 floats per vec3 * 4 bytes per float

    const vsUniformBuffer = rs.device.createBuffer({
        size: Math.max(16, vUniformBufferSize),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const fsUniformBuffer = rs.device.createBuffer({
        size: Math.max(16, fUniformBufferSize),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const vsUniformValues = new Float32Array(2 * 16); // 2 mat4s
    const worldViewProjection = vsUniformValues.subarray(0, 16);
    const worldInverseTranspose = vsUniformValues.subarray(16, 32);
    const fsUniformValues = new Float32Array(3);  // 1 vec3
    const lightDirection = fsUniformValues.subarray(0, 3);

    const bindGroup = rs.device.createBindGroup({
        layout: uniform_layout.layout!,
        entries: [
            { binding: 0, resource: { buffer: vsUniformBuffer } },
            { binding: 1, resource: { buffer: fsUniformBuffer } },
            { binding: 2, resource: sampler.sampler },
            { binding: 3, resource: tex.createView() },
        ],
    });

    let depth_texture = rs.device.createTexture({
        size: [width, height],
        format: 'depth32float',
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: color_multisampled_texture.multi_sample_texture.createView(), // Assigned later
                resolveTarget: canvas_ctx.getCurrentTexture().createView(), // Assigned Later
                clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: depth_texture.createView(),  // Assigned later
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    function resize() {
        const canvas_width = window.innerWidth;
        const canvas_height = window.innerHeight;
        if (canvas.width === canvas_width && canvas.height === canvas_height) return;
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        color_multisampled_texture = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.RGBA16F, canvas_width, canvas_height, 4).expect();
        (renderPassDescriptor.colorAttachments as any[])[0]!.view = color_multisampled_texture.multi_sample_texture.createView();
        depth_texture = rs.device.createTexture({
            size: [canvas_width, canvas_height],
            format: 'depth32float',
            sampleCount: 4,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        (renderPassDescriptor.depthStencilAttachment as any).view = depth_texture.createView();
    }
    
    function render() {
        resize();
        (renderPassDescriptor.colorAttachments as any[])[0]!.resolveTarget = canvas_ctx.getCurrentTexture().createView();
        const commandEncoder = rs.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline.pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, colorBuffer);
        passEncoder.setIndexBuffer(indicesBuffer, 'uint32');
        passEncoder.drawIndexed(indices.length);
        passEncoder.end();
        rs.device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

init();