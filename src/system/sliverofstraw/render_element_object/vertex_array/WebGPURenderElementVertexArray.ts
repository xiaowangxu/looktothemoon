import { bitmask_disable, bitmask_enable } from "@/system/utils/BitMask";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderStateBuffer } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderElementRenderPipelineCacheHash } from "../pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderStateBufferView } from "../../render_state_object/buffer/WebGPURenderStateBufferView";
import type { WebGPURenderStatePrimitiveType } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";

export type WebGPURenderElementVertexArrayBuffer = WebGPURenderStateBuffer | WebGPURenderStateBufferView;

export class WebGPURenderElementVertexArray extends WebGPURenderObjectRefCounted {

    static readonly MaxAttributeLocationCount = 8;

    public primitive_type: WebGPURenderStatePrimitiveType;
    public offset: number;
    public length: number;
    
    protected attribute_buffer_refs: RefArray<WebGPURenderElementVertexArrayBuffer> = new RefArray(WebGPURenderElementVertexArray.MaxAttributeLocationCount);
    protected index_buffer_ref: Ref<WebGPURenderElementVertexArrayBuffer> = new Ref();

    public get is_indexed(): boolean {
        return !this.index_buffer_ref.is_empty;
    }

    protected _attribute_bitmask: WebGPURenderElementRenderPipelineCacheHash = 0;
    public get attribute_bitmask(): WebGPURenderElementRenderPipelineCacheHash { return this._attribute_bitmask; }

    protected enable_AttributeLocationBit(location: number) {
        this._attribute_bitmask = bitmask_enable(this._attribute_bitmask, location);
    }

    protected disable_AttributeLocationBit(location: number) {
        this._attribute_bitmask = bitmask_disable(this._attribute_bitmask, location);
    }

    protected clear_AttributeLocationBits() {
        this._attribute_bitmask = 0x00000000;
    }

    constructor(render_state: WebGPURenderState, primitive_type: WebGPURenderStatePrimitiveType, offset: number, length: number) {
        super(render_state);
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.length = length;
    }

    public set_Buffer(location: number, buffer: WebGPURenderElementVertexArrayBuffer): void {
        if (location < 0 || location >= WebGPURenderElementVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, buffer);
        this.enable_AttributeLocationBit(location);
    }

    public clear_Buffer(location: number): void {
        if (location < 0 || location >= WebGPURenderElementVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, undefined);
        this.disable_AttributeLocationBit(location);
    }

    public clear_Buffers(): void {
        this.attribute_buffer_refs.clear();
        this.clear_AttributeLocationBits();
    }

    public set_Index(buffer: WebGPURenderElementVertexArrayBuffer): void {
        this.index_buffer_ref.value = buffer;
    }

    public clear_Index(): void {
        this.index_buffer_ref.value = undefined;
    }

    public bind_Buffers(pass: GPURenderPassEncoder) {
        let i = 0;
        for (const buffer of this.attribute_buffer_refs) {
            if (buffer !== undefined) {
                pass.setVertexBuffer(i++, buffer.buffer, buffer.offset, buffer.length);
            }
        }
        if (this.is_indexed) {
            const buffer = this.index_buffer_ref.expect;
            pass.setIndexBuffer(buffer.buffer, 'uint32', buffer.offset, buffer.length);
        }
    }

    public draw(pass: GPURenderPassEncoder, instance_count: number = 1, instance_offset: number = 0) {
        if (this.is_indexed) {
            pass.drawIndexed(this.length, instance_count, undefined, undefined, instance_offset);
        }
        else {
            pass.draw(this.length, instance_count, undefined, instance_offset);
        }
    }

    public dispose(): void {
        this.clear_Buffers();
        this.clear_Index();
    }
}