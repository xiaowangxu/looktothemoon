import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";

export class RenderStateVertexArrayAttributeBufferAdaptor<T extends RenderState<T>> extends RenderStateObject<T> {

    public readonly buffer: RenderStateBuffer<T>;

    public readonly element_size: number;
    public readonly offset: number;
    public readonly stride: number;

    constructor(render_state: T, buffer: RenderStateBuffer<T>, element_size: number, offset: number, stride: number) {
        super(render_state);
        this.buffer = buffer;
        this.element_size = element_size;
        this.offset = offset;
        this.stride = stride;
    }
}
