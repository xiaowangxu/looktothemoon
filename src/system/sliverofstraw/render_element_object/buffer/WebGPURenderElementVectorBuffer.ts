import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { WebGPURenderElementBuffer } from "./WebGPURenderElementBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";

export class WebGPURenderElementVector2Buffer extends WebGPURenderElementBuffer<Vector2> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Vector2[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * 2 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 2);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * 2 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 2);
            for (let i = 0, j = 0; i < this.element_count; i++) {
                this._data[j++] = option[i].x;
                this._data[j++] = option[i].y;
            }
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect());
            const mapped_array = new Float32Array(this.buffer.buffer.getMappedRange());
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Vector2 | Vector2[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementVector2Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementVector2Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 2; i < count; i++) {
                this._data[j++] = data[i].x;
                this._data[j++] = data[i].y;
            }
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementVector2Buffer> set_Data: data offset out of bound');
            let j = element_offset * 2;
            this._data[j++] = data.x;
            this._data[j++] = data.y;
        }
    }

    public get_Data(element_index: number, target: Vector2): Vector2 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementVector2Buffer> get_Data: element index out of bound');
        let j = element_index * 2;
        const x = this._data[j++];
        const y = this._data[j++];
        return target.set(x, y);
    }

    public commit(): void {
        this.buffer.update_Data(0, this._data);
    }
}

export class WebGPURenderElementVector3Buffer extends WebGPURenderElementBuffer<Vector3> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Vector3[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * 3 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 3);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * 3 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 3);
            for (let i = 0, j = 0; i < this.element_count; i++) {
                this._data[j++] = option[i].x;
                this._data[j++] = option[i].y;
                this._data[j++] = option[i].z;
            }
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect());
            const mapped_array = new Float32Array(this.buffer.buffer.getMappedRange());
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Vector3 | Vector3[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementVector3Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementVector3Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 3; i < count; i++) {
                this._data[j++] = data[i].x;
                this._data[j++] = data[i].y;
                this._data[j++] = data[i].z;
            }
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementVector3Buffer> set_Data: data offset out of bound');
            let j = element_offset * 3;
            this._data[j++] = data.x;
            this._data[j++] = data.y;
            this._data[j++] = data.z;
        }
    }

    public get_Data(element_index: number, target: Vector3): Vector3 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementVector3Buffer> get_Data: element index out of bound');
        let j = element_index * 3;
        const x = this._data[j++];
        const y = this._data[j++];
        const z = this._data[j++];
        return target.set(x, y, z);
    }

    public commit(): void {
        this.buffer.update_Data(0, this._data);
    }
}

export class WebGPURenderElementVector4Buffer extends WebGPURenderElementBuffer<Vector4> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Vector4[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * 4 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 4);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * 4 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 4);
            for (let i = 0, j = 0; i < this.element_count; i++) {
                this._data[j++] = option[i].x;
                this._data[j++] = option[i].y;
                this._data[j++] = option[i].z;
                this._data[j++] = option[i].w;
            }
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect());
            const mapped_array = new Float32Array(this.buffer.buffer.getMappedRange());
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Vector4 | Vector4[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementVector4Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementVector4Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 4; i < count; i++) {
                this._data[j++] = data[i].x;
                this._data[j++] = data[i].y;
                this._data[j++] = data[i].z;
                this._data[j++] = data[i].w;
            }
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementVector4Buffer> set_Data: data offset out of bound');
            let j = element_offset * 4;
            this._data[j++] = data.x;
            this._data[j++] = data.y;
            this._data[j++] = data.z;
            this._data[j++] = data.w;
        }
    }

    public get_Data(element_index: number, target: Vector4): Vector4 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementVector4Buffer> get_Data: element index out of bound');
        let j = element_index * 4;
        const x = this._data[j++];
        const y = this._data[j++];
        const z = this._data[j++];
        const w = this._data[j++];
        return target.set(x, y, z, w);
    }

    public commit(): void {
        this.buffer.update_Data(0, this._data);
    }
}