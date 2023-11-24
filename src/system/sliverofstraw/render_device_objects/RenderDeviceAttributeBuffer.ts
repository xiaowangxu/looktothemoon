import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderStateDataType, type RenderState, RenderStateBufferType, RenderStateBufferUsage } from "../RenderState";
import type { RenderStateBuffer } from "../render_state_objects/RenderStateBuffer";
import type { RenderDevice } from "../RenderDevice";
import type { Vector3 } from "@/system/math/linear_algebra/Vector3";

export abstract class RenderDeviceAttributeBuffer<T extends RenderState<T>> extends RenderDeviceObject<T> {
    protected readonly buffer_ref: Ref<RenderStateBuffer<T>> = new Ref();

    public get buffer() { return this.buffer_ref.expect; }

    public abstract get element_byte_count(): number;
    public abstract get element_count(): number;
    public get byte_count() { return this.element_count * this.element_byte_count };

    constructor(render_device: RenderDevice<T>) {
        super(render_device);
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceAttributeBuffer>");
        this.buffer_ref.clear();
    }
}

export class RenderDeviceVector3AttributeBuffer<T extends RenderState<T>> extends RenderDeviceAttributeBuffer<T>{
    public get element_byte_count(): number { return Float32Array.BYTES_PER_ELEMENT; }

    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, array: Vector3[], usage: RenderStateBufferUsage) {
        super(render_device);
        const vec3_count = array.length;
        const element_count = vec3_count * 3;
        this._element_count = element_count;
        const float32array = new Float32Array(element_count);
        for (let i = 0, j = 0; i < element_count;) {
            const vec3 = array[j++];
            float32array[i++] = vec3.x;
            float32array[i++] = vec3.y;
            float32array[i++] = vec3.z;
        }
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Array, usage, 3, RenderStateDataType.Float, false, 0).expect();
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, float32array);
    }
}

export class RenderDeviceIndexAttributeBuffer<T extends RenderState<T>> extends RenderDeviceAttributeBuffer<T>{
    public get element_byte_count(): number { return Uint32Array.BYTES_PER_ELEMENT; }

    private _element_count: number = 0;
    public get element_count(): number { return this._element_count; }

    constructor(render_device: RenderDevice<T>, array: number[], usage: RenderStateBufferUsage) {
        super(render_device);
        const element_count = array.length;
        this._element_count = element_count;
        const uint32array = new Uint32Array(array);
        this.buffer_ref.value = this.render_state.create_Buffer(RenderStateBufferType.Index, usage, 1, RenderStateDataType.UnsignedInt, false, 0).expect();
        this.render_state.alloc_Buffer(this.buffer_ref.expect, this.byte_count, uint32array);
    }
}