import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderElementBuffer } from "./WebGPURenderElementBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { Matrix2 } from "@/system/fivepebble/linear_algebra/Matrix2";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";

export class WebGPURenderElementMatrix2Buffer extends WebGPURenderElementBuffer<Matrix2> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Matrix2[] | number) {
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
                this._data[j++] = option[i].n11;
                this._data[j++] = option[i].n21;
                this._data[j++] = option[i].n12;
                this._data[j++] = option[i].n22;
            }
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Float32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Matrix2 | Matrix2[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementMatrix2Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementMatrix2Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 4; i < count; i++) {
                this._data[j++] = data[i].n11;
                this._data[j++] = data[i].n21;
                this._data[j++] = data[i].n12;
                this._data[j++] = data[i].n22;
            }
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementMatrix2Buffer> set_Data: data offset out of bound');
            let j = element_offset * 4;
            this._data[j++] = data.n11;
            this._data[j++] = data.n21;
            this._data[j++] = data.n12;
            this._data[j++] = data.n22;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: Matrix2): Matrix2 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementMatrix2Buffer> get_Data: element index out of bound');
        let j = element_index * 4;
        const n11 = this._data[j++];
        const n21 = this._data[j++];
        const n12 = this._data[j++];
        const n22 = this._data[j++];
        return target.set(n11, n12, n21, n22);
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}

export class WebGPURenderElementMatrix3Buffer extends WebGPURenderElementBuffer<Matrix3> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Matrix3[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * 9 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 9);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * 9 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 9);
            for (let i = 0, j = 0; i < this.element_count; i++) {
                this._data[j++] = option[i].n11;
                this._data[j++] = option[i].n21;
                this._data[j++] = option[i].n31;
                this._data[j++] = option[i].n12;
                this._data[j++] = option[i].n22;
                this._data[j++] = option[i].n32;
                this._data[j++] = option[i].n13;
                this._data[j++] = option[i].n23;
                this._data[j++] = option[i].n33;
            }
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Float32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Matrix3 | Matrix3[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementMatrix3Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementMatrix3Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 9; i < count; i++) {
                this._data[j++] = data[i].n11;
                this._data[j++] = data[i].n21;
                this._data[j++] = data[i].n31;
                this._data[j++] = data[i].n12;
                this._data[j++] = data[i].n22;
                this._data[j++] = data[i].n32;
                this._data[j++] = data[i].n13;
                this._data[j++] = data[i].n23;
                this._data[j++] = data[i].n33;
            }
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementMatrix3Buffer> set_Data: data offset out of bound');
            let j = element_offset * 9;
            this._data[j++] = data.n11;
            this._data[j++] = data.n21;
            this._data[j++] = data.n31;
            this._data[j++] = data.n12;
            this._data[j++] = data.n22;
            this._data[j++] = data.n32;
            this._data[j++] = data.n13;
            this._data[j++] = data.n23;
            this._data[j++] = data.n33;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: Matrix3): Matrix3 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementMatrix3Buffer> get_Data: element index out of bound');
        let j = element_index * 9;
        const n11 = this._data[j++];
        const n21 = this._data[j++];
        const n31 = this._data[j++];
        const n12 = this._data[j++];
        const n22 = this._data[j++];
        const n32 = this._data[j++];
        const n13 = this._data[j++];
        const n23 = this._data[j++];
        const n33 = this._data[j++];
        return target.set(n11, n12, n13, n21, n22, n23, n31, n32, n33);
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}

export class WebGPURenderElementMatrix4Buffer extends WebGPURenderElementBuffer<Matrix4> {

    public buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;

    public readonly _data: Float32Array;
    public get data(): Float32Array { return this._data; }

    public readonly element_count: number;
    public readonly bytes_count: number;

    protected changed: boolean = false;

