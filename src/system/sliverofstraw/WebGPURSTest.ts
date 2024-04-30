import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderState } from "./WebGPURenderState";
import { WebGPURenderStateAttributeRowType } from "./render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateMultiSampleCount, type WebGPURenderStateMultiSampleTexture } from "./render_state_object/texture/WebGPURenderStateMultiSampleTexture";
import { ReadonlyRef, Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderStateTextureView } from "./render_state_object/texture/WebGPURenderStateTextureView";
import type { WebGPURenderStateUniformGroup } from "./render_state_object/uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderStateBufferDataType, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "./render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage } from "./render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderStateShaderType } from "./render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, type WebGPURenderStateProgramState } from "./render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStatePrimitiveType } from "./render_state_object/vertex_array/WebGPURenderStateVertexArray";
import { WebGPURenderElementRenderPipelineCache } from "./render_element_object/pipeline/WebGPURenderElementRenderPipelineCache";
import { setAnimationInterval } from '../utils/AnimationInterval';
import { WebGPURenderElementTextureSamplerCache } from './render_element_object/texture_sampler/WebGPURenderElementTextureSamplerCache';
import { WebGPURenderElementVector3Buffer } from "./render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { Vector3 } from "../fivepebble/linear_algebra/Vector3";
import { bitmask_check } from "../utils/BitMask";
import { WebGPURenderElemenIndexBuffer } from "./render_element_object/buffer/WebGPURenderElementBuffer";

