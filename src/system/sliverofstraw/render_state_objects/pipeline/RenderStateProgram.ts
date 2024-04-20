import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import { RenderStateShaderType, type RenderStateShader } from "./RenderStateShader";

export abstract class RenderStateProgram<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly vertex_or_compute_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    public readonly fragment_shader_ref: Ref<RenderStateShader<T>> = new Ref();
    public readonly is_compute_program: boolean;

    constructor(render_state: T, vertex_or_compute_shader: RenderStateShader<T>, frag_shader?: RenderStateShader<T>) {
        super(render_state);
        this.vertex_or_compute_shader_ref.value = vertex_or_compute_shader;
        this.fragment_shader_ref.value = frag_shader;
        this.is_compute_program = vertex_or_compute_shader.type === RenderStateShaderType.Compute;
    }

    public dispose(): void {
        this.vertex_or_compute_shader_ref.clear();
        this.fragment_shader_ref.clear();
        this.render_state.delete_Program(this);
    }
}