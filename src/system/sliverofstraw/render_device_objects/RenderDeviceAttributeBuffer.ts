import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderStateDataType, type RenderState, RenderStateBufferType, RenderStateBufferUsage } from "../RenderState";
import type { RenderStateBuffer, RenderStateBufferView } from "../render_state_objects/RenderStateBuffer";
import type { RenderDevice } from "../RenderDevice";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { RenderStateVertexArray } from "../render_state_objects/RenderStateVertexArray";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { PackedVector2Array, type PackedArray, PackedVector3Array, PackedVector4Array, PackedMatrix4Array, PackedIndexArray, PackedMatrix3Array, PackedFloatArray, PackedIntArray, PackedUintArray } from "@/system/engine/classes/value_wrappers/PackedArray";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Out } from "@/system/utils/Type";

export abstract class RenderDeviceAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>, Data = any>
    extends RenderDeviceObject<T> {
    protected readonly buffer_ref: Ref<Buffer | RenderStateBufferView<T, Buffer>> = new Ref();

    public readonly per_instance_count: number;

    public get buffer() { return this.buffer_ref.expect; }

    public abstract get data_type(): RenderStateDataType;
    public abstract get per_item_element_count(): number;
    public abstract get per_element_byte_count(): number;
    public abstract get element_count(): number;
    public get item_count() { return this.element_count / this.per_item_element_count; }
    public get byte_count() { return this.data.byteLength };

    public abstract get data(): ArrayBufferView;

    constructor(render_device: RenderDevice<T>, per_instance_count: number = 0) {
        super(render_device);
        this.per_instance_count = per_instance_count;
    }

    public abstract alloc_Data(data: Data[]): void;
    public abstract alloc_Data(data: ArrayBufferView): void;
    public abstract alloc_Data(count: number): void;
    public abstract alloc_Data(data: Data[] | ArrayBufferView | number): void;

    public abstract update_Data(data: Data, offset: number, commit?: boolean): void;
    public abstract update_Data(data: ArrayBufferView, offset: number, commit?: boolean): void;
    public abstract update_Data(data: Data[], offset: number, commit?: boolean): void;
    public abstract update_Data(data: Data[] | ArrayBufferView | Data, offset: number, commit?: boolean): void;

    public commit_Data(): void;
    public commit_Data(offset: number, lenght?: number): void;
    public commit_Data(offset?: number, lenght?: number): void {
        if (offset === undefined || lenght === undefined) {
            this.render_state.update_Buffer(this.buffer_ref.expect, this.data, 0);
        }
        else {
            this.render_state.update_Buffer(this.buffer_ref.expect, this.data, offset, offset, lenght);
        }
    }

    public abstract get_Data(idx: number, target: Data | undefined): Data;

    public abstract get_PackedArray(): PackedArray;

    public bound_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number) {
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location, this.buffer);
    }

    public toggle_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enable: boolean) {
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location, enable);
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceAttributeBuffer>");
        this.buffer_ref.clear();
    }
}

export class RenderDeviceAttributeBufferView<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>, Data = any, AttriBuffer extends RenderDeviceAttributeBuffer<T, Buffer, Data> = RenderDeviceAttributeBuffer<T, Buffer, Data>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Data> {
    protected readonly attribute_buffer_ref: Ref<AttriBuffer> = new Ref();

    protected get attribute_buffer() { return this.attribute_buffer_ref.expect; }

    public get data_type(): RenderStateDataType { return this.attribute_buffer.data_type; }
    public get per_element_byte_count(): number { return this.attribute_buffer.per_element_byte_count; }
    public get per_item_element_count(): number { return this.attribute_buffer.per_item_element_count; }

    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    public get data(): ArrayBufferView { throw new Error('<RenderDeviceAttributeBufferView> data: can not get data of an buffer view'); }

