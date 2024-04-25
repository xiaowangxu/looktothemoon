import { bitmask, bitmask_disable, bitmask_enable } from "@/system/utils/BitMask";
import { RenderStatePrimitiveType, RenderStateVertexArray } from "../../render_state/vertex_array/RenderStateVertexArray";
import type { WebGPURenderState } from "../WebGPURenderState";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";

export class WebGPURenderStateVertexArray extends RenderStateVertexArray<WebGPURenderState> {

    protected attribute_buffer_refs: RefArray<WebGPURenderStateBuffer> = new RefArray(RenderStateVertexArray.MaxAttributeLocationCount);
    protected index_buffer_ref: Ref<WebGPURenderStateBuffer> = new Ref();

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

    public get is_indexed(): boolean {
        return !this.index_buffer_ref.is_empty;
    }

    constructor(render_state: WebGPURenderState, primitive_type: RenderStatePrimitiveType, offset: number, count: number) {
        super(render_state, primitive_type, offset, count);
    }

    public set_Buffer(location: number, buffer: WebGPURenderStateBuffer): void {
        if (location < 0 || location >= RenderStateVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, buffer);
        this.enable_AttributeLocationBit(location);
    }

    public clear_Buffer(location: number): void {
        if (location < 0 || location >= RenderStateVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
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

    public dispose(): void {
        super.dispose();
    }
}