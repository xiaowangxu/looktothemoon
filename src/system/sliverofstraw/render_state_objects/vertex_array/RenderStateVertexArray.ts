import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../RenderState";
import type { RenderStateVertexArrayAttributeBufferAdaptor } from "./RenderStateVertexArrayAttributeBufferAdaptor";
import { RenderStateVertexArrayView } from "./RenderStateVertexArrayView";
import type { RenderStateBuffer } from "../buffer/RenderStateBuffer";

export enum RenderStatePrimitiveType {
    Triangles, TriangleStrip, TriangleFan, LineStrip, Lines, LineLoop
}

export abstract class RenderStateVertexArray<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly primitive_type: RenderStatePrimitiveType;
    public readonly offset: number;
    public readonly count: number;

    public abstract get is_indexed(): boolean;

    constructor(render_state: T, primitive_type: RenderStatePrimitiveType, offset: number, count: number) {
        super(render_state);
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.count = count;
    }

    /**
     * set vertex array's attribute buffer
     * @param location attribute location
     * @param buffer the buffer can be RenderStateBuffer or RenderStateVertexArrayAttributeBufferAdaptor
     * @param buffer_views if needs to be split into rows, pass in each row as RenderStateVertexArrayAttributeBufferAdaptor, each RS will use this accordingly
     * @param per_instance is per instance step mode buffer
     */
    public abstract set_Buffer(location: number, buffer: RenderStateBuffer<T> | RenderStateVertexArrayAttributeBufferAdaptor<T>, buffer_views: Iterable<RenderStateVertexArrayAttributeBufferAdaptor<T>> | undefined, per_instance: boolean): void;

    /**
     * clear one vertex array's attribute buffer
     * @param location clear buffer's base location, will consider rows
     */
    public abstract clear_Buffer(location: number): void;

    /**
     * clear all attribute buffers
     */
    public abstract clear_Buffers(): void;

    public abstract set_Index(buffer: RenderStateBuffer<T> | RenderStateVertexArrayAttributeBufferAdaptor<T>): void;

    public abstract clear_Index(): void;

    public create_View(vertex_offset: number, vertex_count: number) {
        const view: RenderStateVertexArrayView<T> = new RenderStateVertexArrayView(this.render_state, this, vertex_offset, vertex_count);
        return view;
    }

    public dispose(): void {
        this.render_state.delete_VertexArray(this);
    }
}