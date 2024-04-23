import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import { type RenderStateShader } from "./RenderStateShader";

export abstract class RenderStateProgram<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly vertex_or_compute_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    public readonly fragment_shader_ref: Ref<RenderStateShader<T>> = new Ref();

    constructor(render_state: T, vertex_or_compute_shader: RenderStateShader<T>, frag_shader?: RenderStateShader<T>) {
        super(render_state);
        this.vertex_or_compute_shader_ref.value = vertex_or_compute_shader;
        this.fragment_shader_ref.value = frag_shader;
    }

    public dispose(): void {
        this.vertex_or_compute_shader_ref.clear();
        this.fragment_shader_ref.clear();
        this.render_state.delete_Program(this);
    }
}