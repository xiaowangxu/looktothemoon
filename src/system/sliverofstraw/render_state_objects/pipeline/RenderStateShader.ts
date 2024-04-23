import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";

export enum RenderStateShaderType {
    Vertex = 0x01,
    Fragment = 0x02,
    Compute = 0x04,
}

export abstract class RenderStateShader<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {
    
    public readonly type: RenderStateShaderType;

    constructor(render_state: T, type: RenderStateShaderType) {
        super(render_state);
        this.type = type;
    }

    public dispose() {
        this.render_state.delete_Shader(this);
    }
}