async function init() {

    const rs = new WebGPURenderState();
    await rs.init();

    const canvas = document.getElementById('render-server-canvas') as HTMLCanvasElement;
    const canvas_ctx = canvas.getContext('webgpu')!;
    canvas_ctx.configure({
        device: rs.device,
        format: 'rgba16float'
    });

    const texture_samplers_ref = new ReadonlyRef(new WebGPURenderElementTextureSamplerCache(rs));

    const canvas_texture_view_ref = new Ref(rs.create_CanvasTextureView(canvas_ctx).expect());

    const width = canvas.width, height = canvas.height;

    const color_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();
    const depth_texture_ref = new Ref<WebGPURenderStateMultiSampleTexture>();

    const color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    const depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    color_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, width, height, WebGPURenderStateMultiSampleCount.MS4).expect();
    depth_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, width, height, WebGPURenderStateMultiSampleCount.MS4).expect();

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
        return vec4f(v.color, 1.0);
    }
    `;

    const shader_code2 = `
    struct MyVSInput {
        @location(0) position: vec4f,
        @location(1) color: vec3f,
        @location(2) test: vec3f,
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
        vsOut.color = v.color * v.test;
        return vsOut;
    }
  
    @group(0) @binding(1) var<uniform> blend_factor: f32;
  
    @fragment
    fn fs_main(v: MyVSOutput) -> @location(0) vec4f {
        return vec4f(v.color, 1.0);
    }
    `;

    const shader = rs.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = rs.create_Program(shader, shader).expect();
    const shader2 = rs.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code2).expect();
    const program2 = rs.create_Program(shader2, shader2).expect();

    const program_state: WebGPURenderStateProgramState = {
        primitive_type: WebGPURenderStatePrimitiveType.Triangles,
        cull_mode: WebGPURenderStateCullMode.Back,
        facing: WebGPURenderStateFacing.CounterClockwise,
        depth_bias: 0,
        depth_bias_slope_scale: 0,
        depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
        depth_write: true,
    };

    const uniform_group_0_layout = rs.create_UniformLayout();

    uniform_group_0_layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex, 0);
    uniform_group_0_layout.add_BufferUniform(WebGPURenderStateShaderType.Fragment, 1);

    const pipeline_cache_ref = new Ref(new WebGPURenderElementRenderPipelineCache(
        rs,
        (hash) => bitmask_check(hash, 2) ? program2 : program,
        program_state,
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
            // test
            {
                stride: 3 * 4, // 3 floats, 4 bytes each
                per_instance: false,
                rows: [
                    { location: 2, offset: 0, type: WebGPURenderStateAttributeRowType.Vector3 },
                ],
            },
        ])
    );

    const colors = new Float32Array(
        [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
            1, 1, 1,

            1, 1, 0,
            0, 1, 1,
            1, 0, 1,
            1, 1, 1,
        ]
    );
    const indices = new Uint32Array([0, 1, 2, 2, 3, 0]);

    const positionBuffer_ref = new WebGPURenderElementVector3Buffer(rs, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst,
        [
            Vector3.create(-0.5, 0.5, 0),
            Vector3.create(-0.5, -0.5, 0),
            Vector3.create(0.5, -0.5, 0),
            Vector3.create(0.5, 0.5, 0),
        ]
    );
    const colorBuffer = rs.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst, colors.byteLength).expect();
    colorBuffer.update_Data(0, colors);
    const indicesBuffer = new WebGPURenderElemenIndexBuffer(rs, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.None,
        [
            0, 1, 2, 2, 3, 0
        ]
    );

    const test_buffer = new WebGPURenderElementVector3Buffer(rs, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst,
        [
            Vector3.create(1, 0, 1),
            Vector3.create(1, 0, 1),
            Vector3.create(1, 0, 1),
            Vector3.create(1, 0, 1),
        ]
    );

    const vertex_array_ref = new Ref(rs.create_VertexArray(WebGPURenderStatePrimitiveType.Triangles, 0, 6));
    vertex_array_ref.expect.set_Buffer(0, positionBuffer_ref.buffer);
    vertex_array_ref.expect.set_Buffer(1, colorBuffer);
    vertex_array_ref.expect.set_Index(indicesBuffer.buffer);

    const vertex_array2_ref = new Ref(rs.create_VertexArray(WebGPURenderStatePrimitiveType.LineStrip, 0, 6));
    vertex_array2_ref.expect.set_Buffer(0, positionBuffer_ref.buffer);
    vertex_array2_ref.expect.set_Buffer(1, colorBuffer);
    vertex_array2_ref.expect.set_Buffer(2, test_buffer.buffer);
    vertex_array2_ref.expect.set_Index(indicesBuffer.buffer);

    const bind_group_0_ref = new Ref<WebGPURenderStateUniformGroup>();

    bind_group_0_ref.value = rs.create_UniformGroup(uniform_group_0_layout).expect();

    const uniform_buffer_0_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_0_data = new Float32Array(1);
    uniform_buffer_0_ref.value = rs.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, 4).expect();
    bind_group_0_ref.expect.set_BufferUniform(0, uniform_buffer_0_ref.expect);

    const uniform_buffer_1_ref = new Ref<WebGPURenderStateBuffer>();
    const uniform_buffer_1_data = new Float32Array(1);
    uniform_buffer_1_ref.value = rs.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, 4).expect();
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
        color_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, canvas_width, canvas_height, WebGPURenderStateMultiSampleCount.MS4).expect();
        color_texture_view_ref.value = rs.create_TextureView(color_texture_ref.expect).expect();
        depth_texture_ref.value = rs.create_MultiSampleTexture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, canvas_width, canvas_height, WebGPURenderStateMultiSampleCount.MS4).expect();
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
    function render(delta: number) {
        time += delta;
        uniform_buffer_0_data[0] = time;
        uniform_buffer_0_ref.expect.update_Data(0, uniform_buffer_0_data);
        uniform_buffer_1_data[0] = (Math.sin(time) + 1.0) / 2.0;
        uniform_buffer_1_ref.expect.update_Data(0, uniform_buffer_1_data);
        resize();
        frame_buffer_ref.expect.refresh_CanvasTextureView();
        const command_encoder = rs.device.createCommandEncoder();
        const render_pass_encoder = command_encoder.beginRenderPass(frame_buffer_ref.expect.frame_buffer_desc);
        const s = (time % 3.0) > 1.5;
        const pipeline = pipeline_cache_ref.expect.get(s ? vertex_array2_ref.expect : vertex_array_ref.expect, frame_buffer_ref.expect, WebGPURenderStateCullMode.Back, s ? 1.0 : 0.0, 0, WebGPURenderStateDepthCompareFunc.LessEqual);
        if (pipeline) {
            render_pass_encoder.setPipeline(pipeline.pipeline);
            render_pass_encoder.setBindGroup(0, bind_group_0_ref.expect.binding_group);
            (s ? vertex_array2_ref.expect : vertex_array_ref.expect).bind_Buffers(render_pass_encoder);
            (s ? vertex_array2_ref.expect : vertex_array_ref.expect).draw(render_pass_encoder);
        }
        render_pass_encoder.end();
        rs.device.queue.submit([command_encoder.finish()]);
    }

    setAnimationInterval((delta) => {
        render(delta / 1000);
    }, 0);

}

init();