    constructor(render_device: RenderDevice<T>, attribute_buffer: AttriBuffer, stride_count: number, offset_count: number) {
        super(render_device, attribute_buffer.per_instance_count);
        this.attribute_buffer_ref.value = attribute_buffer;
        const stride_in_bytes = stride_count * attribute_buffer.per_item_element_count * attribute_buffer.per_element_byte_count;
        const offset_in_bytes = offset_count * attribute_buffer.per_item_element_count * attribute_buffer.per_element_byte_count;
        this._element_count = Math.ceil((attribute_buffer.item_count - offset_count) / Math.max(1.0, stride_count));
        this.buffer_ref.value = this.render_state.create_BufferView(attribute_buffer.buffer, attribute_buffer.per_item_element_count, stride_in_bytes, offset_in_bytes, this.per_instance_count).expect() as RenderStateBufferView<T, Buffer>;
    }

    public alloc_Data(data: Data[]): void;
    public alloc_Data(data: ArrayBufferView): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Data[] | ArrayBufferView | number): void {
        throw new Error('<RenderDeviceAttributeBufferView> alloc_Data: can not alloc data from a attribute buffer view');
    }

    public update_Data(data: Data, offset: number, commit?: boolean): void;
    public update_Data(data: ArrayBufferView, offset: number, commit?: boolean): void;
    public update_Data(data: Data[], offset: number, commit?: boolean): void;
    public update_Data(data: Data[] | ArrayBufferView | Data, offset: number, commit: boolean = true): void {
        throw new Error('<RenderDeviceAttributeBufferView> update_Data: can not update data from a attribute buffer view');
    }

    public get_Data(idx: number, target: Data): Data {
        throw new Error('<RenderDeviceAttributeBufferView> get_Data: can not get data from a attribute buffer view');
    }

    public get_PackedArray(): PackedArray {
        throw new Error('<RenderDeviceAttributeBufferView> get_PackedArray: can not get packed array from a attribute buffer view');
    }

    public dispose(): void {
        this.attribute_buffer_ref.clear();
        super.dispose();
    }
}

