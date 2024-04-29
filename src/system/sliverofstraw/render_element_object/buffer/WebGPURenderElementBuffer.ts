import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";

export abstract class WebGPURenderElementBuffer<T> extends WebGPURenderObjectRefCounted {

    public abstract readonly buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get buffer(): WebGPURenderStateBuffer { return this.buffer_ref.expect; }

    public abstract get data(): WebGPURenderStateBufferData;

    public abstract get element_count(): number;
    public abstract get bytes_count(): number;

    public abstract set_Data(data: T | T[], element_offset: number): void;

    public abstract get_Data(element_index: number, target?: T): T;

    public abstract commit(): void;

    public dispose(): void {
        this.buffer_ref.clear();
    }
}

export class WebGPURenderElemenIndexBuffer extends WebGPURenderElementBuffer<number> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Uint32Array;
    public get data(): Uint32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: number[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * Uint32Array.BYTES_PER_ELEMENT;
            this._data = new Uint32Array(this.element_count);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Uint32Array(option);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect());
            const mapped_array = new Uint32Array(this.buffer.buffer.getMappedRange());
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: number | number[], element_offset: number): void {
        if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) >= this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> set_Data: data range out of bound');
            const uint32array = new Uint32Array(this._data.buffer, element_offset * Uint32Array.BYTES_PER_ELEMENT, data.length);
            uint32array.set(data);
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> set_Data: data offset out of bound');
            this._data[element_offset] = data;
        }
    }

    public get_Data(element_index: number, target: undefined = undefined): number {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> get_Data: element index out of bound');
        return this._data[element_index];
    }

    public commit(): void {
        this.buffer.update_Data(0, this._data);
    }
}