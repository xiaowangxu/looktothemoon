import type { Matrix2 } from "@/system/fivepebble/linear_algebra/Matrix2";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { RenderDevice } from "@/system/sliverofstraw/render_device/RenderDevice";
import type { RenderState, RenderStateBufferUsage } from "@/system/sliverofstraw/render_state_objects/RenderState";
import { RenderDeviceVector2AttributeBuffer, type RenderDeviceAttributeBuffer, RenderDeviceVector3AttributeBuffer, RenderDeviceVector4AttributeBuffer, RenderDeviceMatrix4AttributeBuffer, RenderDeviceIndexAttributeBuffer, RenderDeviceMatrix3AttributeBuffer, RenderDeviceFloatAttributeBuffer, RenderDeviceIntAttributeBuffer, RenderDeviceUintAttributeBuffer, RenderDeviceMatrix2AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";

export abstract class PackedArray<Data = any> {
    public abstract get data(): ArrayBufferView;

    public abstract get per_element_byte_count(): number;
    public abstract get per_item_element_count(): number;
    public abstract get element_count(): number;
    public get item_count(): number { return this.element_count / this.per_item_element_count; }
    public get byte_count(): number { return this.data.byteLength; }

    public abstract update_Data(data: Data, offset: number): void;
    public abstract update_Data(data: ArrayBufferView, offset: number): void;
    public abstract update_Data(data: Data[], offset: number): void;
    public abstract update_Data(data: Data[] | ArrayBufferView | Data, offset: number): void;

    public abstract get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceAttributeBuffer<T>;
}

export class PackedByteArray extends PackedArray<number> {
    public readonly data: Uint8Array | Uint8ClampedArray;

    public get per_element_byte_count(): number { return Uint8Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Uint8Array | Uint8ClampedArray)
    constructor(data: Uint8Array | Uint8ClampedArray | number) {
        super();
        if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
            this.data = data;
        }
        else {
            this.data = new Uint8Array(data);
        }
    }

    public update_Data(data: number[], offset: number): void;
    public update_Data(data: Uint8Array, offset: number): void;
    public update_Data(data: number, offset: number): void;
    public update_Data(data: number[] | Uint8Array | number, offset: number): void {
        let uint8array: Uint8Array;
        let offset_bytes: number;
        if (data instanceof Uint8Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedByteArray> update_Data: data overflow');
            uint8array = new Uint8Array(this.data.buffer, offset_bytes, data.length);
            uint8array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedByteArray> update_Data: data overflow');
            uint8array = new Uint8Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                uint8array[0] = data;
            }
            else {
                uint8array.set(data);
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIndexAttributeBuffer<T> {
        throw new Error('<PackedByteArray> get_RenderDeviceAttributeBuffer: cannot get attribute buffer from PackedByteArray')
    }
}

export class PackedIndexArray extends PackedArray<number> {
    public readonly data: Uint32Array;

    public get per_element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Uint32Array)
    constructor(data: Uint32Array | number) {
        super();
        if (data instanceof Uint32Array) {
            this.data = data;
        }
        else {
            this.data = new Uint32Array(data);
        }
    }

    public update_Data(data: number[], offset: number): void;
    public update_Data(data: Uint32Array, offset: number): void;
    public update_Data(data: number, offset: number): void;
    public update_Data(data: number[] | Uint32Array | number, offset: number): void {
        let uint32array: Uint32Array;
        let offset_bytes: number;
        if (data instanceof Uint32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedIndexArray> update_Data: data overflow');
            uint32array = new Uint32Array(this.data.buffer, offset_bytes, data.length);
            uint32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedIndexArray> update_Data: data overflow');
            uint32array = new Uint32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                uint32array[0] = data;
            }
            else {
                uint32array.set(data);
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIndexAttributeBuffer<T> {
        return new RenderDeviceIndexAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedUintArray extends PackedArray<number> {
    public readonly data: Uint32Array;

    public get per_element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Uint32Array)
    constructor(data: Uint32Array | number) {
        super();
        if (data instanceof Uint32Array) {
            this.data = data;
        }
        else {
            this.data = new Uint32Array(data);
        }
    }

    public update_Data(data: number[], offset: number): void;
    public update_Data(data: Uint32Array, offset: number): void;
    public update_Data(data: number, offset: number): void;
    public update_Data(data: number[] | Uint32Array | number, offset: number): void {
        let uint32array: Uint32Array;
        let offset_bytes: number;
        if (data instanceof Uint32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedUintArray> update_Data: data overflow');
            uint32array = new Uint32Array(this.data.buffer, offset_bytes, data.length);
            uint32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedUintArray> update_Data: data overflow');
            uint32array = new Uint32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                uint32array[0] = data;
            }
            else {
                uint32array.set(data);
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceUintAttributeBuffer<T> {
        return new RenderDeviceUintAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedFloatArray extends PackedArray<number> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            this.data = data;
        }
        else {
            this.data = new Float32Array(data);
        }
    }

    public update_Data(data: number[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: number, offset: number): void;
    public update_Data(data: number[] | Float32Array | number, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedFloatArray> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedFloatArray> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data;
            }
            else {
                float32array.set(data);
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceFloatAttributeBuffer<T> {
        return new RenderDeviceFloatAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedIntArray extends PackedArray<number> {
    public readonly data: Int32Array;

    public get per_element_byte_count(): number { return Int32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Int32Array)
    constructor(data: Int32Array | number) {
        super();
        if (data instanceof Int32Array) {
            this.data = data;
        }
        else {
            this.data = new Int32Array(data);
        }
    }

    public update_Data(data: number[], offset: number): void;
    public update_Data(data: Int32Array, offset: number): void;
    public update_Data(data: number, offset: number): void;
    public update_Data(data: number[] | Int32Array | number, offset: number): void {
        let int32array: Int32Array;
        let offset_bytes: number;
        if (data instanceof Int32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedIntArray> update_Data: data overflow');
            int32array = new Int32Array(this.data.buffer, offset_bytes, data.length);
            int32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedIntArray> update_Data: data overflow');
            int32array = new Int32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                int32array[0] = data;
            }
            else {
                int32array.set(data);
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceIntAttributeBuffer<T> {
        return new RenderDeviceIntAttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector2Array extends PackedArray<Vector2> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 2; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 2 !== 0) throw new Error('<PackedVector2Array> constructor@array: array is not a valid PackedVector2Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 2);
        }
    }

    public update_Data(data: Vector2[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Vector2, offset: number): void;
    public update_Data(data: Vector2[] | Float32Array | Vector2, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector2Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 2 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 2;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector2Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.x;
                float32array[1] = data.y;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec2 = data[j++];
                    float32array[i++] = vec2.x;
                    float32array[i++] = vec2.y;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector2AttributeBuffer<T> {
        return new RenderDeviceVector2AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector3Array extends PackedArray<Vector3> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 3; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 3 !== 0) throw new Error('<PackedVector3Array> constructor@array: array is not a valid PackedVector3Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 3);
        }
    }

    public update_Data(data: Vector3[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Vector3, offset: number): void;
    public update_Data(data: Vector3[] | Float32Array | Vector3, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector3Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 3 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 3;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector3Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.x;
                float32array[1] = data.y;
                float32array[2] = data.z;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec3 = data[j++];
                    float32array[i++] = vec3.x;
                    float32array[i++] = vec3.y;
                    float32array[i++] = vec3.z;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector3AttributeBuffer<T> {
        return new RenderDeviceVector3AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedVector4Array extends PackedArray<Vector4> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 4; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 4 !== 0) throw new Error('<PackedVector4Array> constructor@array: array is not a valid PackedVector4Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 4);
        }
    }

    public update_Data(data: Vector4[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Vector4, offset: number): void;
    public update_Data(data: Vector4[] | Float32Array | Vector4, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector4Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 4 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 4;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedVector4Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.x;
                float32array[1] = data.y;
                float32array[2] = data.z;
                float32array[3] = data.w;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec4 = data[j++];
                    float32array[i++] = vec4.x;
                    float32array[i++] = vec4.y;
                    float32array[i++] = vec4.z;
                    float32array[i++] = vec4.w;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceVector4AttributeBuffer<T> {
        return new RenderDeviceVector4AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedMatrix2Array extends PackedArray<Matrix2> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 4; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 4 !== 0) throw new Error('<PackedMatrix2Array> constructor@array: array is not a valid PackedMatrix2Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 4);
        }
    }

    public update_Data(data: Matrix2[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Matrix2, offset: number): void;
    public update_Data(data: Matrix2[] | Float32Array | Matrix2, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix2Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 4 * this.per_element_byte_count;
            const mat3_count = single ? 1 : data.length;
            const element_count = mat3_count * 4;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix2Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.n11;
                float32array[1] = data.n21;
                float32array[3] = data.n12;
                float32array[4] = data.n22;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const mat3 = data[j++];
                    float32array[i++] = mat3.n11;
                    float32array[i++] = mat3.n21;
                    float32array[i++] = mat3.n12;
                    float32array[i++] = mat3.n22;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceMatrix2AttributeBuffer<T> {
        return new RenderDeviceMatrix2AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedMatrix3Array extends PackedArray<Matrix3> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 9; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 9 !== 0) throw new Error('<PackedMatrix3Array> constructor@array: array is not a valid PackedMatrix3Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 9);
        }
    }

    public update_Data(data: Matrix3[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Matrix3, offset: number): void;
    public update_Data(data: Matrix3[] | Float32Array | Matrix3, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix3Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 9 * this.per_element_byte_count;
            const mat3_count = single ? 1 : data.length;
            const element_count = mat3_count * 9;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix3Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.n11;
                float32array[1] = data.n21;
                float32array[2] = data.n31;
                float32array[3] = data.n12;
                float32array[4] = data.n22;
                float32array[5] = data.n32;
                float32array[6] = data.n13;
                float32array[7] = data.n23;
                float32array[8] = data.n33;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const mat3 = data[j++];
                    float32array[i++] = mat3.n11;
                    float32array[i++] = mat3.n21;
                    float32array[i++] = mat3.n31;
                    float32array[i++] = mat3.n12;
                    float32array[i++] = mat3.n22;
                    float32array[i++] = mat3.n32;
                    float32array[i++] = mat3.n13;
                    float32array[i++] = mat3.n23;
                    float32array[i++] = mat3.n33;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceMatrix3AttributeBuffer<T> {
        return new RenderDeviceMatrix3AttributeBuffer(render_device, usage, this.data);
    }
}

export class PackedMatrix4Array extends PackedArray<Matrix4> {
    public readonly data: Float32Array;

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 16; }
    public get element_count(): number { return this.data.length; }

    constructor(length: number)
    constructor(array: Float32Array)
    constructor(data: Float32Array | number) {
        super();
        if (data instanceof Float32Array) {
            if (data.length % 16 !== 0) throw new Error('<PackedMatrix4Array> constructor@array: array is not a valid PackedMatrix4Array');
            this.data = data;
        }
        else {
            this.data = new Float32Array(data * 16);
        }
    }

    public update_Data(data: Matrix4[], offset: number): void;
    public update_Data(data: Float32Array, offset: number): void;
    public update_Data(data: Matrix4, offset: number): void;
    public update_Data(data: Matrix4[] | Float32Array | Matrix4, offset: number): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix4Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 16 * this.per_element_byte_count;
            const mat4_count = single ? 1 : data.length;
            const element_count = mat4_count * 16;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<PackedMatrix4Array> update_Data: data overflow');
            float32array = new Float32Array(this.data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data.n11;
                float32array[1] = data.n21;
                float32array[2] = data.n31;
                float32array[3] = data.n41;
                float32array[4] = data.n12;
                float32array[5] = data.n22;
                float32array[6] = data.n32;
                float32array[7] = data.n42;
                float32array[8] = data.n13;
                float32array[9] = data.n23;
                float32array[10] = data.n33;
                float32array[11] = data.n43;
                float32array[12] = data.n14;
                float32array[13] = data.n24;
                float32array[14] = data.n34;
                float32array[15] = data.n44;
            }
            else {
                for (let i = 0, j = 0; i < element_count;) {
                    const mat4 = data[j++];
                    float32array[i++] = mat4.n11;
                    float32array[i++] = mat4.n21;
                    float32array[i++] = mat4.n31;
                    float32array[i++] = mat4.n41;
                    float32array[i++] = mat4.n12;
                    float32array[i++] = mat4.n22;
                    float32array[i++] = mat4.n32;
                    float32array[i++] = mat4.n42;
                    float32array[i++] = mat4.n13;
                    float32array[i++] = mat4.n23;
                    float32array[i++] = mat4.n33;
                    float32array[i++] = mat4.n43;
                    float32array[i++] = mat4.n14;
                    float32array[i++] = mat4.n24;
                    float32array[i++] = mat4.n34;
                    float32array[i++] = mat4.n44;
                }
            }
        }
    }

    public get_RenderDeviceAttributeBuffer<T extends RenderState<T>>(render_device: RenderDevice<T>, usage: RenderStateBufferUsage): RenderDeviceMatrix4AttributeBuffer<T> {
        return new RenderDeviceMatrix4AttributeBuffer(render_device, usage, this.data);
    }
}