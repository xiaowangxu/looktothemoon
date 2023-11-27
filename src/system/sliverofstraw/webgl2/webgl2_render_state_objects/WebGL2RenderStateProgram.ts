import { RenderStateProgram } from "../../render_state_objects/RenderStateProgram";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import type { WebGL2RenderStateShader } from "./WebGL2RenderStateShader";

export class WebGL2RenderStateProgram extends RenderStateProgram<WebGL2RenderState> {
    public readonly program: WebGLProgram;

    constructor(render_state: WebGL2RenderState, program: WebGLProgram, vert_shader: WebGL2RenderStateShader, frag_shader: WebGL2RenderStateShader) {
        super(render_state, vert_shader, frag_shader);
        this.program = program;
    }
}