import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateShader } from "./WebGPURenderStateShader";

export class WebGPURenderStateProgram extends WebGPURenderObjectRefCounted {

    public readonly vertex_or_compute_shader_ref: Ref<WebGPURenderStateShader> = new Ref();
    public readonly fragment_shader_ref: Ref<WebGPURenderStateShader> = new Ref();

    constructor(render_state: WebGPURenderState, vertex_or_compute_shader: WebGPURenderStateShader, frag_shader?: WebGPURenderStateShader) {
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