import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType, WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { Ref } from "@/system/utils/RefCounted";
import type { Disposable } from "@/system/utils/Type";

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
            // layer
            WebGPURenderStateBufferUniformType.Uint,
            // preserved
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
        this.world_env_uniform_layout_ref.expect.add_Sampler(WebGPURenderStateSamplerUniformType.NonFilter, WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 4);
        //#endregion

        //#region lights uniform
        this.lights_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        //#endregion

        //#region instance uniform
        this.instance_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        // transform / layer / preserved
        this.instance_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0, true);
        //#endregion
    }

    public dispose() {
        this.world_env_uniform_layout_ref.clear();
        this.lights_uniform_layout_ref.clear();
        this.instance_uniform_layout_ref.clear();
    }
}

export const RenderServer = new RenderServerSingleton();