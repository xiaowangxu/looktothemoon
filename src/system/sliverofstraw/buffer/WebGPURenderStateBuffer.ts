import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export enum WebGPURenderStateBufferType {
    NotSpecified = 0x0000,
    Index = 0x0010,
    VertexArray = 0x0020,
    Uniform = 0x0040,
    Storage = 0x0080,
    QueryResult = 0x0200,
    IndirectCommand = 0x0100,
}

export enum WebGPURenderStateBufferDataType {
    Float, Int, Byte, Short,
    Uint, Ushort,
}

export enum WebGPURenderStateBufferUsage {
    None = 0x0000,
    CopySrc = 0x0004,
    CopyDst = 0x0008,
    MapRead = 0x0001,
    MapWrite = 0x0002,
}

export type WebGPURenderStateBufferData = ArrayBuffer | ArrayBufferView;

export class WebGPURenderStateBuffer extends WebGPURenderStateObjectRefCounted {

    public readonly buffer: GPUBuffer;

    public readonly type: WebGPURenderStateBufferType;
    public readonly usage: WebGPURenderStateBufferUsage;
    public readonly data_type: WebGPURenderStateBufferDataType;
    public readonly length: number;

    constructor(render_state: WebGPURenderState, type: number, usage: number, data_type: WebGPURenderStateBufferDataType, length: number, buffer: GPUBuffer) {
        super(render_state);
        this.type = type;
        this.usage = usage;
        this.data_type = data_type;
        this.length = length;
        this.buffer = buffer;
    }

    public update_Data(dst_offset: number, data: WebGPURenderStateBufferData, data_element_offset?: number | undefined, data_element_length?: number | undefined): void {
        this.render_state.device.queue.writeBuffer(this.buffer, dst_offset, data, data_element_offset, data_element_length);
    }

    public dispose() {
        this.render_state.delete_Buffer(this);
    }
}