import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import type { World3D } from "../../worlds/world3ds/World3D";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { RenderServerViewport } from "../viewport/RenderServerViewport";
import { RenderServerRenderer3DQueue, type RenderServerRenderer3DQueueVeretxArray } from "./RenderServerRenderer3DQueue";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { VisualWorld3DMesh } from "../../worlds/world3ds/VisualWorld3D";
import type { WebGPURenderStateTextureView } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import { ReadonlyRef, Ref, RefCacher } from "@/system/utils/RefCounted";
import { RenderServer, RenderServerDefaultTextureType, RenderServerSingleton } from "../RenderServer";
import { WebGPURenderStateTextureUsage, WebGPURenderStateTextureFormat, WebGPURenderStateTexture, WebGPURenderStateTextureDimension } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderElementFrameBuffer } from "@/system/sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderServerRenderMaterial, RenderServerRenderMaterialPass } from "../material/RenderServerRenderMaterial";
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
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";
import type { WebGPURenderStateUniformGroup } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import type { RenderServerComputeMaterial } from "../material/RenderServerComputeMaterial";
import { RenderServerLightClusterData } from "../light/RenderServerLightClusterData";
import { LightClusterMaterial3DResource } from "../../resources/material_resources/material3d_resources/LightClusterMaterial3DResource";
import type { MaterialResource } from "../../resources/material_resources/MaterialResource";

const FullScreenTriangleVertexArray = new RefCacher(() => {
    const vertex_array = new WebGPURenderElementVertexArray(RenderServer.render_state, WebGPURenderStatePrimitiveType.Triangles, 0, 3);
    const { buffer, data } = RenderServer.render_state.create_Buffer(WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, 24, true, true).expect();
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
        @location(0) uv: vec2f,
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
    
    struct LightDataUniform {
        position: vec4f,
        direction_attenuation: vec4f,
        color: vec3f,
        layer: u32,
        mask: u32,
        visible_queue_type: u32,
        shadow_0: u32,
        shadow_1: u32,
        shadow_2: u32,
        shadow_3: u32,
        shadow_4: u32,
        shadow_5: u32,
        params: vec4f,
    }

    struct LightUniform {
        count: u32,
    }

    @group(${RenderServerSingleton.LightsUniformBindGroupIndex}) @binding(0) var<storage, read> light_data_uniform: array<LightDataUniform>;
    @group(${RenderServerSingleton.LightsUniformBindGroupIndex}) @binding(1) var<uniform> light_uniform: LightUniform;
    @group(${RenderServerSingleton.LightsUniformBindGroupIndex}) @binding(2) var light_uniform_background_texture: texture_cube<f32>;
    @group(${RenderServerSingleton.LightsUniformBindGroupIndex}) @binding(3) var light_uniform_sampler: sampler;
    
    const PI: f32 = 3.141592653589793;
    const TAU: f32 = 6.283185307179586;
    const EPSILON: f32 = 1E-10;

    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;

        var view = world_env_uniform_camera_matrix.camera_inv_proj * vec4f((vary.uv * 2.0 - 1.0), 1.0, 1.0);
        var normal_view =  vec3f(0.0, 0.0, 1.0);
        if !bool(world_env_uniform_params.orthogonal) {
            normal_view = -normalize(view.xyz);
        }
        var dir = normalize(mat3x3f(
            world_env_uniform_camera_matrix.camera_world[0].xyz,
            world_env_uniform_camera_matrix.camera_world[1].xyz,
            world_env_uniform_camera_matrix.camera_world[2].xyz,
        ) * normalize(view.xyz));
        var sky_color = textureSampleLevel(light_uniform_background_texture, light_uniform_sampler, dir, 0);
        out.color = sky_color;
        out.color = vec4f(0.175, 0.175, 0.175, 1.0);
        out.normal = vec4(normal_view, 1.0);

        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Solid],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Solid],
        [RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout],
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
        @location(0) uv: vec2f,
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
        let color = vec4f(clamp(vec3f(0.0), vec3f(1.0), accum_sample.rgb / clamp(accum_sample.a, 1e-5, 5e4)), 1.0 - reveal_sample);
        out.color = color;
        return out;
    }
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
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

const ResultDepthEmptyTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.D32F, WebGPURenderStateTextureDimension.D2, 1, 1).expect();
    return RenderServer.render_state.create_TextureView(texture).expect();
});

const ResultEmptyTextureView = new RefCacher(() => {
    const texture = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, 1, 1).expect();
    return RenderServer.render_state.create_TextureView(texture).expect();
});

const EffectFxaaPipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct WorldEnvUniformParams {
        screen_size: vec2f,
        time: f32,
        orthogonal: u32,
        pixel_ratio: f32,
    };

    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) frag_coord: vec2f,
        @location(1) rgb_NW: vec2f,
        @location(2) rgb_NE: vec2f,
        @location(3) rgb_SW: vec2f,
        @location(4) rgb_SE: vec2f,
        @location(5) rgb_M: vec2f,
        @location(6) uv: vec2f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;

    ${RenderServerSingleton.LightDataUniformsStructCode}

    ${RenderServerSingleton.LightUniformsGroupBindingCode}

    @vertex
    fn vs_main(attri: Attributes) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(attri.position - vec2f(1.0), 1.0, 1.0);
        out.uv = vec2f(attri.position.x, 2.0 - attri.position.y) / 2.0;
        out.frag_coord = out.uv * world_env_uniform_params.screen_size;
        var inv_vp = 1.0 / world_env_uniform_params.screen_size.xy;
        out.rgb_NW = (out.frag_coord + vec2f(-1.0, -1.0)) * inv_vp;
        out.rgb_NE = (out.frag_coord + vec2f(1.0, -1.0)) * inv_vp;
        out.rgb_SW = (out.frag_coord + vec2f(-1.0, 1.0)) * inv_vp;
        out.rgb_SE = (out.frag_coord + vec2f(1.0, 1.0)) * inv_vp;
        out.rgb_M = vec2f(out.frag_coord) * inv_vp;
        return out;
    }

    struct FragmentOutput {
        @location(0) color: vec4f,
    };

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var color: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        // let color = fxaa(color, sample, vary.frag_coord, world_env_uniform_params.screen_size, vary.rgb_NW, vary.rgb_NE, vary.rgb_SW, vary.rgb_SE, vary.rgb_M);
        let color = textureSample(color, sample, vary.uv);
        // let tone_mapped = vec4f(aces_tone_mapping(color.rgb, 0.85), color.a);
        out.color = color;
        return out;
    }

    fn fxaa(tex: texture_2d<f32>, sample: sampler, fragCoord: vec2f, resolution: vec2f, v_rgbNW: vec2f, v_rgbNE: vec2f, v_rgbSW: vec2f, v_rgbSE: vec2f, v_rgbM: vec2f) -> vec4f {
        
        // modified from godot https://github.com/godotengine/godot/blob/b1a50ad80538d57d917c3f399053e1a22d1aa749/drivers/gles3/shaders/tonemap.glsl
        
        const FXAA_REDUCE_MIN = (1.0 / 128.0);
	    const FXAA_REDUCE_MUL = (1.0 / 8.0);
	    const FXAA_SPAN_MAX = 8.0;
        
        var inverseVP = 1.0 / world_env_uniform_params.screen_size.xy;
        var rgbNW = textureSample(tex, sample, v_rgbNW);
        var rgbNE = textureSample(tex, sample, v_rgbNE);
        var rgbSW = textureSample(tex, sample, v_rgbSW);
        var rgbSE = textureSample(tex, sample, v_rgbSE);
        var rgbM  = textureSample(tex, sample, v_rgbM);

        var color = rgbM;

        var luma = vec3f(0.4126729,  0.7151522, 0.1721750); // vec3f(0.299, 0.587, 0.114);
        var lumaNW = dot(rgbNW.rgb, luma) - ((1 - rgbNW.a) / 8.0);
        var lumaNE = dot(rgbNE.rgb, luma) - ((1 - rgbNE.a) / 8.0);
        var lumaSW = dot(rgbSW.rgb, luma) - ((1 - rgbSW.a) / 8.0);
        var lumaSE = dot(rgbSE.rgb, luma) - ((1 - rgbSE.a) / 8.0);
        var lumaM  = dot( rgbM.rgb, luma) - (color.a / 8.0);
        var lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
        var lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
        
        var dir: vec2f;
        dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
        dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

        var dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                              (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
        
        var rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

        dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
                  max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
                  dir * rcpDirMin)) * inverseVP;

        var rgbA: vec4f = 0.5 * (textureSample(tex, sample, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)) + textureSample(tex, sample, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)));

	    var rgbB : vec4f= rgbA * 0.5 + 0.25 * (textureSample(tex, sample, fragCoord * inverseVP + dir * -0.5) + textureSample(tex, sample, fragCoord * inverseVP + dir * 0.5));

	    var lumaB = dot(rgbB.rgb, luma) - ((1 - rgbB.a) / 8.0);
	    var color_output = select(rgbA, rgbB, (lumaB < lumaMin) || (lumaB > lumaMax));
	    if color_output.a == 0.0 {
	    	return vec4f(0.0, 0.0, 0.0, color_output.a);
	    }
        return color_output;
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
    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Set],
        [RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout],
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

