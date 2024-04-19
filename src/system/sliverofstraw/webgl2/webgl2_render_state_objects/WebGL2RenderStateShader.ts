import { RenderStateShader } from "../../render_state_objects/pipeline/RenderStateShader";
import type { WebGL2RenderState } from "../WebGL2RenderState";

export class WebGL2RenderStateShader extends RenderStateShader<WebGL2RenderState> {
    public readonly shader: WebGLShader;

    constructor(render_state: WebGL2RenderState, shader: WebGLShader, type: number) {
        super(render_state, type);
        this.shader = shader;
    }
}