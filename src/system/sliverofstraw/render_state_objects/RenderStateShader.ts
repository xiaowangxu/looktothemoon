import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../RenderState";

export class RenderStateShader<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly shader: WebGLShader;

    public readonly type: number;

    constructor(render_state: RenderState<T>, shader: WebGLShader, type: number) {
        super(render_state);
        this.shader = shader;
        this.type = type;
    }

    public dispose() {
        this.render_state.delete_Shader(this);
    }
}