const EffectPreMultAlphaPipeline = new RefCacher(() => {

    const shader_code = `

    struct Attributes {
        @location(${RenderServerGeometryAttributeLocation.Position}) position: vec2f,
    };
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
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

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var color: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;
    
    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var color = textureSample(color, sample, vary.uv);
        out.color = vec4f(color.rgb * color.a, color.a);
        return out;
    }

    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
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

const EffectTemplatePipeline = new RefCacher(() => {

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
    
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
    
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) uv: vec2f,
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

    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var color: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var normal: texture_2d<f32>;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var depth: texture_depth_2d;
    @group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var sample: sampler;
    
    const SAMPLE_COUNT: i32 = 32;

    @fragment
    fn fs_main(vary: VertexOutput) -> FragmentOutput {
        var out: FragmentOutput;
        var depth = textureSample(depth, sample, vary.uv);
        var nor = textureSample(normal, sample, vary.uv).xyz;
        var projected = vec4f(vary.uv * 2.0 - 1.0, depth, 1.0);
        var rebuilt_pos = world_env_uniform_camera_matrix.camera_inv_proj * projected;
        var pos = rebuilt_pos.xyz / rebuilt_pos.w;

        var rcpSampleCount: f32 = 1.0 / f32(SAMPLE_COUNT);

        var i: i32;
        for (i = 0; i < SAMPLE_COUNT; i++) {
            var offset = PickSamplePoint(vary.uv, i, rcpSampleCount, nor);
            var vpos2 = pos + offset;
    
        }
    
        var color = textureSample(color, sample, vary.uv);
        out.color = color;
        return out;
    }

    fn Random(p: vec2f) -> f32 {
        return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
    }

    fn InterleavedGradientNoise(uv: vec2f, FrameId: i32) -> f32 {
        // magic values are found by experimentation
        var _uv = uv + f32(FrameId) * (vec2f(47, 17) * 0.695);
        var magic = vec3f( 0.06711056, 0.0058371, 52.9829189);
        return fract(magic.z * fract(dot(uv, magic.xy)));
    }

    const RADIUS: f32 = 2.0;

    fn PickSamplePoint(uv: vec2f, sampleIndex: i32, rcpSampleCount: f32, normal: vec3f) -> vec3f {
        var gn = InterleavedGradientNoise(uv * world_env_uniform_params.screen_size, sampleIndex);
        var u = fract(Random(vec2f(0.0, f32(sampleIndex))) + gn) * 2.0 - 1.0;
        var theta = Random(vec2f(1.0, f32(sampleIndex)) + gn) * 6.283185307;
        var u2 = sqrt(1.0 - u * u);
    
        // 全球上随机一点
        var v = vec3f(u2 * cos(theta), u2 * sin(theta), u);
        v *= sqrt(f32(sampleIndex) * rcpSampleCount); // 随着采样次数越向外采样
    
        // 半球上随机一点 逆半球法线翻转
        // https://thebookofshaders.com/glossary/?search=faceforward
        v = faceForward(v, -normal, v); // 确保v跟normal一个方向
    
        // 缩放到[0, RADIUS]
        v *= RADIUS;
    
        return v;
    }

    `;

    const shader = RenderServer.render_state.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
    const program = RenderServer.render_state.create_Program(shader, shader).expect();

    const pipeline = RenderServer.render_state.create_RenderPipeline(
        program,
        RenderServerRenderMaterial.ProgramStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
        RenderServerRenderMaterial.OutputStatePipelineTemplates[RenderServerRenderMaterialPass.Compose],
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

/**
 * Renderer used in each Viewport Node to render on viewport's RenderServerViewport
 */
export class RenderServerRenderer3D extends RenderServerObjectRefCounted {

    static readonly #tmp_frustum_0 = Frustum3.new;
    static readonly #tmp_vector_0 = Vector2.new;
    static readonly #tmp_matrix4_0: Matrix4 = Matrix4.new;
    static readonly #tmp_matrix3_0: Matrix3 = Matrix3.new;
    static readonly #tmp_instance_uniform_group_dynamic_offsets = [0];

    protected readonly queue_0: RenderServerRenderer3DQueue;
    protected readonly queue_1: RenderServerRenderer3DQueue;

    protected readonly compose_uniform_sampler_ref = new ReadonlyRef(ComposeUniformSmapler.get());

    protected readonly material_override_ref = new Ref<MaterialResource>(); // new LightClusterMaterial3DResource()

    //#region full screen triangle

    protected readonly full_screen_triangle_vertex_array_ref = new ReadonlyRef(FullScreenTriangleVertexArray.get());
    protected readonly full_screen_background_pipeline_ref = new ReadonlyRef(FullScreenBackgroundPipeline.get());

    //#endregion

    //#region queue instance uniform groups

    protected readonly queue_0_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_solid_instance_uniform_buffer_view_ref: ReadonlyRef<WebGPURenderStateBufferView>;
    protected readonly queue_1_solid_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_solid_instance_uniform_buffer_view_ref: ReadonlyRef<WebGPURenderStateBufferView>;

    protected readonly queue_0_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_0_transparent_instance_uniform_buffer_view_ref: ReadonlyRef<WebGPURenderStateBufferView>;
    protected readonly queue_1_transparent_instance_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.instance_uniform_layout).expect());
    protected readonly queue_1_transparent_instance_uniform_buffer_view_ref: ReadonlyRef<WebGPURenderStateBufferView>;

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
    protected readonly transparent_depth_normal_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    //#endregion

    //#region compose / oit compose

    protected readonly oit_compose_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(OitComposeUniformLayout.get()).expect());
    protected readonly oit_compose_pipeline_ref = new ReadonlyRef(OitComposePipeline.get());

    protected readonly compose_frame_buffer_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    //#endregion

    //#region result texture

    protected readonly result_color_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_normal_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_depth_texture_ref = new Ref<WebGPURenderStateTexture>();

    protected readonly result_color_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_normal_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_depth_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly result_color_render_queue_1_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_normal_render_queue_1_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_depth_render_queue_1_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly result_color_render_queue_1_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_normal_render_queue_1_texture_view_ref = new Ref<WebGPURenderStateTextureView>();
    protected readonly result_depth_render_queue_1_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly result_empty_texture_view_ref = new ReadonlyRef(ResultEmptyTextureView.get());
    protected readonly result_depth_empty_texture_view_ref = new ReadonlyRef(ResultDepthEmptyTextureView.get());

    //#endregion

    //#region effects

    protected readonly effect_texture_ref = new Ref<WebGPURenderStateTexture>();
    protected readonly effect_texture_view_ref = new Ref<WebGPURenderStateTextureView>();

    protected readonly effect_frame_buffer_0_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));
    protected readonly effect_frame_buffer_1_ref = new ReadonlyRef(new WebGPURenderElementFrameBuffer(RenderServer.render_state));

    protected readonly effect_fxaa_pipeline_ref = new ReadonlyRef(EffectFxaaPipeline.get());

    //#endregion

    //#region World Env Uniform

    protected readonly world_env_queue_0_uniform_solid_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    protected readonly world_env_queue_0_uniform_transparent_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    protected readonly world_env_queue_1_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    protected readonly world_env_effect_uniform_group_0_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());
    protected readonly world_env_effect_uniform_group_1_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.world_env_uniform_layout).expect());

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
    protected readonly world_env_uniform_z_range = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[1].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_time = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[2].size / Float32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_camera_is_orthogonal = new Uint32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[3].size / Uint32Array.BYTES_PER_ELEMENT);
    protected readonly world_env_uniform_pixel_ratio: Float32Array = new Float32Array(this.world_env_uniform_params_array_buffer, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[4].offset, RenderServerSingleton.WorldEnvUniformParamsMemoryLayout.members[4].size / Float32Array.BYTES_PER_ELEMENT);

    //#endregion

    //#region Lights Uniform

    protected readonly lights_uniform_group_ref = new ReadonlyRef(RenderServer.render_state.create_UniformGroup(RenderServer.lights_uniform_layout).expect());
    protected readonly lights_background_texture_view_ref = new ReadonlyRef(RenderServer.render_state.create_TextureView(RenderServer.get_DefaultTexture(RenderServerDefaultTextureType.CubeBlack).texture_ref.expect, WebGPURenderStateTextureDimension.CubeMap).expect());
    protected readonly lights_cluster_data_ref = new ReadonlyRef(new RenderServerLightClusterData());

    //#endregion

    constructor(queue_0_solid_capcity?: number, queue_0_transparent_capcity?: number, queue_1_solid_capcity?: number, queue_1_transparent_capcity?: number) {
        super();

        this.queue_0 = new RenderServerRenderer3DQueue(queue_0_solid_capcity, queue_0_transparent_capcity);
        this.queue_1 = new RenderServerRenderer3DQueue(queue_1_solid_capcity, queue_1_transparent_capcity);

        this.queue_0_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
        this.queue_1_solid_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.solid_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
        this.queue_0_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_0.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());
        this.queue_1_transparent_instance_uniform_buffer_view_ref = new ReadonlyRef(RenderServer.render_state.create_BufferView(this.queue_1.transparent_instance_uniform_buffer, 0, RenderServerSingleton.InstanceUniformMemoryLayout.size).expect());

        this.queue_0_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_1_solid_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_solid_instance_uniform_buffer_view_ref.expect);
        this.queue_0_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_0_transparent_instance_uniform_buffer_view_ref.expect);
        this.queue_1_transparent_instance_uniform_group_ref.expect.set_BufferUniform(0, this.queue_1_transparent_instance_uniform_buffer_view_ref.expect);

        this.oit_compose_uniform_group_ref.expect.set_Sampler(2, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_0_uniform_solid_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Texture(3, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Texture(4, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_solid_group_ref.expect.set_Sampler(5, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(3, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(4, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Sampler(5, this.compose_uniform_sampler_ref.expect);

        this.world_env_queue_1_uniform_group_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Texture(3, this.result_empty_texture_view_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Texture(4, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_queue_1_uniform_group_ref.expect.set_Sampler(5, this.compose_uniform_sampler_ref.expect);

        this.world_env_effect_uniform_group_0_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_effect_uniform_group_0_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_effect_uniform_group_0_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_0_ref.expect.set_Texture(3, this.result_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_0_ref.expect.set_Texture(4, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_0_ref.expect.set_Sampler(5, this.compose_uniform_sampler_ref.expect);

        this.world_env_effect_uniform_group_1_ref.expect.set_BufferUniform(0, this.world_env_uniform_camera_matrix_buffer_ref.expect);
        this.world_env_effect_uniform_group_1_ref.expect.set_BufferUniform(1, this.world_env_uniform_params_buffer_ref.expect);
        this.world_env_effect_uniform_group_1_ref.expect.set_Texture(2, this.result_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_1_ref.expect.set_Texture(3, this.result_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_1_ref.expect.set_Texture(4, this.result_depth_empty_texture_view_ref.expect);
        this.world_env_effect_uniform_group_1_ref.expect.set_Sampler(5, this.compose_uniform_sampler_ref.expect);

        this.lights_uniform_group_ref.expect.set_Texture(2, this.lights_background_texture_view_ref.expect);
        this.lights_uniform_group_ref.expect.set_Sampler(3, RenderServer.get_TextureSampler(WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureWrap.Clamp, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear));
        this.lights_uniform_group_ref.expect.set_Storage(4, this.lights_cluster_data_ref.expect.cluster_buffer);
        this.lights_uniform_group_ref.expect.set_BufferUniform(5, this.lights_cluster_data_ref.expect.uniform_buffer);
    }

    public set_WorldEnvUniform(camera_world: Matrix4, camera_projection: Matrix4, camera_is_orthogonal: boolean, z_near: number, z_far: number, time: number, pixel_ratio: number, screen_width: number, screen_height: number) {
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
            // transpose by assign code
            this.world_env_uniform_camera_normal_view[0] = matrix.n11;
            this.world_env_uniform_camera_normal_view[1] = matrix.n12;
            this.world_env_uniform_camera_normal_view[2] = matrix.n13;
            // this.world_env_uniform_camera_normal_view[3] = 0;
            this.world_env_uniform_camera_normal_view[4] = matrix.n21;
            this.world_env_uniform_camera_normal_view[5] = matrix.n22;
            this.world_env_uniform_camera_normal_view[6] = matrix.n23;
            // this.world_env_uniform_camera_normal_view[7] = 0;
            this.world_env_uniform_camera_normal_view[8] = matrix.n31;
            this.world_env_uniform_camera_normal_view[9] = matrix.n32;
            this.world_env_uniform_camera_normal_view[10] = matrix.n33;
            // this.world_env_uniform_camera_normal_view[11] = 0;
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
        // z range
        {
            this.world_env_uniform_z_range[0] = z_near;
            this.world_env_uniform_z_range[1] = z_far;
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
            this.solid_normal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.solid_normal_texture_ref.expect).expect();

            this.transparent_accum_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.transparent_reveal_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment, WebGPURenderStateTextureFormat.R16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.transparent_accum_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.transparent_accum_texture_ref.expect).expect();
            this.transparent_reveal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.transparent_reveal_texture_ref.expect).expect();

            this.oit_compose_uniform_group_ref.expect.set_Texture(0, this.transparent_accum_texture_view_ref.expect);
            this.oit_compose_uniform_group_ref.expect.set_Texture(1, this.transparent_reveal_texture_view_ref.expect);

            this.result_color_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_normal_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_depth_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.D32F, WebGPURenderStateTextureDimension.D2, width, height).expect();

            this.result_color_render_queue_1_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_normal_render_queue_1_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.result_depth_render_queue_1_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.D32F, WebGPURenderStateTextureDimension.D2, width, height).expect();

            this.result_color_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_color_texture_ref.expect).expect();
            this.result_normal_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_normal_texture_ref.expect).expect();
            this.result_depth_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_depth_texture_ref.expect).expect();

            this.result_color_render_queue_1_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_color_render_queue_1_texture_ref.expect).expect();
            this.result_normal_render_queue_1_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_normal_render_queue_1_texture_ref.expect).expect();
            this.result_depth_render_queue_1_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.result_depth_render_queue_1_texture_ref.expect).expect();

            this.effect_texture_ref.value = RenderServer.render_state.create_Texture(WebGPURenderStateTextureUsage.Attchment | WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopySrc, WebGPURenderStateTextureFormat.RGBA16F, WebGPURenderStateTextureDimension.D2, width, height).expect();
            this.effect_texture_view_ref.value = RenderServer.render_state.create_TextureView(this.effect_texture_ref.expect).expect();

            this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(2, this.result_color_texture_view_ref.expect);
            this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(3, this.result_normal_texture_view_ref.expect);
            this.world_env_queue_0_uniform_transparent_group_ref.expect.set_Texture(4, this.result_depth_texture_view_ref.expect);

            this.world_env_queue_1_uniform_group_ref.expect.set_Texture(2, this.result_color_render_queue_1_texture_view_ref.expect);
            this.world_env_queue_1_uniform_group_ref.expect.set_Texture(3, this.result_normal_render_queue_1_texture_view_ref.expect);
            this.world_env_queue_1_uniform_group_ref.expect.set_Texture(4, this.result_depth_render_queue_1_texture_view_ref.expect);

            this.world_env_effect_uniform_group_0_ref.expect.set_Texture(2, this.result_color_texture_view_ref.expect);
            this.world_env_effect_uniform_group_0_ref.expect.set_Texture(3, this.result_normal_texture_view_ref.expect);
            this.world_env_effect_uniform_group_0_ref.expect.set_Texture(4, this.result_depth_render_queue_1_texture_view_ref.expect);

            this.world_env_effect_uniform_group_1_ref.expect.set_Texture(2, this.effect_texture_view_ref.expect);
            this.world_env_effect_uniform_group_1_ref.expect.set_Texture(3, this.result_normal_texture_view_ref.expect);
            this.world_env_effect_uniform_group_1_ref.expect.set_Texture(4, this.result_depth_render_queue_1_texture_view_ref.expect);

            return true;
        }
        return false;
    }

    public reset_FrameBuffer() {
        this.solid_frame_buffer_ref.expect.clear_Attachments();
        this.solid_frame_buffer_ref.expect.clear_DepthStencilAttachment();
        this.solid_frame_buffer_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, true, Vector4.create(0, 0, 0, 0), true);
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

        this.transparent_depth_normal_frame_buffer_ref.expect.clear_Attachments();
        this.transparent_depth_normal_frame_buffer_ref.expect.clear_DepthStencilAttachment();
        this.transparent_depth_normal_frame_buffer_ref.expect.add_Attachment(this.result_normal_texture_view_ref.expect, false, Vector4.create(1, 1, 1, 0), true);
        this.transparent_depth_normal_frame_buffer_ref.expect.set_DepthStencilAttachment(this.result_depth_texture_view_ref.expect, false, 1, true, false);

        this.compose_frame_buffer_ref.expect.clear_Attachments();
        this.compose_frame_buffer_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, false, Vector4.create(0, 0, 0, 0), true);

        this.effect_frame_buffer_0_ref.expect.clear_Attachments();
        this.effect_frame_buffer_0_ref.expect.add_Attachment(this.effect_texture_view_ref.expect, true, Vector4.create(0, 0, 0, 0), true);

        this.effect_frame_buffer_1_ref.expect.clear_Attachments();
        this.effect_frame_buffer_1_ref.expect.add_Attachment(this.result_color_texture_view_ref.expect, true, Vector4.create(0, 0, 0, 0), true);
    }

    private last_viewport_id: number = -1;
    private last_world_id: number = -1;
    private last_background_id: number = -1;

    public render(world: World3D, camera: Camera3, viewport: RenderServerViewport, time: number, once: boolean) {

        //#region constants

        const camera_world = camera.global_transform;
        const camera_projection = camera.projection;
        const camera_is_orthogonal = camera.is_orthogonal;
        const camera_frustum = camera.get_Frustum(RenderServerRenderer3D.#tmp_frustum_0);

        //#endregion

        //#region Resize Reset FrameBuffer

        const { x: texture_width, y: texture_height } = viewport.get_Size(RenderServerRenderer3D.#tmp_vector_0);
        if (this.resize(texture_width, texture_height) || viewport.id !== this.last_viewport_id) {
            this.reset_FrameBuffer();
        }
        const background_id = world.visual_world.background_texture?.id ?? 0;
        if (world.rid !== this.last_world_id) {
            this.lights_uniform_group_ref.expect.set_Storage(0, world.visual_world.render_server_light_data.light_data_buffer);
            this.lights_uniform_group_ref.expect.set_BufferUniform(1, world.visual_world.render_server_light_data.light_count_buffer);
        }
        if (background_id !== this.last_background_id) {
            this.lights_uniform_group_ref.expect.set_Texture(2, world.visual_world.background_texture?.texture_view_ref.expect ?? this.lights_background_texture_view_ref.expect);
        }
        this.last_viewport_id = viewport.id;
        this.last_world_id = world.rid;
        this.last_background_id = background_id;

        //#endregion

        //#region setup global uniforms

        this.set_WorldEnvUniform(camera_world, camera_projection, camera_is_orthogonal, camera.near, camera.far, time, viewport.pixel_ratio, texture_width, texture_height);

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
        // Lights
        this.lights_cluster_data_ref.expect.compute(encoder, camera, world.visual_world.render_server_light_data, this.world_env_queue_0_uniform_solid_group_ref.expect);
        // Meshs
        this.render_Queue0Solid(encoder, viewport.background);
        this.render_Queue0Transparent(encoder);
        const effect_queue_0_first_texture = (this.render_Queue0Effects(encoder) % 2) === 0;
        if (!effect_queue_0_first_texture) {
            encoder.copyTextureToTexture({ texture: this.effect_texture_ref.expect.texture }, { texture: this.result_color_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        }
        this.render_Queue0TransparentDepthNormal(encoder);
        encoder.copyTextureToTexture({ texture: this.result_color_texture_ref.expect.texture }, { texture: this.result_color_render_queue_1_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        encoder.copyTextureToTexture({ texture: this.result_normal_texture_ref.expect.texture }, { texture: this.result_normal_render_queue_1_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        encoder.copyTextureToTexture({ texture: this.result_depth_texture_ref.expect.texture }, { texture: this.result_depth_render_queue_1_texture_ref.expect.texture }, { width: texture_width, height: texture_height });
        this.render_Queue1Solid(encoder);
        this.render_Queue1Transparent(encoder);
        const effect_queue_1_first_texture = (this.render_Queue1Effects(encoder) % 2) === 0;
        encoder.copyTextureToTexture({ texture: effect_queue_1_first_texture ? this.result_color_texture_ref.expect.texture : this.effect_texture_ref.expect.texture }, { texture: viewport.canvas_texture_view.texture }, { width: texture_width, height: texture_height });

        // encoder.copyBufferToBuffer(
        //     this.lights_cluster_data_ref.expect.cluster_buffer.buffer,
        //     0,
        //     this.lights_cluster_data_ref.expect.cluster_buffer_copy.buffer,
        //     0,
        //     this.lights_cluster_data_ref.expect.cluster_buffer.length
        // );

        RenderServer.render_state.device.queue.submit([encoder.finish()]);

        // this.lights_cluster_data_ref.expect.cluster_buffer_copy.buffer.mapAsync(GPUMapMode.READ).then(() => {
        //     const a = new Uint32Array(this.lights_cluster_data_ref.expect.cluster_buffer_copy.buffer.getMappedRange());
        //     for (let z = 0; z < 32; z++) {
        //         for (let y = 0; y < 32; y++) {
        //             for (let x = 0; x < 32; x++) {
        //                 const cluster = z * (32 * 32) + y * 32 + x;
        //                 const index = cluster * 64;
        //                 const array = a.slice(index, index + 64);
        //                 console.groupCollapsed(`${x}, ${y}, ${z}`);
        //                 console.log(array.toString());
        //                 console.groupEnd();
        //             }
        //         }
        //     }
        //     this.lights_cluster_data_ref.expect.cluster_buffer_copy.buffer.unmap();
        // });
        // throw new Error(">>>>>");
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

        // console.log(`obj: ${this.queue_0.solid_pointer + this.queue_0.transparent_pointer + 2}`);
    }

    public compute_Data(compute_pass: GPUComputePassEncoder, material: RenderServerComputeMaterial) {
        let mat: RenderServerComputeMaterial | undefined = material;
        while (mat !== undefined) {
            mat.update_UniformBuffers();
            const pipeline_uniform = mat.get_PipelineUniform();
            if (pipeline_uniform !== undefined) {
                const { pipeline, uniform } = pipeline_uniform;
                if (uniform !== undefined) {
                    compute_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
                }
                compute_pass.setPipeline(pipeline.pipeline);
                mat.dispatch(compute_pass);
            }
            mat = mat.next_pass;
        }
    }

    protected render_Mesh(render_pass: GPURenderPassEncoder, index: number, pass: RenderServerRenderMaterialPass, frame_buffer: WebGPURenderElementFrameBuffer, depth_func: WebGPURenderStateDepthCompareFunc, vertex_array: RenderServerRenderer3DQueueVeretxArray, material: RenderServerRenderMaterial, instance_uniform_group: WebGPURenderStateUniformGroup, instance_count: number) {
        let mat: RenderServerRenderMaterial | undefined = this.material_override_ref.value?.render_server_material ?? material;
        const dynamic_offsets = RenderServerRenderer3D.#tmp_instance_uniform_group_dynamic_offsets;
        while (mat !== undefined) {
            mat.update_UniformBuffers();
            const pipeline_uniform = mat.get_PipelineUniform(pass, vertex_array, frame_buffer, depth_func);
            if (pipeline_uniform !== undefined) {
                const { pipeline, uniform } = pipeline_uniform;
                if (uniform !== undefined) {
                    render_pass.setBindGroup(RenderServerSingleton.UniformBindGroupIndex, uniform.binding_group);
                }
                dynamic_offsets[0] = index * RenderServerSingleton.InstanceUniformMemoryLayout.size;
                render_pass.setBindGroup(RenderServerSingleton.InstanceUniformBindGroupIndex, instance_uniform_group.binding_group, dynamic_offsets);
                render_pass.setPipeline(pipeline.pipeline);
                vertex_array.bind_Buffers(render_pass);
                vertex_array.draw(render_pass, instance_count);
            }
            mat = mat.next_pass;
        }
    }

    //#region queue 0

    protected render_Queue0Solid(encoder: GPUCommandEncoder, background: boolean) {

        const render_pass = encoder.beginRenderPass(this.solid_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_0_uniform_solid_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        for (let i = 0; i <= this.queue_0.solid_pointer; i++) {
            const vertex_array = this.queue_0.solid_vertex_array[i]!;
            const material = this.queue_0.solid_material[i]!;
            const instance_count = this.queue_0.get_InstanceCount(false, i);
            this.render_Mesh(render_pass, i, RenderServerRenderMaterialPass.Solid, this.solid_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual, vertex_array, material, this.queue_0_solid_instance_uniform_group_ref.expect, instance_count);
        }

        if (background) {
            render_pass.setPipeline(this.full_screen_background_pipeline_ref.expect.pipeline);
            this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(render_pass);
            this.full_screen_triangle_vertex_array_ref.expect.draw(render_pass);
        }

        render_pass.end();
    }

    protected render_Queue0Transparent(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.transparent_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_0_uniform_transparent_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        for (let i = 0; i <= this.queue_0.transparent_pointer; i++) {
            const vertex_array = this.queue_0.transparent_vertex_array[i]!;
            const material = this.queue_0.transparent_material[i]!;
            const instance_count = this.queue_0.get_InstanceCount(true, i);
            this.render_Mesh(render_pass, i, RenderServerRenderMaterialPass.Transparent, this.transparent_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual, vertex_array, material, this.queue_0_transparent_instance_uniform_group_ref.expect, instance_count);
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

    protected render_Queue0TransparentDepthNormal(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.transparent_depth_normal_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_0_uniform_solid_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        for (let i = 0; i <= this.queue_0.transparent_pointer; i++) {
            const vertex_array = this.queue_0.transparent_vertex_array[i]!;
            const material = this.queue_0.transparent_material[i]!;
            const instance_count = this.queue_0.get_InstanceCount(true, i);
            this.render_Mesh(render_pass, i, RenderServerRenderMaterialPass.Depth, this.transparent_depth_normal_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual, vertex_array, material, this.queue_0_transparent_instance_uniform_group_ref.expect, instance_count);
        }

        render_pass.end();
    }

    protected render_Queue0Effects(encoder: GPUCommandEncoder): number {
        let pass = 0;

        // see render_Queue1Effects for examples

        // const effect_pass_0 = encoder.beginRenderPass(this.effect_frame_buffer_0_ref.expect.frame_buffer_desc);
        // effect_pass_0.setPipeline(EffectTemplatePipeline.get().pipeline);
        // effect_pass_0.setBindGroup(0, this.world_env_effect_uniform_group_0_ref.expect.binding_group);
        // this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(effect_pass_0);
        // this.full_screen_triangle_vertex_array_ref.expect.draw(effect_pass_0);
        // effect_pass_0.end();

        // pass++;

        return pass;
    }

    //#endregion

    //#region queue 1

    protected render_Queue1Solid(encoder: GPUCommandEncoder) {

        const render_pass = encoder.beginRenderPass(this.solid_frame_buffer_1_ref.expect.frame_buffer_desc);
        if (this.queue_1.solid_pointer >= 0) {
            render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_1_uniform_group_ref.expect.binding_group);
            render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
            for (let i = 0; i <= this.queue_1.solid_pointer; i++) {
                const vertex_array = this.queue_1.solid_vertex_array[i]!;
                const material = this.queue_1.solid_material[i]!;
                const instance_count = this.queue_1.get_InstanceCount(false, i);
                this.render_Mesh(render_pass, i, RenderServerRenderMaterialPass.Solid, this.solid_frame_buffer_1_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual, vertex_array, material, this.queue_1_solid_instance_uniform_group_ref.expect, instance_count);
            }
        }

        render_pass.end();
    }

    protected render_Queue1Transparent(encoder: GPUCommandEncoder) {

        if (this.queue_1.transparent_pointer < 0) return;

        const render_pass = encoder.beginRenderPass(this.transparent_frame_buffer_ref.expect.frame_buffer_desc);
        render_pass.setBindGroup(RenderServerSingleton.WorldEnvUniformBindGroupIndex, this.world_env_queue_1_uniform_group_ref.expect.binding_group);
        render_pass.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        for (let i = 0; i <= this.queue_1.transparent_pointer; i++) {
            const vertex_array = this.queue_1.transparent_vertex_array[i]!;
            const material = this.queue_1.transparent_material[i]!;
            const instance_count = this.queue_1.get_InstanceCount(true, i);
            this.render_Mesh(render_pass, i, RenderServerRenderMaterialPass.Transparent, this.transparent_frame_buffer_ref.expect, WebGPURenderStateDepthCompareFunc.LessEqual, vertex_array, material, this.queue_1_transparent_instance_uniform_group_ref.expect, instance_count);
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

    protected render_Queue1Effects(encoder: GPUCommandEncoder): number {
        let pass = 0;

        const effect_pass_0 = encoder.beginRenderPass(this.effect_frame_buffer_0_ref.expect.frame_buffer_desc);
        effect_pass_0.setPipeline(this.effect_fxaa_pipeline_ref.expect.pipeline);
        effect_pass_0.setBindGroup(0, this.world_env_effect_uniform_group_0_ref.expect.binding_group);
        effect_pass_0.setBindGroup(RenderServerSingleton.LightsUniformBindGroupIndex, this.lights_uniform_group_ref.expect.binding_group);
        this.full_screen_triangle_vertex_array_ref.expect.bind_Buffers(effect_pass_0);
        this.full_screen_triangle_vertex_array_ref.expect.draw(effect_pass_0);
        effect_pass_0.end();

        pass++;

        return pass;
    }

    //#endregion

    public dispose(): void {
        this.material_override_ref.clear();

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
        this.transparent_depth_normal_frame_buffer_ref.clear();

        this.compose_uniform_sampler_ref.clear();

        this.oit_compose_uniform_group_ref.clear();
        this.oit_compose_pipeline_ref.clear();

        this.compose_frame_buffer_ref.clear();

        this.result_color_texture_ref.clear();
        this.result_normal_texture_ref.clear();
        this.result_depth_render_queue_1_texture_ref.clear();
        this.result_color_render_queue_1_texture_ref.clear();

        this.result_color_texture_view_ref.clear();
        this.result_normal_render_queue_1_texture_ref.clear();
        this.result_normal_texture_view_ref.clear();
        this.result_depth_render_queue_1_texture_view_ref.clear();
        this.result_normal_render_queue_1_texture_view_ref.clear();
        this.result_color_render_queue_1_texture_view_ref.clear();

        this.result_empty_texture_view_ref.clear();
        this.result_depth_empty_texture_view_ref.clear();

        this.effect_texture_ref.clear();
        this.effect_texture_view_ref.clear();
        this.effect_frame_buffer_0_ref.clear();
        this.effect_frame_buffer_1_ref.clear();

        this.effect_fxaa_pipeline_ref.clear();

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
        this.world_env_effect_uniform_group_0_ref.clear();
        this.world_env_effect_uniform_group_1_ref.clear();

        this.lights_uniform_group_ref.clear();
        this.lights_background_texture_view_ref.clear();
        this.lights_cluster_data_ref.clear();
    }
}