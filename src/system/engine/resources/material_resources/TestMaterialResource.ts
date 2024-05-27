import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServer, RenderServerDefaultTextureType, RenderServerSingleton } from "../../render_server/RenderServer";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../render_server/geometry/RenderServerGeometryDefination";
import { RenderServerMaterial, RenderServerMaterialPass } from "../../render_server/material/RenderServerMaterial";
import { MaterialResource, MaterialTextureSamplerStorage } from "./MaterialResource";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import type { Texture2DResource } from "../texture_resources/texture2d_resources/Texture2DResource";
import { WebGPURenderElementVector4Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";

const TestMaterialResourceUniformLayout = new RefCacher(() => {
    const layout = RenderServer.render_state.create_UniformLayout();
    layout.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
    layout.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
    layout.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
    layout.add_Storage(true, WebGPURenderStateShaderType.Vertex, 3, false);
    return layout;
});

const TestMaterialResourceSolidPipelineCache = new RefCacher(() => {
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
                normal: mat3x3f,
                layer: u32,
            }

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(0) normal: vec3f,
                @location(1) uv: vec2f,
            };

            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var world_env_uniform_color_texture: texture_2d<f32>;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var world_env_uniform_sampler: sampler;
            @group(${RenderServerSingleton.InstanceUniformBindGroupIndex}) @binding(0) var<uniform> instance_uniform: InstanceUniform; 
        
            @vertex
            fn vs_main(attri: Attributes) -> VertexOutput {
                var out: VertexOutput;
                var _world = instance_uniform.transform * vec4(attri.position, 1.0f);
                var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
                out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
                var _model_view = world_env_uniform_camera_matrix.camera_view * instance_uniform.transform;
                out.normal = world_env_uniform_camera_matrix.camera_norview * instance_uniform.normal * attri.normal;
                out.uv = attri.uv;
                return out;
            }

            struct Uniform {
                color: vec4f,
            };

            struct FragmentOutput {
                @location(0) color: vec4f,
                @location(1) normal: vec4f,
            };

            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform;
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_uniform_tex: texture_2d<f32>; 
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_uniform_sampler: sampler; 
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {
                var out: FragmentOutput;
                var normal = normalize(vary.normal);
                var tex = textureSample(mat_uniform_tex, mat_uniform_sampler, vary.uv);
                out.color = vec4f((normal + 1.0) / 2.0, 1.0); //mat_uniform.color * tex;
                out.normal = vec4f(normal, 1.0);
                return out;
            }
            `;
        const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
        const program = RenderServer.render_state.create_Program(shader, shader).expect();
        return program;
    }, RenderServerMaterialPass.Solid, TestMaterialResourceUniformLayout.get(), RenderServerGeometryAttributeLayout);
    return pipeline_cache;
});

const TestMaterialResourceTransparentPipelineCache = new RefCacher(() => {
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
                @location(2) color: vec4f,
            };

            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var world_env_uniform_color_texture: texture_2d<f32>;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var world_env_uniform_normal_texture: texture_2d<f32>;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var world_env_uniform_depth_texture: texture_depth_2d;
            @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var world_env_uniform_sampler: sampler;
            @group(${RenderServerSingleton.InstanceUniformBindGroupIndex}) @binding(0) var<uniform> instance_uniform: InstanceUniform; 
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(3) var<storage, read> colors_storage: array<vec4f>;
        
            @vertex
            fn vs_main(attri: Attributes, @builtin(vertex_index) index : u32) -> VertexOutput {
                var length = arrayLength(&colors_storage);
                var color = colors_storage[index % length];
                var out: VertexOutput;
                var _world = instance_uniform.transform * vec4(attri.position, 1.0f);
                var _world_in_view = world_env_uniform_camera_matrix.camera_view * _world;
                out.position = world_env_uniform_camera_matrix.camera_proj * _world_in_view;
                var _model_view = world_env_uniform_camera_matrix.camera_view * instance_uniform.transform;
                out.normal = vec3f(1.0, 1.0, 1.0);
                out.uv = attri.uv * 2.0;
                out.color = color;
                return out;
            }

            struct Uniform {
                color: vec4f,
            };

            struct FragmentOutput {
                @location(0) accum: vec4f,
                @location(1) reveal: f32,
            };

            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(0) var<uniform> mat_uniform: Uniform; 
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(1) var mat_uniform_tex: texture_2d<f32>; 
            @group(${RenderServerSingleton.UniformBindGroupIndex}) @binding(2) var mat_uniform_sampler: sampler; 
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {
                var out: FragmentOutput;
                var tex = textureSample(mat_uniform_tex, mat_uniform_sampler, vary.uv);
                var color = mat_uniform.color * tex * vary.color;
                var z = vary.position.z;
                var weight: f32 = max(min(1.0, max(max(color.r, color.g), color.b) * color.a), color.a) * clamp(0.03 / (1e-5 + pow(z / 200, 4.0)), 1e-2, 3e3);
                out.accum = vec4f(color.rgb * color.a, color.a) * weight;
                out.reveal = color.a;
                return out;
            }
            `;
        const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
        const program = RenderServer.render_state.create_Program(shader, shader).expect();
        return program;
    }, RenderServerMaterialPass.Transparent, TestMaterialResourceUniformLayout.get(), RenderServerGeometryAttributeLayout);
    return pipeline_cache;
});

