import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";

export enum RenderStateBufferType {
    Index, VertexArray, Uniform, Storage, 
    CopySrc, CopyDst, QueryResult,
}

export enum RenderStateBufferUsage {
    StaticCopy, StaticDraw, StaticRead,
    DynamicCopy, DynamicDraw, DynamicRead,
    StreamCopy, StreamDraw, StreamRead,
}

export abstract class RenderStateBuffer<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly type: number;
    public readonly usage: number;
    public readonly data_size: number;
    public readonly data_type: number;
    public readonly data_normalize: boolean;
    public readonly data_stride: number;
    public readonly data_offset: number;
    public readonly divisor: number;

    constructor(render_state: T, type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, data_stride: number, data_offset: number, divisor: number) {
        super(render_state);
        this.type = type;
        this.usage = usage;
        this.data_size = data_size;
        this.data_type = data_type;
        this.data_normalize = data_normalize;
        this.data_stride = data_stride;
        this.data_offset = data_offset;
        this.divisor = divisor;
    }

    public dispose() {
        this.render_state.delete_Buffer(this);
    }
}