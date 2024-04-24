import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderStateShaderType } from "../render_state/pipeline/RenderStateShader";
import { RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTextureUsage } from "../render_state/texture/RenderStateTexture";
import { WebGPURenderState } from "./WebGPURenderState";
import { RenderStateAttributeRowType } from "../render_state/pipeline/RenderStateAttributeLayout";
import { RenderStateBufferUniformType, RenderStateSamplerUniformType, RenderStateTextureUniformSampleType, RenderStateTextureUniformType } from "../render_state/uniform/RenderStateUniformLayout";
import type { WebGPURenderStateMultiSampleTexture } from "./texture/WebGPURenderStateMultiSampleTexture";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderStateTextureView } from "./texture/WebGPURenderStateTextureView";
import type { WebGPURenderStateUniformGroup } from "./uniform/WebGPURenderStateUniformGroup";
import type { WebGPURenderStateBuffer } from "./buffer/WebGPURenderStateBuffer";
import { RenderStateBufferDataType, RenderStateBufferType, RenderStateBufferUsage } from "../render_state/buffer/RenderStateBuffer";

console.log(WebGPURenderState.RenderStateMemoryLayout(
    {
        type: 'struct',
        members: [
            RenderStateBufferUniformType.Vector2,
            RenderStateBufferUniformType.Vector3,
            RenderStateBufferUniformType.Float,
            RenderStateBufferUniformType.Float,
            {
                type: 'struct',
                members: [
                    RenderStateBufferUniformType.Float,
                    RenderStateBufferUniformType.Float,
                    RenderStateBufferUniformType.Vector2,
                    RenderStateBufferUniformType.Float,
                ]
            },
            RenderStateBufferUniformType.Vector3,
            {
                type: 'array',
                member: {
                    type: 'struct',
                    members: [
                        RenderStateBufferUniformType.Float,
                        RenderStateBufferUniformType.Float,
                        RenderStateBufferUniformType.Vector2,
                        RenderStateBufferUniformType.Float,
                    ]
                },
                length: 3
            },
            RenderStateBufferUniformType.Int,
        ]
    }
));

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

    const color_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();
    const depth_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();

    const color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    const depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    color_texture_ref.value = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.RGBA16F, width, height, 4).expect();
    depth_texture_ref.value = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.D32F, width, height, 4).expect();

    color_texture_view_ref.value = rs.create_TextureView(color_texture_ref.expect).expect();
    depth_texture_view_ref.value = rs.create_TextureView(depth_texture_ref.expect).expect();

    const shader_code = `
    struct MyVSInput {
        @location(0) position: vec4f,
        @location(1) color: vec3f,
    };

    @group(0) @binding(0) var<uniform> rotate: f32;
  
    struct MyVSOutput {
      @builtin(position) position: vec4f,
      @location(0) color: vec3f,
    };
  
    @vertex
    fn vs_main(v: MyVSInput) -> MyVSOutput {
      var pos = vec2f(v.position.x, v.position.y);
      var rot = mat2x2f(vec2f(cos(rotate), sin(rotate)), vec2f(-sin(rotate), cos(rotate)));
      pos *= rot;
      var vsOut: MyVSOutput;
      vsOut.position = vec4f(pos.x, pos.y, v.position.z, 1.0);
      vsOut.color = v.color;
      return vsOut;
    }
  
    @group(0) @binding(1) var<uniform> blend_factor: f32;
  
    @fragment
    fn fs_main(v: MyVSOutput) -> @location(0) vec4f {
      return vec4f(v.color * blend_factor, 1.0);
    }
    `;

    const shader = rs.create_Shader(RenderStateShaderType.Vertex | RenderStateShaderType.Fragment, shader_code).expect();

    const program = rs.create_Program(shader, shader).expect();

    const program_state = rs.create_ProgramState();

    const uniform_group_0_layout = rs.create_UniformLayout();

    uniform_group_0_layout.add_BufferUniform(RenderStateShaderType.Vertex, 0);
    uniform_group_0_layout.add_BufferUniform(RenderStateShaderType.Fragment, 1);

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
            uniform_group_0_layout,
        ],
        [
            // positions
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 0, offset: 0, type: RenderStateAttributeRowType.Vector3 },
                ],
            },
            // colors
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 1, offset: 0, type: RenderStateAttributeRowType.Vector3 },
                ],
            },
        ]).expect();

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
            -0.5, 0.5, 0,
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0,
        ]
    );
    const colors = new Float32Array(
        [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
            1, 1, 1,
        ]
    );
    const indices = new Uint32Array([0, 1, 2, 2, 3, 0]);

    const positionBuffer = rs.create_Buffer(RenderStateBufferType.VertexArray, RenderStateBufferUsage.CopyDst, RenderStateBufferDataType.Float, 3, positions.byteLength).expect();
    positionBuffer.update_Data(0, positions);
    const colorBuffer = rs.create_Buffer(RenderStateBufferType.VertexArray, RenderStateBufferUsage.CopyDst, RenderStateBufferDataType.Float, 3, colors.byteLength).expect();
    colorBuffer.update_Data(0, colors);
    const indicesBuffer = rs.create_Buffer(RenderStateBufferType.Index, RenderStateBufferUsage.CopyDst, RenderStateBufferDataType.Uint, 1, indices.byteLength).expect();
    indicesBuffer.update_Data(0, indices);

    const bind_group_0_ref = new Ref<WebGPURenderStateUniformGroup>();

    bind_group_0_ref.value = rs.create_UniformGroup(uniform_group_0_layout).expect();

    const uniform_buffer_0_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_0_data = new Float32Array(1);
    uniform_buffer_0_ref.value = rs.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.CopyDst, RenderStateBufferDataType.Float, 1, 4).expect();
    bind_group_0_ref.expect.set_BufferUniform(0, uniform_buffer_0_ref.expect);
    
    const uniform_buffer_1_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_1_data = new Float32Array(1);
    uniform_buffer_1_ref.value = rs.create_Buffer(RenderStateBufferType.Uniform, RenderStateBufferUsage.CopyDst, RenderStateBufferDataType.Float, 1, 4).expect();
    bind_group_0_ref.expect.set_BufferUniform(1, uniform_buffer_1_ref.expect);

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: color_texture_view_ref.expect.texture_view, // Assigned later
                resolveTarget: canvas_ctx.getCurrentTexture().createView(), // Assigned Later
                clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: depth_texture_view_ref.expect.texture_view,  // Assigned later
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
        color_texture_ref.value = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.RGBA16F, canvas_width, canvas_height, 4).expect();
        color_texture_view_ref.value = rs.create_TextureView(color_texture_ref.expect).expect();
        (renderPassDescriptor.colorAttachments as any[])[0]!.view = color_texture_view_ref.expect.texture_view;
        depth_texture_ref.value = rs.create_MultiSampleTexture(RenderStateTextureUsage.Attchment, RenderStateTextureFormat.D32F, canvas_width, canvas_height, 4).expect();
        depth_texture_view_ref.value = rs.create_TextureView(depth_texture_ref.expect).expect();
        (renderPassDescriptor.depthStencilAttachment as any).view = depth_texture_view_ref.expect.texture_view;
    }

    let time = 0;
    function render() {
        time += 0.016;
        uniform_buffer_0_data[0] = time;
        uniform_buffer_0_ref.expect.update_Data(0, uniform_buffer_0_data);
        uniform_buffer_1_data[0] = (Math.sin(time) + 1.0) / 2.0;
        uniform_buffer_1_ref.expect.update_Data(0, uniform_buffer_1_data);
        resize();
        (renderPassDescriptor.colorAttachments as any[])[0]!.resolveTarget = canvas_ctx.getCurrentTexture().createView();
        const commandEncoder = rs.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline.pipeline);
        passEncoder.setBindGroup(0, bind_group_0_ref.expect.binding_group);
        passEncoder.setVertexBuffer(0, positionBuffer.buffer);
        passEncoder.setVertexBuffer(1, colorBuffer.buffer);
        passEncoder.setIndexBuffer(indicesBuffer.buffer, 'uint32');
        passEncoder.drawIndexed(indices.length);
        passEncoder.end();
        rs.device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

init();