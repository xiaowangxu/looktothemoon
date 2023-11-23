import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObject } from "../RenderObject";
import type { RenderState } from "../RenderState";
import type { RenderStateShader } from "./RenderStateShader";

export class RenderStateProgram<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly program: WebGLProgram;

    public readonly vert_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    public readonly frag_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    
    constructor(render_state: RenderState<T>, program: WebGLProgram, vert_shader: RenderStateShader<T>, frag_shader: RenderStateShader<T>){
        super(render_state);
        this.program = program;
        this.vert_shader_ref.value = vert_shader;
        this.frag_shader_ref.value = frag_shader;
    }

    public dispose(): void {
        this.vert_shader_ref.clear();
        this.frag_shader_ref.clear();
        this.render_state.delete_Program(this);
    }
}