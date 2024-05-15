import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import type { World3D } from "../../worlds/world3ds/World3D";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { RenderServerViewport } from "../viewport/RenderServerViewport";
import { RenderServerRenderer3DQueue } from "./RenderServerRenderer3DQueue";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { VisualWorld3DMesh } from "../../worlds/world3ds/VisualWorld3D";
import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import { ReadonlyRef, Ref, RefCacher } from "@/system/utils/RefCounted";
import { RenderServer, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateTextureUsage, WebGPURenderStateTextureFormat, WebGPURenderStateTexture, WebGPURenderStateTextureDimension } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderElementFrameBuffer } from "@/system/sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerMaterial, RenderServerMaterialPass } from "../material/RenderServerMaterial";
import { WebGPURenderStateDepthCompareFunc, WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderElementVertexArray } from "@/system/sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArray";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServerGeometryAttributeLocation } from "../geometry/RenderServerGeometryDefination";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureWrap } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

const FullScreenTriangleVertexArray = new RefCacher(() => {
    const vertex_array = new WebGPURenderElementVertexArray(RenderServer.render_state, WebGPURenderStatePrimitiveType.Triangles, 0, 3);
    const { buffer, data } = RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, 24, true).expect();
    const pos_array = new Float32Array(data);
    pos_array[0] = 0;
    pos_array[1] = 4;
    pos_array[2] = 0;
    pos_array[3] = 0;
    pos_array[4] = 4;
    pos_array[5] = 0;
    buffer.unmap();
    vertex_array.set_Buffer(0, buffer);
    return vertex_array;
});

const FullScreenBackgroundPipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };

    struct WorldEnvUniformCameraMatrix {
        camera_world: mat4x4f,
        camera_view: mat4x4f,
        camera_proj: mat4x4f,
        camera_inv_proj: mat4x4f,
        camera_norview: mat3x3f,
    }

    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    }
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) uv: vec2f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
	    out.uv = attri.position / 2.0;
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
        @location(1) normal: vec4f,
    };
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var y = vary.uv.y / 5.0 + 0.1;
        out.color = vec4f(0.2, 0.2, 0.2, 1.0);
        out.normal = vec4f(0.0, 0.0, 1.0, 1.0);
        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerMaterial.ProgramStatePipelineTemplates[RenderServerMaterialPass.Solid],
        RenderServerMaterial.OutputStatePipelineTemplates[RenderServerMaterialPass.Solid],
        [RenderServer.world_env_uniform_layout],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

const ComposeUniformSmapler = new RefCacher(() => {
    return RenderServer.render_state.create_TextureSampler(
        WebGPURenderStateTextureWrap.Clamp,
        WebGPURenderStateTextureWrap.Clamp,
        WebGPURenderStateTextureWrap.Clamp,
        WebGPURenderStateTextureFilter.Nearest,
        WebGPURenderStateTextureFilter.Nearest,
        WebGPURenderStateTextureFilter.Nearest,
    ).expect();
});

const OitComposeUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.NonFilterFloat, WebGPURenderStateShaderType.Fragment, 0);
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.NonFilterFloat, WebGPURenderStateShaderType.Fragment, 1);
    layout.add_Sampler(WebGPURenderStateSamplerUniformType.NonFilter, WebGPURenderStateShaderType.Fragment, 2);
    return layout;
});

const OitComposePipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) uv: vec2f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
	    var uv = attri.position / 2.0;
        out.uv = vec2(uv.x, 1.0 - uv.y);
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(0) @binding(0) var accum: texture_2d<f32>;
    @group(0) @binding(1) var reveal: texture_2d<f32>;
    @group(0) @binding(2) var sample: sampler;
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var accum_sample = textureSample(accum, sample, vary.uv);
        var reveal_sample = textureSample(reveal, sample, vary.uv).r;
        var color = vec4f(accum_sample.rgb / max(accum_sample.a, 1e-5), 1.0 - reveal_sample);
        out.color = color;
        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerMaterial.ProgramStatePipelineTemplates[RenderServerMaterialPass.Compose],
        RenderServerMaterial.OutputStatePipelineTemplates[RenderServerMaterialPass.Compose],
        [OitComposeUniformLayout.get()],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

const ColorComposeUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.NonFilterFloat, WebGPURenderStateShaderType.Fragment, 0);
    layout.add_Sampler(WebGPURenderStateSamplerUniformType.NonFilter, WebGPURenderStateShaderType.Fragment, 1);
    return layout;
});

const ColorComposePipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) uv: vec2f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
	    var uv = attri.position / 2.0;
        out.uv = vec2(uv.x, 1.0 - uv.y);
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(0) @binding(0) var color: texture_2d<f32>;
    @group(0) @binding(1) var sample: sampler;
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var color_sample = textureSample(color, sample, vary.uv);
        out.color = color_sample;
        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerMaterial.ProgramStatePipelineTemplates[RenderServerMaterialPass.Compose],
        RenderServerMaterial.OutputStatePipelineTemplates[RenderServerMaterialPass.Compose],
        [ColorComposeUniformLayout.get()],
        [
            {
                stride: 8, // 2 * 4
                per_instance: false,
                rows: [{
                    location: 0,
                    offset: 0,
                    type: WebGPURenderStateAttributeType.Vector2
                }]
            },
        ]
    ).expect();

    // mannually release shader and program
    shader.release();
    program.release();

    return pipeline;
});

const ResultDepthEmptyTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, WebGPURenderStateTextureDimension.D2, 1, 1).expect();
    return RenderServer.render_state.create_TextureView(texture).expect();
});

const ResultEmptyTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, 1, 1).expect();
    return RenderServer.render_state.create_TextureView(texture).expect();
});

export class RenderServerRenderer3D extends RenderServerObjectRefCounted {

    static readonly #tmp_frustum_0 = Frustum3.new;
    static readonly #tmp_vector_0 = Vector2.new;
    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;
    static readonly #tmp_instance_uniform_group_dynamic_offsets = [0];

    protected readonly queue_0 = new RenderServerRenderer3DQueue();
    protected readonly queue_1 = new RenderServerRenderer3DQueue();

    protected readonly compose_uniform_sampler_ref = new ReadonlyRef(ComposeUniformSmapler.get());

    //#region full screen triangle

    protected readonly full_screen_triangle_vertex_array_ref = new ReadonlyRef(FullScreenTriangleVertexArray.get());
    protected readonly full_screen_background_pipeline_ref = new ReadonlyRef(FullScreenBackgroundPipeline.get());

    //#endregion

    //#region queue instance uniform groups

