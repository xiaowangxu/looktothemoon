import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderElementTextureSamplerCache, WebGPURenderElementTextureSamplerCacheHash } from "@/system/sliverofstraw/render_element_object/texture_sampler/WebGPURenderElementTextureSamplerCache";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, WebGPURenderStatePrimitiveType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTextureDimension, WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import type { WebGPURenderStateTextureWrap, WebGPURenderStateTextureFilter } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType, WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { ReadonlyRef, Ref, RefMap } from "@/system/utils/RefCounted";
import type { Disposable } from "@/system/utils/Type";
import { RenderServerTexture } from "./texture/RenderServerTexture";
import type { WebGPURenderStateRenderPipeline } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import { WebGPURenderStateAttributeType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { RenderServerMaterial, RenderServerMaterialPass } from "./material/RenderServerMaterial";
import { WebGPURenderStateMultiSampleCount } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateMultiSampleTexture";

export enum RenderServerDefaultTextureType {
    Hint, White, Black, Transparent,
}

export class RenderServerSingleton implements Disposable {

    public render_state = new WebGPURenderState();

    public readonly inited: Promise<boolean>;

    static readonly WorldEnvUniformBindGroupIndex = 0;
    static readonly LightsUniformBindGroupIndex = 1;
    static readonly InstanceUniformBindGroupIndex = 2;
    static readonly UniformBindGroupIndex = 3;

    //#region world env uniform

    protected readonly world_env_uniform_layout_ref: Ref<WebGPURenderStateUniformLayout> = new Ref();
    public get world_env_uniform_layout() { return this.world_env_uniform_layout_ref.expect; }

    static readonly WorldEnvUniformCameraMatrixMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            // cam_world  
            WebGPURenderStateBufferUniformType.Matrix4,
            // cam_view  
            WebGPURenderStateBufferUniformType.Matrix4,
            // cam_proj  
            WebGPURenderStateBufferUniformType.Matrix4,
            // cam_inv_proj    
            WebGPURenderStateBufferUniformType.Matrix4,
            // cam_norview 
            WebGPURenderStateBufferUniformType.Matrix3,
        ] as const,
    });

    static readonly WorldEnvUniformParamsMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            // screen_size
            WebGPURenderStateBufferUniformType.Vector2,
            // time
            WebGPURenderStateBufferUniformType.Float,
            // orthogonal 
            WebGPURenderStateBufferUniformType.Bool,
            // pixel_ratio  
            WebGPURenderStateBufferUniformType.Float,
        ] as const,
    });

    //#endregion

    //#region lights uniform

    protected readonly lights_uniform_layout_ref: Ref<WebGPURenderStateUniformLayout> = new Ref();
    public get lights_uniform_layout() { return this.lights_uniform_layout_ref.expect; }

    //#endregion

    //#region instance uniform

    protected readonly instance_uniform_layout_ref: Ref<WebGPURenderStateUniformLayout> = new Ref();
    public get instance_uniform_layout() { return this.instance_uniform_layout_ref.expect; }

    static readonly InstanceUniformMemoryLayout = WebGPURenderState.RenderStateMemoryLayout({
        type: 'struct',
        members: [
            // transform
            WebGPURenderStateBufferUniformType.Matrix4,
            // normal
            WebGPURenderStateBufferUniformType.Matrix3,
            // layer
            WebGPURenderStateBufferUniformType.Uint,
            // instance count
            WebGPURenderStateBufferUniformType.Uint,
            // perserved
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
            WebGPURenderStateBufferUniformType.Uint,
        ] as const,
    });

    //#endregion

    //#region code

    static readonly WorldUniformsStructCode = `struct WorldEnvUniformCameraMatrix {
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
}`;

    static readonly InstanceUniformsStructCode = `struct InstanceUniform {
    transform: mat4x4f,
    normal: mat3x3f,
    layer: u32,
}`;

    static readonly LightDataUniformsStructCode = `struct LightDataUniform {
    position: vec3f,
    normal_attenuation: vec4f,
    color: vec3f,
    layer: u32,
    mask: u32,
    visible: u32,
    shadow_0: u32,
    shadow_1: u32,
    shadow_2: u32,
    shadow_3: u32,
    shadow_4: u32,
    shadow_5: u32,
    params: vec4f,
}`;

    static readonly WorldUniformsGroupBindingCode = `@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(0) var<uniform> world_env_uniform_camera_matrix: WorldEnvUniformCameraMatrix; 
@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(1) var<uniform> world_env_uniform_params: WorldEnvUniformParams;
@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(2) var world_env_uniform_color_texture: texture_2d<f32>;
@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(3) var world_env_uniform_normal_texture: texture_2d<f32>;
@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(4) var world_env_uniform_depth_texture: texture_depth_2d;
@group(${RenderServerSingleton.WorldEnvUniformBindGroupIndex}) @binding(5) var world_env_uniform_sampler: sampler;`

    static readonly InstanceUniformsGroupBindingCode = `@group(${RenderServerSingleton.InstanceUniformBindGroupIndex}) @binding(0) var<uniform> instance_uniform: InstanceUniform;`;

    static readonly LightUniformsGroupBindingCode = `@group(${RenderServerSingleton.LightsUniformBindGroupIndex}) @binding(0) var<storage, read> light_data_uniform: array<LightDataUniform>;`;

    //#endregion

    //#region texture sampler cache

    private readonly texture_sampler_cache_ref = new ReadonlyRef(new WebGPURenderElementTextureSamplerCache(this.render_state));

    //#endregion

    //#region default texture

    private default_texture_hint_ref!: ReadonlyRef<RenderServerTexture>;
    private default_texture_white_ref!: ReadonlyRef<RenderServerTexture>;
    private default_texture_black_ref!: ReadonlyRef<RenderServerTexture>;
    private default_texture_transparent_ref!: ReadonlyRef<RenderServerTexture>;

    //#endregion

    constructor() {
        this.inited = this.render_state.init();
        this.inited.then(this.init.bind(this));
    }

    private init() {
        //#region world env uniform
        this.world_env_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        // camera matrix
        this.world_env_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0);
        // params
        this.world_env_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
        // result texture
        this.world_env_uniform_layout_ref.expect.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.NonFilterFloat, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 2);
        this.world_env_uniform_layout_ref.expect.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.NonFilterFloat, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 3);
        this.world_env_uniform_layout_ref.expect.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Depth, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 4);
        this.world_env_uniform_layout_ref.expect.add_Sampler(WebGPURenderStateSamplerUniformType.NonFilter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 5);
        //#endregion

        //#region lights uniform
        this.lights_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        this.lights_uniform_layout_ref.expect.add_Storage(true, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, false);
        //#endregion

        //#region instance uniform
        this.instance_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        // transform / layer / preserved
        this.instance_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, true);
        //#endregion

        //#region texture
        this.default_texture_hint_ref = new ReadonlyRef(RenderServerTexture.create(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA8, WebGPURenderStateTextureDimension.D2, 2, 2, 1));
        this.default_texture_hint_ref.expect.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            new Uint8Array([
                255, 0, 255, 255,
                0, 255, 255, 255,
                0, 255, 255, 255,
                255, 0, 255, 255,
            ]), 2, 2,
        );
        this.default_texture_white_ref = new ReadonlyRef(RenderServerTexture.create(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA8, WebGPURenderStateTextureDimension.D2, 1, 1, 1));
        this.default_texture_white_ref.expect.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            new Uint8Array([
                255, 255, 255, 255,
            ]), 1, 1,
        );
        this.default_texture_black_ref = new ReadonlyRef(RenderServerTexture.create(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA8, WebGPURenderStateTextureDimension.D2, 1, 1, 1));
        this.default_texture_black_ref.expect.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            new Uint8Array([
                0, 0, 0, 255,
            ]), 1, 1,
        );
        this.default_texture_transparent_ref = new ReadonlyRef(RenderServerTexture.create(WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst, WebGPURenderStateTextureFormat.RGBA8, WebGPURenderStateTextureDimension.D2, 1, 1, 1));
        this.default_texture_transparent_ref.expect.update_Data(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            new Uint8Array([
                255, 255, 255, 0,
            ]), 1, 1,
        );
        //#endregion
    }

    public get_TextureSampler(
        wrap_u?: WebGPURenderStateTextureWrap, wrap_v?: WebGPURenderStateTextureWrap, wrap_w?: WebGPURenderStateTextureWrap,
        min_filter?: WebGPURenderStateTextureFilter, mag_filter?: WebGPURenderStateTextureFilter, mipmap_filter?: WebGPURenderStateTextureFilter,
        compare?: WebGPURenderStateDepthCompareFunc,
        min_lod?: number, max_lod?: number, anisotropy?: number,
    ) {
        return this.texture_sampler_cache_ref.expect.get(wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare, min_lod, max_lod, anisotropy);
    }

    public get_TextureSamplerByHash(hash: WebGPURenderElementTextureSamplerCacheHash) {
        return this.texture_sampler_cache_ref.expect.get_ByHash(hash);
    }

    public get_DefaultTexture(type: RenderServerDefaultTextureType) {
        switch (type) {
            case RenderServerDefaultTextureType.Hint: return this.default_texture_hint_ref.expect;
            case RenderServerDefaultTextureType.White: return this.default_texture_white_ref.expect;
            case RenderServerDefaultTextureType.Black: return this.default_texture_black_ref.expect;
            case RenderServerDefaultTextureType.Transparent: return this.default_texture_transparent_ref.expect;
            default: {
                const n: never = type;
                throw new Error('should not reach');
            }
        }
    }

    public dispose() {
        this.world_env_uniform_layout_ref.clear();
        this.lights_uniform_layout_ref.clear();
        this.instance_uniform_layout_ref.clear();
        this.texture_sampler_cache_ref.clear();
        this.default_texture_hint_ref.clear();
        this.default_texture_white_ref.clear();
        this.default_texture_black_ref.clear();
        this.default_texture_transparent_ref.clear();
        this.render_state.dispose();
    }
}

export const RenderServer = new RenderServerSingleton();