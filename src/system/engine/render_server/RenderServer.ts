import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";
import { WebGPURenderStateShaderType } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import { Ref } from "@/system/utils/RefCounted";

export class RenderServerSingleton {

    public render_state = new WebGPURenderState();

    public readonly inited: Promise<boolean>;

    //#region world env uniform

    public readonly world_env_uniform_layout_ref: Ref<WebGPURenderStateUniformLayout> = new Ref();
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

    constructor() {
        this.inited = this.render_state.init();
        this.inited.then(this.init.bind(this));
        console.log(RenderServerSingleton.WorldEnvUniformCameraMatrixMemoryLayout);
    }

    private init() {
        this.world_env_uniform_layout_ref.value = this.render_state.create_UniformLayout();
        // camera matrix
        this.world_env_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 0);
        // params
        this.world_env_uniform_layout_ref.expect.add_BufferUniform(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, 1);
    }

    public dispose() {
        this.world_env_uniform_layout_ref.clear();
    }
}

export const RenderServer = new RenderServerSingleton();