export class TestMaterialResource extends MaterialResource {

    static UniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            WebGPURenderStateBufferUniformType.Vector4,
        ],
    });

    private readonly uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(TestMaterialResourceUniformLayout.get()).expect());
    private readonly uniform_buffer_ref = new ReadonlyRef(RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.Uniform, WebGPURenderStateBufferUsage.CopyDst, TestMaterialResource.UniformMemoryLayout.size, false).expect());
    private readonly uniform_array_buffer = new ArrayBuffer(TestMaterialResource.UniformMemoryLayout.size);
    private readonly uniform_colors_storage_buffer_ref = new ReadonlyRef(new WebGPURenderElementVector4Buffer(RenderServer.render_state, WebGPURenderStateBufferType.Storage, WebGPURenderStateBufferUsage.None, [
        Vector4.create(1, 0, 0, 1),
        Vector4.create(1, 0, 0, 1),
        Vector4.create(1, 0, 0, 1),
        Vector4.create(1, 0, 0, 1),
        Vector4.create(0, 1, 0, 1),
        Vector4.create(0, 1, 0, 1),
        Vector4.create(0, 1, 0, 1),
        Vector4.create(0, 1, 0, 1),
        Vector4.create(0, 0, 1, 1),
        Vector4.create(0, 0, 1, 1),
        Vector4.create(0, 0, 1, 1),
        Vector4.create(0, 0, 1, 1),
    ]));

    private _color = Vector4.new;
    public get color() { return this._color.clone(); }
    public set color(color: Vector4) {
        this._color.copy(color);
        this.render_server_material.is_transparent = this._color.w < 1;
        this.update_UniformBuffer();
    }

    private readonly texture_storage = new MaterialTextureSamplerStorage<Texture2DResource>(this.uniform_group_ref.expect, 1, undefined, RenderServerDefaultTextureType.White, 2, RenderServer.get_TextureSampler(undefined, undefined, undefined, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear));
    public get texture() { return this.texture_storage.get(); }
    public set texture(texture: Texture2DResource | undefined) { this.texture_storage.set(texture); }

    constructor() {
        super();
        this.uniform_group_ref.expect.set_BufferUniform(0, this.uniform_buffer_ref.expect);
        this.render_server_material.set_PipelineUniform(RenderServerMaterialPass.Solid, TestMaterialResourceSolidPipelineCache.get(), this.uniform_group_ref.expect);
        this.render_server_material.set_PipelineUniform(RenderServerMaterialPass.Transparent, TestMaterialResourceTransparentPipelineCache.get(), this.uniform_group_ref.expect);
        this.render_server_material.add_UniformBuffer(this.uniform_buffer_ref.expect, this.uniform_array_buffer);
        this.uniform_group_ref.expect.set_Storage(3, this.uniform_colors_storage_buffer_ref.expect.buffer);
        this.update_UniformBuffer();
    }

    private update_UniformBuffer() {
        const float32array0 = new Float32Array(this.uniform_array_buffer);
        float32array0[0] = this._color.x;
        float32array0[1] = this._color.y;
        float32array0[2] = this._color.z;
        float32array0[3] = this._color.w;
        this.render_server_material.trigger_UniformBufferChange(0);
    }

    protected dispose(): void {
        this.texture_storage.dispose();
        this.uniform_group_ref.clear();
        this.uniform_buffer_ref.clear();
        this.uniform_colors_storage_buffer_ref.clear();
        super.dispose();
    }
}