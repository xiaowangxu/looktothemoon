import { RenderStateShader, RenderStateShaderType } from "../../render_state/pipeline/RenderStateShader";
import type { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateShader extends RenderStateShader<WebGPURenderState> {

    public readonly shader: GPUShaderModule;

    constructor(render_state: WebGPURenderState, type: RenderStateShaderType, shader: GPUShaderModule) {
        super(render_state, type);
        this.shader = shader;
    }
}