    constructor(render_state: WebGPURenderState, type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, option: Matrix4[] | number) {
        super(render_state);
        if (typeof option === 'number') {
            this.element_count = option;
            this.bytes_count = this.element_count * 16 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 16);
            this.buffer_ref = new ReadonlyRef(this.render_state.create_Buffer(type, usage, this.bytes_count, false).expect());
        }
        else {
            this.element_count = option.length;
            this.bytes_count = this.element_count * 16 * Float32Array.BYTES_PER_ELEMENT;
            this._data = new Float32Array(this.element_count * 16);
            for (let i = 0, j = 0; i < this.element_count; i++) {
                this._data[j++] = option[i].n11;
                this._data[j++] = option[i].n21;
                this._data[j++] = option[i].n31;
                this._data[j++] = option[i].n41;
                this._data[j++] = option[i].n12;
                this._data[j++] = option[i].n22;
                this._data[j++] = option[i].n32;
                this._data[j++] = option[i].n42;
                this._data[j++] = option[i].n13;
                this._data[j++] = option[i].n23;
                this._data[j++] = option[i].n33;
                this._data[j++] = option[i].n43;
                this._data[j++] = option[i].n14;
                this._data[j++] = option[i].n24;
                this._data[j++] = option[i].n34;
                this._data[j++] = option[i].n44;
            }
            const { buffer, data } = this.render_state.create_Buffer(type, usage, this.bytes_count, true).expect();
            this.buffer_ref = new ReadonlyRef(buffer);
            const mapped_array = new Float32Array(data);
            mapped_array.set(this._data);
            this.buffer.buffer.unmap();
        }
    }

    public set_Data(data: Matrix4 | Matrix4[] | Float32Array, element_offset: number): void {
        if (data instanceof Float32Array) {
            const length = data.length;
            if (element_offset < 0 || (element_offset + length) > this._data.length) throw new Error('<WebGPURenderElementMatrix4Buffer> set_Data: data range out of bound');
            this._data.set(data, element_offset);
            this.changed = true;
        }
        else if (Array.isArray(data)) {
            const count = data.length;
            if (element_offset < 0 || (element_offset + count) > this.element_count) throw new Error('<WebGPURenderElementMatrix4Buffer> set_Data: data range out of bound');
            for (let i = 0, j = element_offset * 16; i < count; i++) {
                this._data[j++] = data[i].n11;
                this._data[j++] = data[i].n21;
                this._data[j++] = data[i].n31;
                this._data[j++] = data[i].n41;
                this._data[j++] = data[i].n12;
                this._data[j++] = data[i].n22;
                this._data[j++] = data[i].n32;
                this._data[j++] = data[i].n42;
                this._data[j++] = data[i].n13;
                this._data[j++] = data[i].n23;
                this._data[j++] = data[i].n33;
                this._data[j++] = data[i].n43;
                this._data[j++] = data[i].n14;
                this._data[j++] = data[i].n24;
                this._data[j++] = data[i].n34;
                this._data[j++] = data[i].n44;
            }
            this.changed = true;
        }
        else {
            if (element_offset < 0 || element_offset >= this.element_count) throw new Error('<WebGPURenderElementMatrix4Buffer> set_Data: data offset out of bound');
            let j = element_offset * 16;
            this._data[j++] = data.n11;
            this._data[j++] = data.n21;
            this._data[j++] = data.n31;
            this._data[j++] = data.n41;
            this._data[j++] = data.n12;
            this._data[j++] = data.n22;
            this._data[j++] = data.n32;
            this._data[j++] = data.n42;
            this._data[j++] = data.n13;
            this._data[j++] = data.n23;
            this._data[j++] = data.n33;
            this._data[j++] = data.n43;
            this._data[j++] = data.n14;
            this._data[j++] = data.n24;
            this._data[j++] = data.n34;
            this._data[j++] = data.n44;
            this.changed = true;
        }
    }

    public get_Data(element_index: number, target: Matrix4): Matrix4 {
        if (element_index < 0 || element_index >= this.element_count) throw new Error('<WebGPURenderElementMatrix4Buffer> get_Data: element index out of bound');
        let j = element_index * 16;
        const n11 = this._data[j++];
        const n21 = this._data[j++];
        const n31 = this._data[j++];
        const n41 = this._data[j++];
        const n12 = this._data[j++];
        const n22 = this._data[j++];
        const n32 = this._data[j++];
        const n42 = this._data[j++];
        const n13 = this._data[j++];
        const n23 = this._data[j++];
        const n33 = this._data[j++];
        const n43 = this._data[j++];
        const n14 = this._data[j++];
        const n24 = this._data[j++];
        const n34 = this._data[j++];
        const n44 = this._data[j++];
        return target.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
    }

    public commit(force: boolean = false): void {
        if (force || this.changed) {
            this.buffer.update_Data(0, this._data);
            this.changed = false;
        }
    }
}