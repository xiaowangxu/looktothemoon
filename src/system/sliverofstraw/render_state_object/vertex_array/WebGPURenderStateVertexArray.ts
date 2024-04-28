import { bitmask_disable, bitmask_enable } from "@/system/utils/BitMask";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";

export enum WebGPURenderStatePrimitiveType {
    Triangles,
    TriangleStrip,
    LineStrip,
    Lines,
    Points,
}

export class WebGPURenderStateVertexArray extends WebGPURenderObjectRefCounted {

    static readonly MaxAttributeLocationCount = 20;
    public readonly primitive_type: WebGPURenderStatePrimitiveType;

    public readonly offset: number;
    public readonly count: number;

    protected attribute_buffer_refs: RefArray<WebGPURenderStateBuffer> = new RefArray(WebGPURenderStateVertexArray.MaxAttributeLocationCount);
    protected index_buffer_ref: Ref<WebGPURenderStateBuffer> = new Ref();

    public get is_indexed(): boolean {
        return !this.index_buffer_ref.is_empty;
    }

    protected _attribute_location_bitmask = 0x00000000;
    public get attribute_location_bitmask() { return this._attribute_location_bitmask; }

    protected enable_AttributeLocationBit(location: number) {
        this._attribute_location_bitmask = bitmask_enable(this._attribute_location_bitmask, location);
    }

    protected disable_AttributeLocationBit(location: number) {
        this._attribute_location_bitmask = bitmask_disable(this._attribute_location_bitmask, location);
    }

    protected clear_AttributeLocationBits() {
        this._attribute_location_bitmask = 0x00000000;
    }

    constructor(render_state: WebGPURenderState, primitive_type: WebGPURenderStatePrimitiveType, offset: number, count: number) {
        super(render_state);
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.count = count;
    }

    public set_Buffer(location: number, buffer: WebGPURenderStateBuffer): void {
        if (location < 0 || location >= WebGPURenderStateVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, buffer);
        this.enable_AttributeLocationBit(location);
    }

    public clear_Buffer(location: number): void {
        if (location < 0 || location >= WebGPURenderStateVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, undefined);
        this.disable_AttributeLocationBit(location);
    }

    public clear_Buffers(): void {
        this.attribute_buffer_refs.clear();
        this.clear_AttributeLocationBits();
    }

    public set_Index(buffer: WebGPURenderStateBuffer): void {
        this.index_buffer_ref.value = buffer;
    }

    public clear_Index(): void {
        this.index_buffer_ref.value = undefined;
    }

    public bind_Buffers(pass: GPURenderPassEncoder) {
        let i = 0;
        for (const buffer of this.attribute_buffer_refs) {
            if (buffer !== undefined) {
                pass.setVertexBuffer(i++, buffer.buffer);
            }
        }
        if (this.is_indexed) {
            pass.setIndexBuffer(this.index_buffer_ref.expect.buffer, 'uint32');
        }
    }

    public draw(pass: GPURenderPassEncoder, instance_count: number = 1, instance_offset: number = 0) {
        if (this.is_indexed) {
            pass.drawIndexed(this.count, instance_count, undefined, undefined, instance_offset);
        }
        else {
            pass.draw(this.count, instance_count, undefined, instance_offset);
        }
    }

    public dispose(): void {
        this.clear_Buffers();
        this.clear_Index();
        this.render_state.delete_VertexArray(this);
    }
}