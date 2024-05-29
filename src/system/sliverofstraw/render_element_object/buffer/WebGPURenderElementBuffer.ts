import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";

export abstract class WebGPURenderElementBuffer<T = any> extends WebGPURenderObjectRefCounted {

    protected abstract readonly buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get buffer(): WebGPURenderStateBuffer { return this.buffer_ref.expect; }

    public abstract get data(): WebGPURenderStateBufferData;

    public abstract get element_count(): number;
    public abstract get bytes_count(): number;

    public abstract set_Data(data: T | T[], element_offset: number): void;

    public abstract get_Data(element_index: number, target?: T): T;

    public abstract commit(force: boolean): void;

    public dispose(): void {
        this.buffer_ref.clear();
    }
}

export class WebGPURenderElementIndexBuffer extends WebGPURenderElementBuffer<number> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Uint32Array;
    public get data(): Uint32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: number[] | Uint32Array | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * Uint32Array.BYTES_PER_ELEMENT;
            this._data = new Uint32Array(this.element_count);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * Uint32Array.BYTES_PER_ELEMENT;
            this._data = new Uint32Array(option);
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Uint32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: number | number[] | Uint32Array, element_offset: number): void {
        if (data instanceof Uint32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementIndexBuffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> set_Data: data range out of bound');
            const uint32array = new Uint32Array(this._data.buffer, element_offset * Uint32Array.BYTES_PER_ELEMENT, data.length);
            uint32array.set(data);
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> set_Data: data offset out of bound');
            this._data[element_offset] = data;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: undefined = undefined): number {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementIndexBuffer> get_Data: element index out of bound');
        return this._data[element_index];
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}

export class WebGPURenderElementUintBuffer extends WebGPURenderElementBuffer<number> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Uint32Array;
    public get data(): Uint32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

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
            this.bytes_count = this.element_count * Uint32Array.BYTES_PER_ELEMENT;
            this._data = new Uint32Array(option);
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Uint32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: number | number[] | Uint32Array, element_offset: number): void {
        if (data instanceof Uint32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementUintBuffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementUintBuffer> set_Data: data range out of bound');
            const uint32array = new Uint32Array(this._data.buffer, element_offset * Uint32Array.BYTES_PER_ELEMENT, data.length);
            uint32array.set(data);
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementUintBuffer> set_Data: data offset out of bound');
            this._data[element_offset] = data;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: undefined = undefined): number {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementUintBuffer> get_Data: element index out of bound');
        return this._data[element_index];
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}

export class WebGPURenderElementIntBuffer extends WebGPURenderElementBuffer<number> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Int32Array;
    public get data(): Int32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: number[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * Int32Array.BYTES_PER_ELEMENT;
            this._data = new Int32Array(this.element_count);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * Int32Array.BYTES_PER_ELEMENT;
            this._data = new Int32Array(option);
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Int32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: number | number[] | Int32Array, element_offset: number): void {
        if (data instanceof Int32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementIntBuffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementIntBuffer> set_Data: data range out of bound');
            const uint32array = new Int32Array(this._data.buffer, element_offset * Int32Array.BYTES_PER_ELEMENT, data.length);
            uint32array.set(data);
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementIntBuffer> set_Data: data offset out of bound');
            this._data[element_offset] = data;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: undefined = undefined): number {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementIntBuffer> get_Data: element index out of bound');
        return this._data[element_index];
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}

export class WebGPURenderElementFloatBuffer extends WebGPURenderElementBuffer<number> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: number[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(option);
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Float32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: number | number[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementFloatBuffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementFloatBuffer> set_Data: data range out of bound');
            const uint32array = new Float32Array(this._data.buffer, element_offset * Float32Array.BYTES_PER_ELEMENT, data.length);
            uint32array.set(data);
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementFloatBuffer> set_Data: data offset out of bound');
            this._data[element_offset] = data;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: undefined = undefined): number {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementFloatBuffer> get_Data: element index out of bound');
        return this._data[element_index];
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}