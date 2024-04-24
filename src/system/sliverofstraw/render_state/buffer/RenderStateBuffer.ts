import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../RenderState";
import { RenderStateVertexArrayAttributeBufferAdaptor } from "../vertex_array/RenderStateVertexArrayAttributeBufferAdaptor";

export enum RenderStateBufferType {
    Index, VertexArray, Uniform, Storage, QueryResult,
}

export enum RenderStateBufferDataType {
    Float, Int, Byte, Short,
    UnsignedInt, UnsignedByte, UnsignedShort,
}

export enum RenderStateBufferUsage {
    StaticCopy, StaticDraw, StaticRead,
    DynamicCopy, DynamicDraw, DynamicRead,
    StreamCopy, StreamDraw, StreamRead,
}

export type RenderStateBufferData = ArrayBuffer | ArrayBufferView;

export abstract class RenderStateBuffer<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly type: RenderStateBufferType;
    public readonly usage: RenderStateBufferUsage;
    public readonly data_type: RenderStateBufferDataType;
    public readonly element_size: number;
    public readonly size: number;

    constructor(render_state: T, type: number, usage: number, data_type: RenderStateBufferDataType, element_size: number, size: number) {
        super(render_state);
        this.type = type;
        this.usage = usage;
        this.data_type = data_type;
        this.element_size = element_size;
        this.size = size;
    }

    /**
     * update a portion of this buffer, but the size of the buffer can not be altered, use RenderState.create_Buffer(type, usage, size) instead
     * @throws data overflow error
     * @param data an ArrayBuffer, TypedArray, or DataView
     * @param dst_offset buffer offset where the data copyed into, in bytes
     * @param data_element_offset data offset where copyed data starts from, if is TypedArray in element count, else in bytes
     * @param data_element_length total data size to be copyed from, if is TypedArray in element count, else in bytes, if omitted will be (data.length - dst_offset)
     */
    public abstract update_Data(dst_offset: number, data: RenderStateBufferData, data_element_offset: number, data_element_length?: number): void;

    public create_AttributeBufferAdaptor(element_size: number, offset: number, stride: number): RenderStateVertexArrayAttributeBufferAdaptor<T> {
        return new RenderStateVertexArrayAttributeBufferAdaptor<T>(this.render_state, this, element_size, offset, stride)
    }

    public dispose() {
        this.render_state.delete_Buffer(this);
    }
}