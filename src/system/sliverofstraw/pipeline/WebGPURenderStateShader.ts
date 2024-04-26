import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export enum WebGPURenderStateShaderType {
    Vertex = 0x01,
    Fragment = 0x02,
    Compute = 0x04,
}

export class WebGPURenderStateShader extends WebGPURenderStateObjectRefCounted {

    public readonly type: WebGPURenderStateShaderType;

    public readonly shader: GPUShaderModule;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateShaderType, shader: GPUShaderModule) {
        super(render_state);
        this.shader = shader;
        this.type = type;
    }

    public dispose() {
        this.render_state.delete_Shader(this);
    }
}