export class RenderDeviceVector2AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Vector2> {
    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 2; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Vector2[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 2, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: Vector2[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Vector2[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            if (data.length % 2 !== 0) throw new Error('<RenderDeviceVector2AttributeBuffer> alloc_Data@Float32Array: data is not valid Vector2 array');
            this._element_count = data.length / 2;
            this._data = data;
        }
        else {
            const vec2_count = is_count ? data : data.length;
            const element_count = vec2_count * 2;
            this._element_count = element_count;
            const float32array = new Float32Array(element_count);
            if (!is_count) {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec2 = data[j++];
                    float32array[i++] = vec2.x;
                    float32array[i++] = vec2.y;
                }
            }
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: Vector2[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: Vector2, offset: number, commit?: boolean): void;
    public update_Data(data: Vector2[] | Float32Array | Vector2, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector2AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 2 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 2;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector2AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
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
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: Vector2): Vector2 {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceVector2AttributeBuffer> get_Data: index out of bound');
        const base = idx * this.per_item_element_count;
        const x = this._data[base];
        const y = this._data[base + 1];
        target.set(x, y);
        return target;
    }

    public get_PackedArray(): PackedArray {
        return new PackedVector2Array(this.data);
    }
}

export class RenderDeviceVector3AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Vector3> {
    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 3; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Vector3[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 3, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: Vector3[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Vector3[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            if (data.length % 3 !== 0) throw new Error('<RenderDeviceVector2AttributeBuffer> alloc_Data@Float32Array: data is not valid Vector3 array');
            this._element_count = data.length / 3;
            this._data = data;
        }
        else {
            const vec3_count = is_count ? data : data.length;
            const element_count = vec3_count * 3;
            this._element_count = element_count;
            const float32array = new Float32Array(element_count);
            if (!is_count) {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec3 = data[j++];
                    float32array[i++] = vec3.x;
                    float32array[i++] = vec3.y;
                    float32array[i++] = vec3.z;
                }
            }
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: Vector3[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: Vector3, offset: number, commit?: boolean): void;
    public update_Data(data: Vector3[] | Float32Array | Vector3, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector3AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 3 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 3;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector3AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
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
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: Vector3): Vector3 {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceVector3AttributeBuffer> get_Data: index out of bound');
        const base = idx * this.per_item_element_count;
        const x = this._data[base];
        const y = this._data[base + 1];
        const z = this._data[base + 2];
        target.set(x, y, z);
        return target;
    }

    public get_PackedArray(): PackedArray {
        return new PackedVector3Array(this.data);
    }
}

export class RenderDeviceVector4AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Vector4> {
    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 4; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Vector4[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 4, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: Vector4[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Vector4[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            if (data.length % 4 !== 0) throw new Error('<RenderDeviceVector2AttributeBuffer> alloc_Data@Float32Array: data is not valid Vector4 array');
            this._element_count = data.length / 4;
            this._data = data;
        }
        else {
            const vec4_count = is_count ? data : data.length;
            const element_count = vec4_count * 4;
            this._element_count = element_count;
            const float32array = new Float32Array(element_count);
            if (!is_count) {
                for (let i = 0, j = 0; i < element_count;) {
                    const vec4 = data[j++];
                    float32array[i++] = vec4.x;
                    float32array[i++] = vec4.y;
                    float32array[i++] = vec4.z;
                    float32array[i++] = vec4.w;
                }
            }
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: Vector4[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: Vector4, offset: number, commit?: boolean): void;
    public update_Data(data: Vector4[] | Float32Array | Vector4, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector4AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 4 * this.per_element_byte_count;
            const element_count = (single ? 1 : data.length) * 4;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector4AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
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
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: Vector4): Vector4 {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceVector4AttributeBuffer> get_Data: index out of bound');
        const base = idx * this.per_item_element_count;
        const x = this._data[base];
        const y = this._data[base + 1];
        const z = this._data[base + 2];
        const w = this._data[base + 3];
        target.set(x, y, z, w);
        return target;
    }

    public get_PackedArray(): PackedArray {
        return new PackedVector4Array(this.data);
    }
}

export class RenderDeviceIndexAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, number> {
    public get per_element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.UnsignedInt; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Uint32Array = new Uint32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: number[] | Uint32Array | number) {
        super(render_device, 0);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Index, usage, 1, RenderStateDataType.UnsignedInt, false, 0).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: number[]): void;
    public alloc_Data(data: Uint32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: number[] | Uint32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Uint32Array) {
            this._element_count = data.length;
            this._data = data;
        }
        else {
            const element_count = is_count ? data : data.length;
            this._element_count = element_count;
            const uint32array = is_count ? new Uint32Array(element_count) : new Uint32Array(data);
            this._data = uint32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: number[], offset: number, commit?: boolean): void;
    public update_Data(data: Uint32Array, offset: number, commit?: boolean): void;
    public update_Data(data: number, offset: number, commit?: boolean): void;
    public update_Data(data: number[] | Uint32Array | number, offset: number, commit: boolean = true): void {
        let uint32array: Uint32Array;
        let offset_bytes: number;
        if (data instanceof Uint32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceIndexAttributeBuffer> update_Data: data overflow');
            uint32array = new Uint32Array(this._data.buffer, offset_bytes, data.length);
            uint32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceIndexAttributeBuffer> update_Data: data overflow');
            uint32array = new Uint32Array(this._data.buffer, offset_bytes, element_count);
            if (single) {
                uint32array[0] = data;
            }
            else {
                uint32array.set(data);
            }
        }
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, uint32array, offset_bytes);
    }

    public get_Data(idx: number, target: undefined = undefined): number {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceIndexAttributeBuffer> get_Data: index out of bound');
        return this._data[idx];
    }

    public get_PackedArray(): PackedArray {
        return new PackedIndexArray(this.data);
    }
}

export class RenderDeviceUintAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, number> {
    public get per_element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.UnsignedInt; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Uint32Array = new Uint32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: number[] | Uint32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 1, RenderStateDataType.UnsignedInt, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: number[]): void;
    public alloc_Data(data: Uint32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: number[] | Uint32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Uint32Array) {
            this._element_count = data.length;
            this._data = data;
        }
        else {
            const element_count = is_count ? data : data.length;
            this._element_count = element_count;
            const uint32array = is_count ? new Uint32Array(element_count) : new Uint32Array(data);
            this._data = uint32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: number[], offset: number, commit?: boolean): void;
    public update_Data(data: Uint32Array, offset: number, commit?: boolean): void;
    public update_Data(data: number, offset: number, commit?: boolean): void;
    public update_Data(data: number[] | Uint32Array | number, offset: number, commit: boolean = true): void {
        let uint32array: Uint32Array;
        let offset_bytes: number;
        if (data instanceof Uint32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceUintAttributeBuffer> update_Data: data overflow');
            uint32array = new Uint32Array(this._data.buffer, offset_bytes, data.length);
            uint32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceUintAttributeBuffer> update_Data: data overflow');
            uint32array = new Uint32Array(this._data.buffer, offset_bytes, element_count);
            if (single) {
                uint32array[0] = data;
            }
            else {
                uint32array.set(data);
            }
        }
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, uint32array, offset_bytes);
    }

    public get_Data(idx: number, target: undefined = undefined): number {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceUintAttributeBuffer> get_Data: index out of bound');
        return this._data[idx];
    }

    public get_PackedArray(): PackedArray {
        return new PackedUintArray(this.data);
    }
}

export class RenderDeviceIntAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, number> {
    public get per_element_byte_count(): number { return Int32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Int; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Int32Array = new Int32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: number[] | Int32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 1, RenderStateDataType.Int, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: number[]): void;
    public alloc_Data(data: Int32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: number[] | Int32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Int32Array) {
            this._element_count = data.length;
            this._data = data;
        }
        else {
            const element_count = is_count ? data : data.length;
            this._element_count = element_count;
            const int32array = is_count ? new Int32Array(element_count) : new Int32Array(data);
            this._data = int32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: number[], offset: number, commit?: boolean): void;
    public update_Data(data: Int32Array, offset: number, commit?: boolean): void;
    public update_Data(data: number, offset: number, commit?: boolean): void;
    public update_Data(data: number[] | Int32Array | number, offset: number, commit: boolean = true): void {
        let int32array: Int32Array;
        let offset_bytes: number;
        if (data instanceof Int32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceIntAttributeBuffer> update_Data: data overflow');
            int32array = new Int32Array(this._data.buffer, offset_bytes, data.length);
            int32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceIntAttributeBuffer> update_Data: data overflow');
            int32array = new Int32Array(this._data.buffer, offset_bytes, element_count);
            if (single) {
                int32array[0] = data;
            }
            else {
                int32array.set(data);
            }
        }
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, int32array, offset_bytes);
    }

    public get_Data(idx: number, target: undefined = undefined): number {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceIntAttributeBuffer> get_Data: index out of bound');
        return this._data[idx];
    }

    public get_PackedArray(): PackedArray {
        return new PackedIntArray(this.data);
    }
}

export class RenderDeviceFloatAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, number> {
    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 1; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: number[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 1, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: number[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: number[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            this._element_count = data.length;
            this._data = data;
        }
        else {
            const element_count = is_count ? data : data.length;
            this._element_count = element_count;
            const float32array = is_count ? new Float32Array(element_count) : new Float32Array(data);
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: number[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: number, offset: number, commit?: boolean): void;
    public update_Data(data: number[] | Float32Array | number, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceFloatAttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * this.per_element_byte_count;
            const element_count = single ? 1 : data.length;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceFloatAttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
            if (single) {
                float32array[0] = data;
            }
            else {
                float32array.set(data);
            }
        }
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: undefined = undefined): number {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceFloatAttributeBuffer> get_Data: index out of bound');
        return this._data[idx];
    }

    public get_PackedArray(): PackedArray {
        return new PackedFloatArray(this.data);
    }
}

export class RenderDeviceMatrix3AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Matrix3> {
    private readonly buffer_slice_row_0: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_1: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_2: Ref<RenderStateBufferView<T>> = new Ref();

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 9; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Matrix3[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        const buffer = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 9, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        this.buffer_ref.value = buffer;
        const byte_per_row = 3 * this.per_element_byte_count;
        const byte_per_matrix = 3 * byte_per_row;
        this.buffer_slice_row_0.value = this.render_state.create_BufferView(buffer, 3, byte_per_matrix, 0 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_1.value = this.render_state.create_BufferView(buffer, 3, byte_per_matrix, 1 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_2.value = this.render_state.create_BufferView(buffer, 3, byte_per_matrix, 2 * byte_per_row, this.per_instance_count).expect();
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: Matrix3[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Matrix3[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            if (data.length % 9 !== 0) throw new Error('<RenderDeviceVector2AttributeBuffer> alloc_Data@Float32Array: data is not valid Matrix3 array');
            this._element_count = data.length / 9;
            this._data = data;
        }
        else {
            const mat3_count = is_count ? data : data.length;
            const element_count = mat3_count * 9;
            this._element_count = element_count;
            const float32array = new Float32Array(element_count);
            if (!is_count) {
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
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: Matrix3[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: Matrix3, offset: number, commit?: boolean): void;
    public update_Data(data: Matrix3[] | Float32Array | Matrix3, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceMatrix3AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 9 * this.per_element_byte_count;
            const mat3_count = single ? 1 : data.length;
            const element_count = mat3_count * 9;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceMatrix3AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
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
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: Matrix3): Matrix3 {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceMatrix3AttributeBuffer> get_Data: index out of bound');
        const base = idx * this.per_item_element_count;
        const n11 = this._data[base];
        const n21 = this._data[base + 1];
        const n31 = this._data[base + 2];
        const n12 = this._data[base + 3];
        const n22 = this._data[base + 4];
        const n32 = this._data[base + 5];
        const n13 = this._data[base + 6];
        const n23 = this._data[base + 7];
        const n33 = this._data[base + 8];
        target.set(
            n11, n12, n13,
            n21, n22, n23,
            n31, n32, n33,
        );
        return target;
    }

    public bound_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number): void {
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 0, this.buffer_slice_row_0.expect);
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 1, this.buffer_slice_row_1.expect);
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 2, this.buffer_slice_row_2.expect);
    }

    public toggle_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enable: boolean): void {
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 0, enable);
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 1, enable);
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 2, enable);
    }

