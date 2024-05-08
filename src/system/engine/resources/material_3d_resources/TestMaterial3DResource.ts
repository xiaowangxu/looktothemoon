import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServer, RenderServerSingleton } from "../../render_server/RenderServer";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../render_server/geometry/RenderServerGeometryDefination";
import { RenderServerMaterial, RenderServerMaterialPass } from "../../render_server/material/RenderServerMaterial";
import { Material3DResource } from "./Material3DResource";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { clamp } from "@/system/fivepebble/Scalar";

const TestMaterial3DResourceUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
    layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1, false);
    return layout;
});

const TestMaterial3DResourceSolidPipelineCache = new RefCacher(() => {
    const pipeline_cache = RenderServerMaterial.create_PipelineCache(hash => {
        const shader_code = `

            struct Attributes {
                @location(${RenderServerGeometryAttributeLocation.Position}) position: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Normal}) normal: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Uv}) uv: vec2f,
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

            struct InstanceUniform {
                transform: mat4x4f,
                layer: u32,
            }

            struct Uniform1 {
                shift: f32,
            };
        
            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
                @location(1) uv: vec2f,
            };

            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
            @group(${RenderServerSingleton.InstanceUniformBindGroupIndex}) @binding(0) var<uniform> instance_uniform: InstanceUniform; 
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var<uniform> mat_uniform_1: Uniform1; 
        
            @vertex
            fn vs_main(attri: Attributes) -> VertexOutput {
                var out: VertexOutput;
                var _world = instance_uniform.transform * vec4(attri.position + vec3f(mat_uniform_1.shift, 0.0, 0.0), 1.0f);
                var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
                out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
                var _model_view = world_env_uniform_camera_matrix.camera_view * instance_uniform.transform;
                out.normal = vec3f(1.0, 1.0, 1.0);
                out.uv = attri.uv;
                return out;
            }

            struct Uniform0 {
                opacity: f32,
            };

            struct FragmentOutput {
                @location(0) color: vec4f,
                @location(1) normal: vec4f,
            };

            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform_0: Uniform0; 
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {
                var out: FragmentOutput;
                out.color = vec4f(vary.uv * mat_uniform_0.opacity, 0.0, 1.0);
                out.normal = vec4f(0.0, 0.0, 1.0, 1.0);
                return out;
            }
            `;
        const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
        const program = RenderServer.render_state.create_Program(shader, shader).expect();
        return program;
    }, RenderServerMaterialPass.Solid, TestMaterial3DResourceUniformLayout.get(), RenderServerGeometryAttributeLayout);
    return pipeline_cache;
});

const TestMaterial3DResourceTransparentPipelineCache = new RefCacher(() => {
    const pipeline_cache = RenderServerMaterial.create_PipelineCache(hash => {
        const shader_code = `

            struct Attributes {
                @location(${RenderServerGeometryAttributeLocation.Position}) position: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Normal}) normal: vec3f,
                @location(${RenderServerGeometryAttributeLocation.Uv}) uv: vec2f,
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

            struct InstanceUniform {
                transform: mat4x4f,
                layer: u32,
            }
        
            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
                @location(1) uv: vec2f,
            };

            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
            @group(${RenderServerSingleton.InstanceUniformBindGroupIndex}) @binding(0) var<uniform> instance_uniform: InstanceUniform; 
        
            @vertex
            fn vs_main(attri: Attributes) -> VertexOutput {
                var out: VertexOutput;
                var _world = instance_uniform.transform * vec4(attri.position, 1.0f);
                var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
                out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
                var _model_view = world_env_uniform_camera_matrix.camera_view * instance_uniform.transform;
                out.normal = vec3f(1.0, 1.0, 1.0);
                out.uv = attri.uv;
                return out;
            }

            struct FragmentOutput {
                @location(0) accum: vec4f,
                @location(1) reveal: f32,
            };
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {
                var out: FragmentOutput;
                out.accum = vec4f(vary.uv, 0.0, 1.0);
                out.reveal = 1.0;
                return out;
            }
            `;
        const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
        const program = RenderServer.render_state.create_Program(shader, shader).expect();
        return program;
    }, RenderServerMaterialPass.Transparent, TestMaterial3DResourceUniformLayout.get(), RenderServerGeometryAttributeLayout);
    return pipeline_cache;
});

export class TestMaterial3DResource extends Material3DResource {

    static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            WebGPURenderStateBufferUniformType.Float,
        ],
    });

    private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(TestMaterial3DResourceUniformLayout.get()).expect());
    private readonly uniform_buffer_0_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, TestMaterial3DResource.UniformMemoryLayout.size, false).expect());
    private readonly uniform_buffer_1_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, TestMaterial3DResource.UniformMemoryLayout.size, false).expect());
    private readonly unifrom_array_buffer_0 = new ArrayBuffer(TestMaterial3DResource.UniformMemoryLayout.size);
    private readonly unifrom_array_buffer_1 = new ArrayBuffer(TestMaterial3DResource.UniformMemoryLayout.size);

    private _opacity: number = 1.0;
    public get opacity() { return this._opacity; }
    public set opacity(opacity: number) {
        opacity = clamp(opacity, 0.0, 1.0);
        if (opacity !== this._opacity) {
            this._opacity = opacity;
            this.update_UniformBuffer();
        }
    }

    private _shift: number = 0.0;
    public get shift() { return this._shift; }
    public set shift(shift: number) {
        if (shift !== this._shift) {
            this._shift = shift;
            this.update_UniformBuffer();
        }
    }

    constructor() {
        super();
        this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_0_ref.expect);
        this.uniform_group_ref.expect.set_BufferUniform(1, this.uniform_buffer_1_ref.expect);
        this.render_server_material.set_PipelineUniform(RenderServerMaterialPass.Solid, TestMaterial3DResourceSolidPipelineCache.get(), this.uniform_group_ref.expect);
        this.render_server_material.set_PipelineUniform(RenderServerMaterialPass.Transparent, TestMaterial3DResourceTransparentPipelineCache.get(), this.uniform_group_ref.expect);
        this.render_server_material.add_UniformBuffer(this.uniform_buffer_0_ref.expect, this.unifrom_array_buffer_0);
        this.render_server_material.add_UniformBuffer(this.uniform_buffer_1_ref.expect, this.unifrom_array_buffer_1);
        this.update_UniformBuffer();
    }

    private update_UniformBuffer() {
        const float32array0 = new Float32Array(this.unifrom_array_buffer_0);
        float32array0[0] = this._opacity;
        this.render_server_material.trigger_UniformBufferChange(0);
        const float32array1 = new Float32Array(this.unifrom_array_buffer_1);
        float32array1[0] = this._shift;
        this.render_server_material.trigger_UniformBufferChange(1);
    }

    protected dispose(): void {
        this.uniform_group_ref.clear();
        this.uniform_buffer_0_ref.clear();
        super.dispose();
    }
}