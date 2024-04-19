import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import type { RenderStateShader } from "./RenderStateShader";

export abstract class RenderStateProgram<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly vert_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    public readonly frag_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    
    constructor(render_state: T, vert_shader: RenderStateShader<T>, frag_shader?: RenderStateShader<T>){
        super(render_state);
        this.vert_shader_ref.value = vert_shader;
        this.frag_shader_ref.value = frag_shader;
    }

    public dispose(): void {
        this.vert_shader_ref.clear();
        this.frag_shader_ref.clear();
        this.render_state.delete_Program(this);
    }
}