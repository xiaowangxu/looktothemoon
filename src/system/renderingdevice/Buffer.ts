import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export class Buffer implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly type: number;
    public readonly usage: number;

    public readonly data_size: number;
    public readonly data_type: number;
    public readonly data_normalize: boolean;
    public get data_stride() { return 0; }
    public get data_offset() { return 0; }

    public data: ArrayBufferLike | undefined = undefined;

    private _buffer: WebGLBuffer | undefined = undefined;
    public get buffer() { return this._buffer; }
    public set buffer(buffer: WebGLBuffer | undefined) { this._buffer = buffer; }

    public get compiled() { return this.buffer !== undefined; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice, type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, data: ArrayBufferLike | undefined) {
        this.rd = rd;
        this.type = type;
        this.usage = usage;
        this.data_size = data_size;
        this.data_type = data_type;
        this.data_normalize = data_normalize;
        this.data = data;
    }

    public free() {
        console.log(">>>>> free buffer");
        this.rd.state.free_Buffer(this);
    }
}

export class BufferView implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly buffer_ref: Ref<Buffer> = new Ref();

    public get type() { return this.buffer_ref.value!.type; }
    public get usage() { return this.buffer_ref.value!.usage; }

    public get data_size() { return this.buffer_ref.value!.data_size; }
    public get data_type() { return this.buffer_ref.value!.data_type; }
    public get data_normalize() { return this.buffer_ref.value!.data_normalize; }
    public readonly data_stride: number;
    public readonly data_offset: number;

    public get buffer() { return this.buffer_ref.value!.buffer; }
    public set buffer(buffer: WebGLBuffer | undefined) {
        this.buffer_ref.value!.buffer = buffer;
    }

    public get compiled() { return this.buffer_ref.value!.compiled; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice, buffer: Buffer, data_stride: number, data_offset: number) {
        this.rd = rd;
        this.buffer_ref.value = buffer;
        this.data_stride = data_stride;
        this.data_offset = data_offset;
    }

    public free() {
        this.buffer_ref.value = undefined;
    }
}