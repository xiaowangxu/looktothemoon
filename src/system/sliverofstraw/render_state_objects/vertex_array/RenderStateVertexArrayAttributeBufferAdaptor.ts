import { RenderStateObject, RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";
import { Ref } from "@/system/utils/RefCounted";

export class RenderStateVertexArrayAttributeBufferAdaptor<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly buffer_ref: Ref<RenderStateBuffer<T>> = new Ref();

    public readonly element_size: number;
    public readonly offset: number;
    public readonly stride: number;

    constructor(render_state: T, buffer: RenderStateBuffer<T>, element_size: number, offset: number, stride: number) {
        super(render_state);
        this.buffer_ref.value = buffer;
        this.element_size = element_size;
        this.offset = offset;
        this.stride = stride;
    }

    public dispose(): void {
        this.buffer_ref.clear();
    }
}
