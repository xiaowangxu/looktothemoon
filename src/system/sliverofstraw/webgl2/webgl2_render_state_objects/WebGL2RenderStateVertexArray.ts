import { RenderStateVertexArray, RenderStateVertexArrayView } from "../../render_state_objects/RenderStateVertexArray";
import type { WebGL2RenderState } from "../WebGL2RenderState";

export class WebGL2RenderStateVertexArray extends RenderStateVertexArray<WebGL2RenderState> {
    public readonly vertex_array: WebGLVertexArrayObject;

    constructor(render_state: WebGL2RenderState, vertex_array: WebGLVertexArrayObject, primitive_type: number, offset: number, count: number) {
        super(render_state, primitive_type, offset, count);
        this.vertex_array = vertex_array;
    }
}

export class WebGL2RenderStateVertexArrayView extends RenderStateVertexArrayView<WebGL2RenderState> {
    public get vertex_array() { return (this.vertex_array_ref.expect as WebGL2RenderStateVertexArray).vertex_array; }

    constructor(render_state: WebGL2RenderState, vertex_array: WebGL2RenderStateVertexArray, offset: number, count: number) {
        super(render_state, vertex_array, offset, count);
    }
}