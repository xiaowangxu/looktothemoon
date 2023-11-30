import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderStateDataType, type RenderState, RenderStateBufferType, RenderStateBufferUsage } from "../RenderState";
import type { RenderStateBuffer, RenderStateBufferView } from "../render_state_objects/RenderStateBuffer";
import type { RenderDevice } from "../RenderDevice";
import type { Vector3 } from "@/system/math/linear_algebra/Vector3";
import type { Vector2 } from "@/system/math/linear_algebra/Vector2";
import type { RenderStateVertexArray } from "../render_state_objects/RenderStateVertexArray";
import type { Matrix4 } from "@/system/math/linear_algebra/Matrix4";

export abstract class RenderDeviceAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceObject<T>
{
    protected readonly buffer_ref: Ref<Buffer> = new Ref();

    public readonly per_instance_count: number;

    public get buffer() { return this.buffer_ref.expect; }

    public abstract get data_type(): RenderStateDataType;
    public abstract get element_byte_count(): number;
    public abstract get element_count(): number;
    public get byte_count() { return this.element_count * this.element_byte_count };

    constructor(render_device: RenderDevice<T>, per_instance_count: number = 0) {
        super(render_device);
        this.per_instance_count = per_instance_count;
    }

    public abstract set_Data(data: any[]): void;

    public abstract update_Data(data: any[], offset: number): void;

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

export class RenderDeviceVector2AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer>
{
    public get element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Vector2[], per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 2, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.set_Data(data);
    }

    public set_Data(data: Vector2[]): void {
        const vec2_count = data.length;
        const element_count = vec2_count * 2;
        this._element_count = element_count;
        const float32array = new Float32Array(element_count);
        for (let i = 0, j = 0; i < element_count;) {
            const vec2 = data[j++];
            float32array[i++] = vec2.x;
            float32array[i++] = vec2.y;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, float32array);
    }

    public update_Data(data: Vector2[], offset: number): void {
        const offset_bytes = offset * 2 * this.element_byte_count;
        const element_count = data.length * 2;
        const element_bytes = element_count * this.element_byte_count;
        if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector2AttributeBuffer> update_Data: data overflow');
        const float32array = new Float32Array(element_count);
        for (let i = 0, j = 0; i < element_count;) {
            const vec2 = data[j++];
            float32array[i++] = vec2.x;
            float32array[i++] = vec2.y;
        }
        this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }
}

export class RenderDeviceVector3AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer>
{
    public get element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Vector3[], per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 3, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        if (data !== undefined) this.set_Data(data);
    }

    public set_Data(data: Vector3[]): void {
        const vec3_count = data.length;
        const element_count = vec3_count * 3;
        this._element_count = element_count;
        const float32array = new Float32Array(element_count);
        for (let i = 0, j = 0; i < element_count;) {
            const vec3 = data[j++];
            float32array[i++] = vec3.x;
            float32array[i++] = vec3.y;
            float32array[i++] = vec3.z;
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, float32array);
    }

    public update_Data(data: Vector3[], offset: number): void {
        const offset_bytes = offset * 3 * this.element_byte_count;
        const element_count = data.length * 3;
        const element_bytes = element_count * this.element_byte_count;
        if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceVector3AttributeBuffer> update_Data: data overflow');
        const float32array = new Float32Array(element_count);
        for (let i = 0, j = 0; i < element_count;) {
            const vec3 = data[j++];
            float32array[i++] = vec3.x;
            float32array[i++] = vec3.y;
            float32array[i++] = vec3.z;
        }
        this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
    }
}

export class RenderDeviceIndexAttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer>
{
    public get element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.UnsignedInt; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: number[]) {
        super(render_device);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Index, usage, 1, RenderStateDataType.UnsignedInt, false, 0).expect() as Buffer;
        if (data !== undefined) this.set_Data(data);
    }

    public set_Data(data: number[]): void {
        const element_count = data.length;
        this._element_count = element_count;
        const uint32array = new Uint32Array(data);
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, uint32array);
    }

    public update_Data(data: number[], offset: number): void {
        const offset_bytes = offset * this.element_byte_count;
        const element_count = data.length;
        const element_bytes = element_count * this.element_byte_count;
        if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceIndexAttributeBuffer> update_Data: data overflow');
        const uint32array = new Uint32Array(data);
        this.render_state.update_Buffer(this.buffer_ref.expect, uint32array, offset_bytes);
    }
}

export class RenderDeviceMatrix4AttributeBuffer<T extends RenderState<T>, Buffer extends RenderStateBuffer<T> = RenderStateBuffer<T>>
    extends RenderDeviceAttributeBuffer<T, Buffer>
{
    private readonly buffer_slice_row_0: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_1: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_2: Ref<RenderStateBufferView<T>> = new Ref();
    private readonly buffer_slice_row_3: Ref<RenderStateBufferView<T>> = new Ref();

    public get element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }

    public get data_type(): RenderStateDataType { return RenderStateDataType.Float; }
    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, usage: RenderStateBufferUsage, data?: Matrix4[], per_instance_count: number = 0) {
        super(render_device, per_instance_count);
        const buffer = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 16, RenderStateDataType.Float, false, this.per_instance_count).expect() as Buffer;
        this.buffer_ref.value = buffer;
        const byte_per_row = 4 * this.element_byte_count;
        const byte_per_matrix = 4 * byte_per_row;
        this.buffer_slice_row_0.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 0 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_1.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 1 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_2.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 2 * byte_per_row, this.per_instance_count).expect();
        this.buffer_slice_row_3.value = this.render_state.create_BufferView(buffer, 4, byte_per_matrix, 3 * byte_per_row, this.per_instance_count).expect();
        if (data !== undefined) this.set_Data(data);
    }

    public set_Data(data: Matrix4[]): void {
        const mat4_count = data.length;
        const element_count = mat4_count * 16;
        this._element_count = element_count;
        const float32array = new Float32Array(element_count);
        for (let j = 0; j < mat4_count; j++) {
            const mat4 = data[j];
            float32array.set(mat4.typed_transposed_array_f32, j * 16);
        }
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, float32array);
    }

    public update_Data(data: Matrix4[], offset: number): void {
        const offset_bytes = offset * 16 * this.element_byte_count;
        const mat4_count = data.length;
        const element_count = mat4_count * 16;
        const element_bytes = element_count * this.element_byte_count;
        if (offset_bytes + element_bytes > this.byte_count) throw new Error('<RenderDeviceMatrix4AttributeBuffer> update_Data: data overflow');
        const float32array = new Float32Array(element_count);
        for (let j = 0; j < mat4_count; j++) {
            const mat4 = data[j];
            float32array.set(mat4.typed_transposed_array_f32, j * 16);
        }
        this.render_state.update_Buffer(this.buffer_ref.expect, float32array, offset_bytes);
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

    public dispose(): void {
        this.buffer_slice_row_0.clear();
        this.buffer_slice_row_1.clear();
        this.buffer_slice_row_2.clear();
        this.buffer_slice_row_3.clear();
        super.dispose();
    }
}