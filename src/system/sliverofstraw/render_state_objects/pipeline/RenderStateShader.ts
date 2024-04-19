import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";

export abstract class RenderStateShader<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly type: number;

    constructor(render_state: T, type: number) {
        super(render_state);
        this.type = type;
    }

    public dispose() {
        this.render_state.delete_Shader(this);
    }
}