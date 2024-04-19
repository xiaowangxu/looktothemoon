import { RenderStateBuffer } from "../../render_state_objects/buffer/RenderStateBuffer";
import { RenderStateVertexArrayAttributeBufferAdaptor } from "../../render_state_objects/vertex_array/RenderStateVertexArrayAttributeBufferAdaptor";
import type { WebGL2RenderState } from "../WebGL2RenderState";

export class WebGL2RenderStateBuffer extends RenderStateBuffer<WebGL2RenderState> {
    public readonly buffer: WebGLBuffer;

    constructor(render_state: WebGL2RenderState, buffer: WebGLBuffer, type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, data_stride: number, data_offset: number, divisor: number) {
        super(render_state, type, usage, data_size, data_type, data_normalize, data_stride, data_offset, divisor);
        this.buffer = buffer;
    }
}

export class WebGL2RenderStateBufferView extends RenderStateVertexArrayAttributeBufferAdaptor<WebGL2RenderState> {
    public get buffer() { return (this.buffer_ref.expect as WebGL2RenderStateBuffer).buffer; }

    constructor(render_state: WebGL2RenderState, buffer: WebGL2RenderStateBuffer, data_size: number, data_stride: number, data_offset: number, divisor: number | undefined) {
        super(render_state, buffer, data_size, data_stride, data_offset, divisor);
    }
}