import { bitmask_disable, bitmask_enable, bitmask_or } from "@/system/utils/BitMask";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { Ref, RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderStateBuffer } from "../../render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderElementRenderPipelineCacheHash } from "../pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderStateBufferView } from "../../render_state_object/buffer/WebGPURenderStateBufferView";
import type { WebGPURenderStatePrimitiveType } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";
import type { RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";

export type WebGPURenderElementVertexArrayBuffer = WebGPURenderStateBuffer | WebGPURenderStateBufferView;

export class WebGPURenderElementVertexArray extends WebGPURenderObjectRefCounted {

    static readonly MaxAttributeLocationCount = 8;

    public primitive_type: WebGPURenderStatePrimitiveType;
    public offset: number;
    public length: number;

    protected base_vertex_array_ref: Ref<WebGPURenderElementVertexArray> = new Ref();

    protected attribute_buffer_refs: RefArray<WebGPURenderElementVertexArrayBuffer> = new RefArray(WebGPURenderElementVertexArray.MaxAttributeLocationCount);
    protected index_buffer_ref: Ref<WebGPURenderElementVertexArrayBuffer> = new Ref();

    public get is_indexed(): boolean { return !this.index_buffer_ref.is_empty || (this.base_vertex_array_ref.value?.is_indexed ?? false); }

    protected _attribute_bitmask: WebGPURenderElementRenderPipelineCacheHash = 0;
    public get attribute_bitmask(): WebGPURenderElementRenderPipelineCacheHash { return bitmask_or(this._attribute_bitmask, (this.base_vertex_array_ref.value?.attribute_bitmask ?? 0)); }

    protected enable_AttributeLocationBit(location: RenderServerGeometryAttributeLayoutBuffer) {
        this._attribute_bitmask = bitmask_enable(this._attribute_bitmask, location);
    }

    protected disable_AttributeLocationBit(location: RenderServerGeometryAttributeLayoutBuffer) {
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

    public set_BaseVertexArray(vertex_array: WebGPURenderElementVertexArray | undefined, sync_type_and_size: boolean = true, reset_size_if_empty: boolean = true) {
        this.base_vertex_array_ref.value = vertex_array;
        if (this.base_vertex_array_ref.is_empty) {
            if (reset_size_if_empty) {
                this.offset = 0;
                this.length = 0;
            }
        }
        else if (sync_type_and_size) {
            this.primitive_type = this.base_vertex_array_ref.expect.primitive_type;
            this.offset = this.base_vertex_array_ref.expect.offset;
            this.length = this.base_vertex_array_ref.expect.length;
        }
    }

    public set_Buffer(location: RenderServerGeometryAttributeLayoutBuffer, buffer: WebGPURenderElementVertexArrayBuffer): void {
        if (location < 0 || location >= WebGPURenderElementVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, buffer);
        this.enable_AttributeLocationBit(location);
    }

    public clear_Buffer(location: RenderServerGeometryAttributeLayoutBuffer): void {
        if (location < 0 || location >= WebGPURenderElementVertexArray.MaxAttributeLocationCount) throw new Error('<WebGPURenderStateVertexArray> set_Buffer: attribute location out of bound');
        this.attribute_buffer_refs.set(location, undefined);
        this.disable_AttributeLocationBit(location);
    }

    public clear_Buffers(): void {
        this.attribute_buffer_refs.clear(false);
        this.clear_AttributeLocationBits();
    }

    public set_Index(buffer: WebGPURenderElementVertexArrayBuffer): void {
        this.index_buffer_ref.value = buffer;
    }

    public clear_Index(): void {
        this.index_buffer_ref.value = undefined;
    }

    protected get_Buffer(location: RenderServerGeometryAttributeLayoutBuffer) {
        return this.attribute_buffer_refs.get(location) ?? this.base_vertex_array_ref.value?.attribute_buffer_refs.get(location);
    }

    protected get_IndexBuffer() {
        return this.index_buffer_ref.value ?? this.base_vertex_array_ref.value?.index_buffer_ref.expect;
    }

    public bind_Buffers(pass: GPURenderPassEncoder) {
        let i = 0;
        const length = WebGPURenderElementVertexArray.MaxAttributeLocationCount;
        for (let idx = 0; idx < length; idx++) {
            const buffer = this.get_Buffer(idx);
            if (buffer !== undefined) {
                pass.setVertexBuffer(i++, buffer.buffer, buffer.offset, buffer.length);
            }
        }
        const buffer = this.get_IndexBuffer();
        if (buffer !== undefined) {
            pass.setIndexBuffer(buffer.buffer, 'uint32', buffer.offset, buffer.length);
        }
    }

    public draw(pass: GPURenderPassEncoder, instance_count: number = 1, instance_offset: number = 0) {
        if (instance_count === 0 || this.length === 0) return;
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
        this.base_vertex_array_ref.clear();
    }
}