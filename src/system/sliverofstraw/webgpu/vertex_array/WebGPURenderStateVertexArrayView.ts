import { RenderStateVertexArrayView } from "../../render_state/vertex_array/RenderStateVertexArrayView";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateVertexArray } from "./WebGPURenderStateVertexArray";

export class WebGPURenderStateVertexArrayView extends RenderStateVertexArrayView<WebGPURenderState> {

    constructor(render_state: WebGPURenderState, vertex_array: WebGPURenderStateVertexArray, offset: number, count: number) {
        super(render_state, vertex_array, offset, count);
    }
    
}