    public get_PackedArray(): PackedArray {
        return new PackedMatrix3Array(this.data);
    }

    public dispose(): void {
        this.buffer_slice_row_0.clear();
        this.buffer_slice_row_1.clear();
        this.buffer_slice_row_2.clear();
        super.dispose();
    }
}

export class RenderDeviceMatrix4AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer, Matrix4> {
    private readonly buffer_slice_row_0: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_1: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_2: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_3: Ref<RenderStateBufferView<T>> = new Ref();

    public get per_element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }
    public get per_item_element_count(): number { return 16; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    private _data: Float32Array = new Float32Array(0);
    public get data() { return this._data; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Matrix4[] | Float32Array | number, per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        const buffer = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 16, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        this.buffer_ref.value = buffer;
        const byte_per_row = 4 * this.per_element_byte_count;
        const byte_per_matrix = 4 * byte_per_row;
        this.buffer_slice_row_0.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 0 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_1.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 1 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_2.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 2 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_3.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 3 * byte_per_row, this.per_instance_count).expect();
        if (data !== undefined) this.alloc_Data(data as any);
    }

    public alloc_Data(data: Matrix4[]): void;
    public alloc_Data(data: Float32Array): void;
    public alloc_Data(count: number): void;
    public alloc_Data(data: Matrix4[] | Float32Array | number): void {
        const is_count = typeof data === 'number';
        if (data instanceof Float32Array) {
            if (data.length % 16 !== 0) throw new Error('<RenderDeviceVector2AttributeBuffer> alloc_Data@Float32Array: data is not valid Matrix4 array');
            this._element_count = data.length / 16;
            this._data = data;
        }
        else {
            const mat4_count = is_count ? data : data.length;
            const element_count = mat4_count * 16;
            this._element_count = element_count;
            const float32array = new Float32Array(element_count);
            if (!is_count) {
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
            this._data = float32array;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, is_count ? undefined : this._data);
    }

    public update_Data(data: Matrix4[], offset: number, commit?: boolean): void;
    public update_Data(data: Float32Array, offset: number, commit?: boolean): void;
    public update_Data(data: Matrix4, offset: number, commit?: boolean): void;
    public update_Data(data: Matrix4[] | Float32Array | Matrix4, offset: number, commit: boolean = true): void {
        let float32array: Float32Array;
        let offset_bytes: number;
        if (data instanceof Float32Array) {
            offset_bytes = offset * this.per_element_byte_count;
            const element_bytes = data.byteLength;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceMatrix4AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, data.length);
            float32array.set(data);
        }
        else {
            const single = !(data instanceof Array);
            offset_bytes = offset * 16 * this.per_element_byte_count;
            const mat4_count = single ? 1 : data.length;
            const element_count = mat4_count * 16;
            const element_bytes = element_count * this.per_element_byte_count;
            if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceMatrix4AttributeBuffer> update_Data: data overflow');
            float32array = new Float32Array(this._data.buffer, offset_bytes, element_count);
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
        if (commit) this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }

    public get_Data(idx: number, target: Matrix4): Matrix4 {
        if (idx < 0 || idx >= this.item_count) throw new Error('<RenderDeviceMatrix4AttributeBuffer> get_Data: index out of bound');
        const base = idx * this.per_item_element_count;
        const n11 = this._data[base];
        const n21 = this._data[base + 1];
        const n31 = this._data[base + 2];
        const n41 = this._data[base + 3];
        const n12 = this._data[base + 4];
        const n22 = this._data[base + 5];
        const n32 = this._data[base + 6];
        const n42 = this._data[base + 7];
        const n13 = this._data[base + 8];
        const n23 = this._data[base + 9];
        const n33 = this._data[base + 10];
        const n43 = this._data[base + 11];
        const n14 = this._data[base + 12];
        const n24 = this._data[base + 13];
        const n34 = this._data[base + 14];
        const n44 = this._data[base + 15];
        target.set(
            n11, n12, n13, n14,
            n21, n22, n23, n24,
            n31, n32, n33, n34,
            n41, n42, n43, n44,
        );
        return target;
    }

    public bound_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number): void {
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 0, this.buffer_slice_row_0.expect);
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 1, this.buffer_slice_row_1.expect);
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 2, this.buffer_slice_row_2.expect);
        this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location + 3, this.buffer_slice_row_3.expect);
    }

    public toggle_VertexArray(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enable: boolean): void {
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 0, enable);
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 1, enable);
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 2, enable);
        this.render_state.toggle_VertexArrayAttribute(vertex_array, attribute_location + 3, enable);
    }

    public get_PackedArray(): PackedArray {
        return new PackedMatrix4Array(this.data);
    }

    public dispose(): void {
        this.buffer_slice_row_0.clear();
        this.buffer_slice_row_1.clear();
        this.buffer_slice_row_2.clear();
        this.buffer_slice_row_3.clear();
        super.dispose();
    }
}