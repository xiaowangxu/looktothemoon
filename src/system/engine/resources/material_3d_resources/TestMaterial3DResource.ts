import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { RenderServer, RenderServerSingleton } from "../../render_server/RenderServer";
import { RenderServerGeometryAttributeLayout, RenderServerGeometryAttributeLocation } from "../../render_server/geometry/RenderServerGeometryDefination";
import { RenderServerMaterial, RenderServerMaterialPass } from "../../render_server/material/RenderServerMaterial";
import { Material3DResource } from "./Material3DResource";

export class TestMaterial3DResource extends Material3DResource {

    constructor() {
        super();
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
                @location(0) color: vec4f,
                @location(1) normal: vec4f,
            };
        
            @fragment
            fn fs_main(vary: VertexOutput) -> FragmentOutput {
                var out: FragmentOutput;
                out.color = vec4f(vary.uv, 0.0, 1.0);
                out.normal = vec4f(0.0, 0.0, 1.0, 1.0);
                return out;
            }
            `;

            const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
            const program = RenderServer.render_state.create_Program(shader, shader).expect();
            return program;
        }, RenderServerMaterialPass.Solid, undefined, RenderServerGeometryAttributeLayout);
        this.render_server_material.set_PipelineUniform(RenderServerMaterialPass.Solid, pipeline_cache, undefined);
    }

}