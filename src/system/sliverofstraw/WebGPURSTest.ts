import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderState } from "./WebGPURenderState";
import { WebGPURenderStateAttributeRowType } from "./pipeline/WebGPURenderStateAttributeLayout";
import type { WebGPURenderStateMultiSampleTexture } from "./texture/WebGPURenderStateMultiSampleTexture";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderStateTextureView } from "./texture/WebGPURenderStateTextureView";
import type { WebGPURenderStateUniformGroup } from "./uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderStateBufferDataType, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "./buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage } from "./texture/WebGPURenderStateTexture";
import { WebGPURenderStateShaderType } from "./pipeline/WebGPURenderStateShader";

async function init() {

    const rs = new WebGPURenderState();
    await rs.init();

    const canvas = document.getElementById('render-server-canvas') as HTMLCanvasElement;
    const canvas_ctx = canvas.getContext('webgpu')!;
    canvas_ctx.configure({
        device: rs.device,
        format: 'rgba16float'
    });

    const canvas_texture_view_ref = new Ref(rs.create_CanvasTextureView(canvas_ctx).expect());

    const width = canvas.width, height = canvas.height;

    const color_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();
    const depth_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();

    const color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    const depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    color_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, width, height, 4).expect();
    depth_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, width, height, 4).expect();

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

    const shader = rs.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();

    const program = rs.create_Program(shader, shader).expect();

    const program_state = rs.create_ProgramState();

    const uniform_group_0_layout = rs.create_UniformLayout();

    uniform_group_0_layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex, 0);
    uniform_group_0_layout.add_BufferUniform(WebGPURenderStateShaderType.Fragment, 1);

    const pipeline = rs.create_RenderPipeline(program, program_state,
        {
            depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
            multi_sample_count: 4,
            alpha_to_coverage: false,
            attachments: [
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
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
                    { location: 0, offset: 0, type: WebGPURenderStateAttributeRowType.Vector3 },
                ],
            },
            // colors
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 1, offset: 0, type: WebGPURenderStateAttributeRowType.Vector3 },
                ],
            },
        ]).expect();

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

    const positionBuffer = rs.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, WebGPURenderStateBufferDataType.Float, 3, positions.byteLength).expect();
    positionBuffer.update_Data(0, positions);
    const colorBuffer = rs.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, WebGPURenderStateBufferDataType.Float, 3, colors.byteLength).expect();
    colorBuffer.update_Data(0, colors);
    const indicesBuffer = rs.create_Buffer(WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.CopyDst, WebGPURenderStateBufferDataType.Uint, 1, indices.byteLength).expect();
    indicesBuffer.update_Data(0, indices);

    const bind_group_0_ref = new Ref<WebGPURenderStateUniformGroup>();

    bind_group_0_ref.value = rs.create_UniformGroup(uniform_group_0_layout).expect();

    const uniform_buffer_0_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_0_data = new Float32Array(1);
    uniform_buffer_0_ref.value = rs.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, WebGPURenderStateBufferDataType.Float, 1, 4).expect();
    bind_group_0_ref.expect.set_BufferUniform(0, uniform_buffer_0_ref.expect);

    const uniform_buffer_1_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_1_data = new Float32Array(1);
    uniform_buffer_1_ref.value = rs.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, WebGPURenderStateBufferDataType.Float, 1, 4).expect();
    bind_group_0_ref.expect.set_BufferUniform(1, uniform_buffer_1_ref.expect);

    const frame_buffer_ref = new Ref(rs.create_FrameBuffer().expect());

    frame_buffer_ref.expect.add_Attachment(
        color_texture_view_ref.expect,
        true, new Vector4(0.2, 0.2, 0.2, 1.0), true,
        canvas_texture_view_ref.expect
    );
    frame_buffer_ref.expect.set_DepthStencilAttachment(
        depth_texture_view_ref.expect,
        true, 1, true,
    );

    function resize() {
        const canvas_width = window.innerWidth;
        const canvas_height = window.innerHeight;
        if (canvas.width === canvas_width && canvas.height === canvas_height) return;
        canvas.width = canvas_width;
        canvas.height = canvas_height;
        color_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, canvas_width, canvas_height, 4).expect();
        color_texture_view_ref.value = rs.create_TextureView(color_texture_ref.expect).expect();
        depth_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, canvas_width, canvas_height, 4).expect();
        depth_texture_view_ref.value = rs.create_TextureView(depth_texture_ref.expect).expect();
        frame_buffer_ref.expect.clear_Attachments();
        frame_buffer_ref.expect.clear_DepthStencilAttachment();
        frame_buffer_ref.expect.add_Attachment(
            color_texture_view_ref.expect,
            true, new Vector4(0.2, 0.2, 0.2, 1.0), true,
            canvas_texture_view_ref.expect
        );
        frame_buffer_ref.expect.set_DepthStencilAttachment(
            depth_texture_view_ref.expect,
            true, 1, true,
        );
    }

    let time = 0;
    function render() {
        time += 0.016;
        uniform_buffer_0_data[0] = time;
        uniform_buffer_0_ref.expect.update_Data(0, uniform_buffer_0_data);
        uniform_buffer_1_data[0] = (Math.sin(time) + 1.0) / 2.0;
        uniform_buffer_1_ref.expect.update_Data(0, uniform_buffer_1_data);
        resize();
        frame_buffer_ref.expect.refresh_CanvasTextureView();
        const commandEncoder = rs.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(frame_buffer_ref.expect.frame_buffer_desc);
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