import { RenderStateProgram } from "../../render_state_objects/pipeline/RenderStateProgram";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateShader } from "./WebGPURenderStateShader";

export class WebGPURenderStateProgram extends RenderStateProgram<WebGPURenderState> {

    constructor(render_state: WebGPURenderState, vertex_or_compute_shader: WebGPURenderStateShader, frag_shader?: WebGPURenderStateShader) {
        super(render_state, vertex_or_compute_shader, frag_shader);
    }
    
}