    protected readonly queue_0_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
    protected readonly queue_1_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());

    protected readonly queue_0_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
    protected readonly queue_1_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());

    //#endregion

    //#region frame buffer / textures

    protected readonly texture_size = Vector2.create(-1, -1);

    protected readonly solid_normal_texture_ref = new Ref<WebGPURenderStateTexture>();

    protected readonly solid_normal_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly solid_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));
    protected readonly solid_frame_buffer_1_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    protected readonly transparent_accum_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly transparent_reveal_texture_ref = new Ref<WebGPURenderStateTexture>();

    protected readonly transparent_accum_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly transparent_reveal_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly transparent_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    //#endregion

    //#region compose / oit compose

    protected readonly oit_compose_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(OitComposeUniformLayout.get()).expect());
    protected readonly oit_compose_pipeline_ref = new ReadonlyRef(OitComposePipeline.get());

    protected readonly color_compose_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(ColorComposeUniformLayout.get()).expect());
    protected readonly color_compose_pipeline_ref = new ReadonlyRef(ColorComposePipeline.get());

    protected readonly compose_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    //#endregion

    //#region result texture

    protected readonly result_color_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_normal_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_depth_texture_ref = new Ref<WebGPURenderStateTexture>();
    
    protected readonly result_color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_normal_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly result_depth_render_queue_1_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_color_render_queue_1_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_depth_render_queue_1_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_color_render_queue_1_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly result_empty_texture_view_ref = new ReadonlyRef(ResultEmptyTextureView.get());
    protected readonly result_depth_empty_texture_view_ref = new ReadonlyRef(ResultDepthEmptyTextureView.get());

    //#endregion

    //#region World Env Uniform

    protected readonly world_env_queue_0_uniform_solid_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    protected readonly world_env_queue_0_uniform_transparent_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());

    protected readonly world_env_queue_1_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());

    protected readonly world_env_uniform_camera_matrix_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.size).expect());
    protected readonly world_env_uniform_camera_matrix_array_buffer = new ArrayBuffer(RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.size);
    protected readonly world_env_uniform_camera_world = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[0].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[0].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_view = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[1].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[1].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_projection = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[2].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[2].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_inv_projection = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[3].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[3].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_normal_view = new Float32Array(this.world_env_uniform_camera_matrix_array_buffer, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[4].offset, RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout.members[4].size / Float32Array.BYTES_PER_ELEMENT);

    protected readonly world_env_uniform_params_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.size).expect());
    protected readonly world_env_uniform_params_array_buffer = new ArrayBuffer(RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.size);
    protected readonly world_env_uniform_screen_size = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[0].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[0].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_time = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_is_orthogonal = new Uint32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].size / Uint32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_pixel_ratio: Float32Array = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].size / Float32Array.BYTES_PER_ELEMENT);

    //#endregion

    //#region Lights Uniform

    protected readonly lights_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.lights_uniform_layout).expect());

    //#endregion

    constructor() {
        super();

        this.queue_0_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_1_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_0_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_transparent_instance_uniform_buffer_view_ref.expect);
        this.queue_1_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_transparent_instance_uniform_buffer_view_ref.expect);

        this.oit_compose_uniform_group_ref.expect.set_Sampler(2, this.compose_uniform_sampler_ref.expect);
        this.color_compose_uniform_group_ref.expect.set_Sampler(1, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_0_uniform_solid_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Texture(3, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Sampler(4, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(3, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Sampler(4, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_1_uniform_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Texture(3, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Sampler(4, this.compose_uniform_sampler_ref.expect);
    }

    public set_WorldEnvUniform(camera_world: Matrix4, camera_projection: Matrix4, camera_is_orthogonal: boolean, time: number, pixel_ratio: number, screen_width: number, screen_height: number) {
        // camera world
        {
            this.world_env_uniform_camera_world[0] = camera_world.n11;
            this.world_env_uniform_camera_world[1] = camera_world.n21;
            this.world_env_uniform_camera_world[2] = camera_world.n31;
            this.world_env_uniform_camera_world[3] = camera_world.n41;
            this.world_env_uniform_camera_world[4] = camera_world.n12;
            this.world_env_uniform_camera_world[5] = camera_world.n22;
            this.world_env_uniform_camera_world[6] = camera_world.n32;
            this.world_env_uniform_camera_world[7] = camera_world.n42;
            this.world_env_uniform_camera_world[8] = camera_world.n13;
            this.world_env_uniform_camera_world[9] = camera_world.n23;
            this.world_env_uniform_camera_world[10] = camera_world.n33;
            this.world_env_uniform_camera_world[11] = camera_world.n43;
            this.world_env_uniform_camera_world[12] = camera_world.n14;
            this.world_env_uniform_camera_world[13] = camera_world.n24;
            this.world_env_uniform_camera_world[14] = camera_world.n34;
            this.world_env_uniform_camera_world[15] = camera_world.n44;
        }
        // camera view
        {
            const matrix = RenderServerRenderer3D.#tmp_matrix4_0.inverse(camera_world);
            this.world_env_uniform_camera_view[0] = matrix.n11;
            this.world_env_uniform_camera_view[1] = matrix.n21;
            this.world_env_uniform_camera_view[2] = matrix.n31;
            this.world_env_uniform_camera_view[3] = matrix.n41;
            this.world_env_uniform_camera_view[4] = matrix.n12;
            this.world_env_uniform_camera_view[5] = matrix.n22;
            this.world_env_uniform_camera_view[6] = matrix.n32;
            this.world_env_uniform_camera_view[7] = matrix.n42;
            this.world_env_uniform_camera_view[8] = matrix.n13;
            this.world_env_uniform_camera_view[9] = matrix.n23;
            this.world_env_uniform_camera_view[10] = matrix.n33;
            this.world_env_uniform_camera_view[11] = matrix.n43;
            this.world_env_uniform_camera_view[12] = matrix.n14;
            this.world_env_uniform_camera_view[13] = matrix.n24;
            this.world_env_uniform_camera_view[14] = matrix.n34;
            this.world_env_uniform_camera_view[15] = matrix.n44;
        }
        // camera normal view
        {
            // transpose( inverse( mat3( inverse( camera_world ) ) ) )
            const matrix = RenderServerRenderer3D.#tmp_matrix4_0.get_Basis(RenderServerRenderer3D.#tmp_matrix3_0);
            matrix.inverse(matrix);
            // transpose by writing code
            this.world_env_uniform_camera_normal_view[0] = matrix.n11;
            this.world_env_uniform_camera_normal_view[1] = matrix.n12;
            this.world_env_uniform_camera_normal_view[2] = matrix.n13;
            this.world_env_uniform_camera_normal_view[3] = matrix.n21;
            this.world_env_uniform_camera_normal_view[4] = matrix.n22;
            this.world_env_uniform_camera_normal_view[5] = matrix.n23;
            this.world_env_uniform_camera_normal_view[6] = matrix.n31;
            this.world_env_uniform_camera_normal_view[7] = matrix.n32;
            this.world_env_uniform_camera_normal_view[8] = matrix.n33;
        }
        // camera projection
        {
            this.world_env_uniform_camera_projection[0] = camera_projection.n11;
            this.world_env_uniform_camera_projection[1] = camera_projection.n21;
            this.world_env_uniform_camera_projection[2] = camera_projection.n31;
            this.world_env_uniform_camera_projection[3] = camera_projection.n41;
            this.world_env_uniform_camera_projection[4] = camera_projection.n12;
            this.world_env_uniform_camera_projection[5] = camera_projection.n22;
            this.world_env_uniform_camera_projection[6] = camera_projection.n32;
            this.world_env_uniform_camera_projection[7] = camera_projection.n42;
            this.world_env_uniform_camera_projection[8] = camera_projection.n13;
            this.world_env_uniform_camera_projection[9] = camera_projection.n23;
            this.world_env_uniform_camera_projection[10] = camera_projection.n33;
            this.world_env_uniform_camera_projection[11] = camera_projection.n43;
            this.world_env_uniform_camera_projection[12] = camera_projection.n14;
            this.world_env_uniform_camera_projection[13] = camera_projection.n24;
            this.world_env_uniform_camera_projection[14] = camera_projection.n34;
            this.world_env_uniform_camera_projection[15] = camera_projection.n44;
        }
        // camera inv projection
        {
            const matrix = RenderServerRenderer3D.#tmp_matrix4_0.inverse(camera_projection);
            this.world_env_uniform_camera_inv_projection[0] = matrix.n11;
            this.world_env_uniform_camera_inv_projection[1] = matrix.n21;
            this.world_env_uniform_camera_inv_projection[2] = matrix.n31;
            this.world_env_uniform_camera_inv_projection[3] = matrix.n41;
            this.world_env_uniform_camera_inv_projection[4] = matrix.n12;
            this.world_env_uniform_camera_inv_projection[5] = matrix.n22;
            this.world_env_uniform_camera_inv_projection[6] = matrix.n32;
            this.world_env_uniform_camera_inv_projection[7] = matrix.n42;
            this.world_env_uniform_camera_inv_projection[8] = matrix.n13;
            this.world_env_uniform_camera_inv_projection[9] = matrix.n23;
            this.world_env_uniform_camera_inv_projection[10] = matrix.n33;
            this.world_env_uniform_camera_inv_projection[11] = matrix.n43;
            this.world_env_uniform_camera_inv_projection[12] = matrix.n14;
            this.world_env_uniform_camera_inv_projection[13] = matrix.n24;
            this.world_env_uniform_camera_inv_projection[14] = matrix.n34;
            this.world_env_uniform_camera_inv_projection[15] = matrix.n44;
        }
        // camera is orth
        {
            this.world_env_uniform_camera_is_orthogonal[0] = camera_is_orthogonal ? 1 : 0;
        }
        // time
        {
            this.world_env_uniform_time[0] = time;
        }
        // screen size
        {
            this.world_env_uniform_screen_size[0] = screen_width;
            this.world_env_uniform_screen_size[1] = screen_height;
        }
        // pixel ratio
        {
            this.world_env_uniform_pixel_ratio[0] = pixel_ratio;
        }
        this.world_env_uniform_camera_matrix_buffer_ref.expect.update_Data(0, this.world_env_uniform_camera_matrix_array_buffer);
        this.world_env_uniform_params_buffer_ref.expect.update_Data(0, this.world_env_uniform_params_array_buffer);
    }

    public resize(width: number, height: number) {
        if (this.texture_size.x !== width || this.texture_size.y !== height) {
            this.texture_size.set(width, height);

            this.solid_normal_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_depth_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.D32F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.solid_normal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.solid_normal_texture_ref.expect).expect();
            this.result_depth_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_depth_texture_ref.expect).expect();

            this.transparent_accum_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.transparent_reveal_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.R16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.transparent_accum_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.transparent_accum_texture_ref.expect).expect();
            this.transparent_reveal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.transparent_reveal_texture_ref.expect).expect();

            this.oit_compose_uniform_group_ref.expect.set_Texture(0, this.transparent_accum_texture_view_ref.expect);
            this.oit_compose_uniform_group_ref.expect.set_Texture(1, this.transparent_reveal_texture_view_ref.expect);

            this.result_color_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_normal_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_depth_render_queue_1_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.D32F , WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_color_render_queue_1_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_color_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_color_texture_ref.expect).expect();
            this.result_normal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_normal_texture_ref.expect).expect();
            this.result_depth_render_queue_1_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_depth_render_queue_1_texture_ref.expect).expect();
            this.result_color_render_queue_1_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_color_render_queue_1_texture_ref.expect).expect();

            this.color_compose_uniform_group_ref.expect.set_Texture(0, this.result_color_texture_view_ref.expect);

            this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(2, this.result_color_texture_view_ref.expect);
            this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(3, this.result_depth_texture_view_ref.expect);

            this.world_env_queue_1_uniform_group_ref.expect.set_Texture(2, this.result_color_render_queue_1_texture_view_ref.expect);
            this.world_env_queue_1_uniform_group_ref.expect.set_Texture(3, this.result_depth_render_queue_1_texture_view_ref.expect);

            return true;
        }
        return false;
    }

    public reset_FrameBuffer() {
        this.solid_frame_buffer_ref.expect.clear_Attachments();
        this.solid_frame_buffer_ref.expect.clear_DepthStencilAttachment();
        this.solid_frame_buffer_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, true, Vector4.create(0.2, 0.2, 0.2, 1), true);
        this.solid_frame_buffer_ref.expect.add_Attachment(this.result_normal_texture_view_ref.expect, true, Vector4.create(0, 0, 0, 1), true);
        this.solid_frame_buffer_ref.expect.set_DepthStencilAttachment(this.result_depth_texture_view_ref.expect, true, 1, true, false);

        this.solid_frame_buffer_1_ref.expect.clear_Attachments();
        this.solid_frame_buffer_1_ref.expect.clear_DepthStencilAttachment();
        this.solid_frame_buffer_1_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, false, Vector4.create(0, 0, 0, 0), true);
        this.solid_frame_buffer_1_ref.expect.add_Attachment(this.result_normal_texture_view_ref.expect, false, Vector4.create(0, 0, 0, 0), false);
        this.solid_frame_buffer_1_ref.expect.set_DepthStencilAttachment(this.result_depth_texture_view_ref.expect, true, 1, true, false);

        this.transparent_frame_buffer_ref.expect.clear_Attachments();
        this.transparent_frame_buffer_ref.expect.clear_DepthStencilAttachment();
        this.transparent_frame_buffer_ref.expect.add_Attachment(this.transparent_accum_texture_view_ref.expect, true, Vector4.create(1, 1, 1, 0), true);
        this.transparent_frame_buffer_ref.expect.add_Attachment(this.transparent_reveal_texture_view_ref.expect, true, Vector4.create(1, 1, 1, 1), true);
        this.transparent_frame_buffer_ref.expect.set_DepthStencilAttachment(this.result_depth_texture_view_ref.expect, false, 1, false, true);

        this.compose_frame_buffer_ref.expect.clear_Attachments();
        this.compose_frame_buffer_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, false, Vector4.create(0, 0, 0, 0), true);
    }

    private last_viewport_id: number = 0;

    public render(world: World3D, camera: Camera3, viewport: RenderServerViewport, time: number, once: boolean) {

        //#region constants

        const camera_world = camera.global_transform;
        const camera_projection = camera.projection;
        const camera_is_orthogonal = camera.is_orthogonal;
        const camera_frustum = camera.get_Frustum(RenderServerRenderer3D.#tmp_frustum_0);

        //#endregion

        //#region Resize Reset FrameBuffer

        viewport.set_PixelRatio();
        const { x: texture_width, y: texture_height } = viewport.get_Size(RenderServerRenderer3D.#tmp_vector_0);
        if (this.resize(texture_width, texture_height) || viewport.id !== this.last_viewport_id) {
            this.reset_FrameBuffer();
        }
        this.last_viewport_id = viewport.id;
        viewport.update_Size();

        //#endregion

        //#region setup global uniforms

        this.set_WorldEnvUniform(camera_world, camera_projection, camera_is_orthogonal, time, viewport.pixel_ratio, texture_width, texture_height);

        //#endregion

        //#region render queue

        const visual_world_meshes = world.visual_world.meshes;
        const screen_size = viewport.get_RawSize(RenderServerRenderer3D.#tmp_vector_0);
        this.fill_Queue(visual_world_meshes, camera, camera_frustum, screen_size);
        this.queue_0.commit_InstanceUniformBuffers();
        this.queue_1.commit_InstanceUniformBuffers();

        //#endregion

        //#region render

        const encoder = RenderServer.render_state.device.createCommandEncoder();
        this.render_Queue0Solid(encoder);
        this.render_Queue0Transparent(encoder);
        encoder.copyTextureToTexture({ texture: this.result_color_texture_ref.expect.texture }, { texture: this.result_color_render_queue_1_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        encoder.copyTextureToTexture({ texture: this.result_depth_texture_ref.expect.texture }, { texture: this.result_depth_render_queue_1_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        this.render_Queue1Solid(encoder);
        this.render_Queue1Transparent(encoder);
        encoder.copyTextureToTexture({ texture: this.result_color_texture_ref.expect.texture }, { texture: viewport.canvas_texture_view.texture }, { width: texture_width, height: texture_height });
        RenderServer.render_state.device.queue.submit([encoder.finish()]);

        //#endregion

        //#region cleanup

        if (once) {
            this.queue_0.clear();
            this.queue_1.clear();
        }

        //#endregion
    }

    protected fill_Queue(meshes: Iterable<VisualWorld3DMesh>, camera: Camera3, camera_frustum: Frustum3, screen_size: Vector2) {
        let total_objects_count = 0;
        let rendered_objects_count = 0;
        this.queue_0.reset();
        this.queue_1.reset();
        for (const mesh of meshes) {
            total_objects_count++;
            const render_queue = mesh.render_queue;
            const queue = render_queue === 0 ? this.queue_0 : this.queue_1;
            if (queue !== undefined) {
                // if (editor_highlighted && mesh.editor_highlighted) {
                //     queue.addtion_sync_queue = this.render_queue_highlight;
                // }
                if (mesh.fill_RenderQueue(queue, camera, camera_frustum, screen_size)) {
                    rendered_objects_count++;
                }
                // queue.addtion_sync_queue = undefined;
            }
        }
    }

    //#region queue 0

    protected render_Queue0Solid(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.solid_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_0_uniform_solid_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        for (let i = 0; i <= this.queue_0.solid_pointer; i++) {
            const vertex_array = this.queue_0.solid_vertex_array[i]!;
            const material = this.queue_0.solid_material[i]!;
            material.update_UniformBuffers();
            const pipeline_uniform = material.get_PipelineUniform(RenderServerMaterialPass.Solid, vertex_array, this.solid_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual);
            if (pipeline_uniform === undefined) continue;
            const { pipeline, uniform } = pipeline_uniform;
            if (uniform !== undefined) {
                render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
            }
            const instance_count = this.queue_0.get_InstanceCount(false, i);
            dynamic_offsets[0] = i * RenderServerSingleton.InstanceUniformMemoryLayout.size;
            render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, this.queue_0_solid_instance_uniform_group_ref.expect.binding_group, dynamic_offsets);
            render_pass.setPipeline(pipeline.pipeline);
            vertex_array.bind_Buffers(render_pass);
            vertex_array.draw(render_pass, instance_count);
        }

        // background
        render_pass.setPipeline(this.full_screen_background_pipeline_ref.expect.pipeline);
        this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(render_pass);
        this.full_screen_triangle_vertex_array_ref.expect.draw(render_pass);

        render_pass.end();
    }

    protected render_Queue0Transparent(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.transparent_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_0_uniform_transparent_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        for (let i = 0; i <= this.queue_0.transparent_pointer; i++) {
            const vertex_array = this.queue_0.transparent_vertex_array[i]!;
            const material = this.queue_0.transparent_material[i]!;
            material.update_UniformBuffers();
            const pipeline_uniform = material.get_PipelineUniform(RenderServerMaterialPass.Transparent, vertex_array, this.transparent_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual);
            if (pipeline_uniform === undefined) continue;
            const { pipeline, uniform } = pipeline_uniform;
            if (uniform !== undefined) {
                render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
            }
            const instance_count = this.queue_0.get_InstanceCount(true, i);
            dynamic_offsets[0] = i * RenderServerSingleton.InstanceUniformMemoryLayout.size;
            render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, this.queue_0_transparent_instance_uniform_group_ref.expect.binding_group, dynamic_offsets);
            render_pass.setPipeline(pipeline.pipeline);
            vertex_array.bind_Buffers(render_pass);
            vertex_array.draw(render_pass, instance_count);
        }

        render_pass.end();

        // compose
        const compose_pass = encoder.beginRenderPass(this.compose_frame_buffer_ref.expect.frame_buffer_desc);
        compose_pass.setPipeline(this.oit_compose_pipeline_ref.expect.pipeline);
        compose_pass.setBindGroup(0, this.oit_compose_uniform_group_ref.expect.binding_group);
        this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(compose_pass);
        this.full_screen_triangle_vertex_array_ref.expect.draw(compose_pass);

        compose_pass.end();
    }

    //#endregion

    //#region queue 1

    protected render_Queue1Solid(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.solid_frame_buffer_1_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_1_uniform_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        for (let i = 0; i <= this.queue_1.solid_pointer; i++) {
            const vertex_array = this.queue_1.solid_vertex_array[i]!;
            const material = this.queue_1.solid_material[i]!;
            material.update_UniformBuffers();
            const pipeline_uniform = material.get_PipelineUniform(RenderServerMaterialPass.Solid, vertex_array, this.solid_frame_buffer_1_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual);
            if (pipeline_uniform === undefined) continue;
            const { pipeline, uniform } = pipeline_uniform;
            if (uniform !== undefined) {
                render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
            }
            const instance_count = this.queue_1.get_InstanceCount(false, i);
            dynamic_offsets[0] = i * RenderServerSingleton.InstanceUniformMemoryLayout.size;
            render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, this.queue_1_solid_instance_uniform_group_ref.expect.binding_group, dynamic_offsets);
            render_pass.setPipeline(pipeline.pipeline);
            vertex_array.bind_Buffers(render_pass);
            vertex_array.draw(render_pass, instance_count);
        }

        render_pass.end();
    }

    protected render_Queue1Transparent(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.transparent_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_1_uniform_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        for (let i = 0; i <= this.queue_1.transparent_pointer; i++) {
            const vertex_array = this.queue_1.transparent_vertex_array[i]!;
            const material = this.queue_1.transparent_material[i]!;
            material.update_UniformBuffers();
            const pipeline_uniform = material.get_PipelineUniform(RenderServerMaterialPass.Transparent, vertex_array, this.transparent_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual);
            if (pipeline_uniform === undefined) continue;
            const { pipeline, uniform } = pipeline_uniform;
            if (uniform !== undefined) {
                render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
            }
            const instance_count = this.queue_1.get_InstanceCount(true, i);
            dynamic_offsets[0] = i * RenderServerSingleton.InstanceUniformMemoryLayout.size;
            render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, this.queue_1_transparent_instance_uniform_group_ref.expect.binding_group, dynamic_offsets);
            render_pass.setPipeline(pipeline.pipeline);
            vertex_array.bind_Buffers(render_pass);
            vertex_array.draw(render_pass, instance_count);
        }

        render_pass.end();

        // compose
        const compose_pass = encoder.beginRenderPass(this.compose_frame_buffer_ref.expect.frame_buffer_desc);
        compose_pass.setPipeline(this.oit_compose_pipeline_ref.expect.pipeline);
        compose_pass.setBindGroup(0, this.oit_compose_uniform_group_ref.expect.binding_group);
        this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(compose_pass);
        this.full_screen_triangle_vertex_array_ref.expect.draw(compose_pass);

        compose_pass.end();
    }

    //#endregion

    public dispose(): void {
        this.queue_0.dispose();
        this.queue_1.dispose();

        this.full_screen_triangle_vertex_array_ref.clear();
        this.full_screen_background_pipeline_ref.clear();

        this.solid_normal_texture_ref.clear();
        this.result_depth_texture_ref.clear();

        this.solid_normal_texture_view_ref.clear();
        this.result_depth_texture_view_ref.clear();

        this.solid_frame_buffer_ref.clear();
        this.solid_frame_buffer_1_ref.clear();

        this.transparent_accum_texture_ref.clear();
        this.transparent_reveal_texture_ref.clear();

        this.transparent_accum_texture_view_ref.clear();
        this.transparent_reveal_texture_view_ref.clear();

        this.transparent_frame_buffer_ref.clear();

        this.compose_uniform_sampler_ref.clear();

        this.oit_compose_uniform_group_ref.clear();
        this.oit_compose_pipeline_ref.clear();

        this.color_compose_uniform_group_ref.clear();
        this.color_compose_pipeline_ref.clear();

        this.compose_frame_buffer_ref.clear();

        this.result_color_texture_ref.clear();
        this.result_normal_texture_ref.clear();
        this.result_depth_render_queue_1_texture_ref.clear();
        this.result_color_render_queue_1_texture_ref.clear();
        this.result_color_texture_view_ref.clear();
        this.result_normal_texture_view_ref.clear();
        this.result_depth_render_queue_1_texture_view_ref.clear();
        this.result_color_render_queue_1_texture_view_ref.clear();

        this.result_empty_texture_view_ref.clear();
        this.result_depth_empty_texture_view_ref.clear();

        this.queue_0_solid_instance_uniform_group_ref.clear();
        this.queue_0_solid_instance_uniform_buffer_view_ref.clear();
        this.queue_1_solid_instance_uniform_group_ref.clear();
        this.queue_1_solid_instance_uniform_buffer_view_ref.clear();
        this.queue_0_transparent_instance_uniform_group_ref.clear();
        this.queue_0_transparent_instance_uniform_buffer_view_ref.clear();
        this.queue_1_transparent_instance_uniform_group_ref.clear();
        this.queue_1_transparent_instance_uniform_buffer_view_ref.clear();

        this.world_env_queue_0_uniform_solid_group_ref.clear();
        this.world_env_queue_0_uniform_transparent_group_ref.clear();
        this.world_env_queue_1_uniform_group_ref.clear();
        this.world_env_uniform_camera_matrix_buffer_ref.clear();
        this.world_env_uniform_params_buffer_ref.clear();
        this.lights_uniform_group_ref.clear();
    }
}