import { bitmask_disable, bitmask_enable } from "@/system/utils/BitMask";
import type { WebGPURenderState } from "../WebGPURenderState";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export enum WebGPURenderStatePrimitiveType {
    Triangles = 'triangle-list',
    TriangleStrip = 'triangle-strip',
    LineStrip = 'line-strip',
    Lines = 'line-strip',
    Points = 'point-list',
}

export class WebGPURenderStateVertexArray extends WebGPURenderStateObjectRefCounted {

    static readonly MaxAttributeLocationCount = 20;

    public readonly primitive_type: WebGPURenderStatePrimitiveType;
    public readonly offset: number;
    public readonly count: number;

    protected attribute_buffer_refs: RefArray<WebGPURenderStateBuffer> = new RefArray(WebGPURenderStateVertexArray.MaxAttributeLocationCount);
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

    public dispose(): void {
        this.clear_Buffers();
        this.clear_Index();
        this.render_state.delete_VertexArray(this);
    }
}