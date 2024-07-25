import { RenderServerGeometryAttributeLocation } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { RenderServerRenderMaterial, RenderServerRenderMaterialPass } from "@/system/engine/render_server/material/RenderServerRenderMaterial";
import { RenderServerSingleton, RenderServer } from "@/system/engine/render_server/RenderServer";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateStencilOperator } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateOutputState";
import { WebGPURenderStateDepthCompareFunc } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { ReadonlyRef, RefCacher } from "@/system/utils/RefCounted";
import { PostprocessingResource } from "./PostprocessingResource";
import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";

// https://github.com/fintelia/smaa-rs/blob/main/third_party/smaa/SMAA.hlsl#L1021

const EffectToneMapPipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    ${RenderServerSingleton.WorldUniformsStructCode}
    
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
    };

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
	    var uv = attri.position / 2.0;
        out.uv = vec2(uv.x, 1.0 - uv.y);
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var color: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var normal: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var depth: texture_depth_2d;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;

    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        let linear_color = textureSample(color, sample, vary.uv);
        out.color = vec4f(aces_tone_mapping(linear_color.rgb, 0.8), linear_color.a);
        return out;
    }
    
    fn to_srgb(color: vec3f) -> vec3f {
        var _color: vec3f;
        var r = color.r;
        _color.r = select(1.055 * pow(r, 1.0 / 2.4) - 0.055, 12.92 * r, r <= 0.0031308);
        var g = color.g;
        _color.g = select(1.055 * pow(g, 1.0 / 2.4) - 0.055, 12.92 * g, g <= 0.0031308);
        var b = color.b;
        _color.b = select(1.055 * pow(b, 1.0 / 2.4) - 0.055, 12.92 * b, b <= 0.0031308);
        return _color;
    }

    fn linear_tone_mapping(color: vec3f, adapted_lum: f32) -> vec3f {
    	return color;
    }

    fn aces_tone_mapping(color: vec3f, adapted_lum: f32) -> vec3f {
    	const A: f32 = 2.51f;
    	const B: f32 = 0.03f;
    	const C: f32 = 2.43f;
    	const D: f32 = 0.59f;
    	const E: f32 = 0.14f;
    	var _color = color * adapted_lum;
    	return (_color * (A * _color + B)) / (_color * (C * _color + D) + E);
    }

    fn reinhard_tone_mapping(color: vec3f, adapted_lum: f32) -> vec3f {
        const MIDDLE_GREY: f32 = 1;
        var _color = color * (MIDDLE_GREY / adapted_lum);
        return _color / (1.0 + _color);
    }

    fn filmic_f(x: vec3f) -> vec3f {
    	const A: f32 = 0.22f;
    	const B: f32 = 0.30f;
    	const C: f32 = 0.10f;
    	const D: f32 = 0.20f;
    	const E: f32 = 0.01f;
    	const F: f32 = 0.30f;
    	return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
    }

    fn filmic_tone_mapping(color: vec3f, adapted_lum: f32) -> vec3f {
    	const WHITE: vec3f = vec3f(11.2);
    	return filmic_f(1.6f * adapted_lum * color) / filmic_f(WHITE);
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        {
            ...RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
            stencil_front: {
                compare: WebGPURenderStateDepthCompareFunc.Always,
                pass_operator: WebGPURenderStateStencilOperator.Replace
            },
            stencil_back: {
                compare: WebGPURenderStateDepthCompareFunc.Never,
            },
            stencil_read_mask: 0xff,
            stencil_write_mask: 0xff,
        },
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

export class ToneMapPostprocessingResource extends PostprocessingResource {

    public get pass_count(): number { return 1; }

    protected readonly tonemap_pipeline_ref = new ReadonlyRef(EffectToneMapPipeline.get());

    public render_Pass(pass: number, encoder: GPURenderPassEncoder, color_texture_view: WebGPURenderStateTextureView, normal_texture_view: WebGPURenderStateTextureView, depth_texture_view: WebGPURenderStateTextureView): void {
        switch (pass) {
            case 0: {
                encoder.setPipeline(this.tonemap_pipeline_ref.expect.pipeline);
                break;
            }
            default: {
                break;
            }
        }
    }

    protected dispose(): void {
        this.tonemap_pipeline_ref.clear();
    }
}