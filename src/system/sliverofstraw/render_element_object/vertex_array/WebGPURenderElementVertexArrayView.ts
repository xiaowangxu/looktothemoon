import { ReadonlyRef } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { WebGPURenderElementVertexArray } from "./WebGPURenderElementVertexArray";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";

export class WebGPURenderElementVertexArrayView extends WebGPURenderObjectRefCounted {

    public readonly vertex_array_ref: ReadonlyRef<WebGPURenderElementVertexArray>;

    public get primitive_type() { return this.vertex_array_ref.expect.primitive_type; }
    public offset: number;
    public length: number;

    public get is_indexed(): boolean {
        return this.vertex_array_ref.expect.is_indexed;
    }

    public get attribute_bitmask() { return this.vertex_array_ref.expect.attribute_bitmask; }

    constructor(render_state: WebGPURenderState, vertex_array: WebGPURenderElementVertexArray, offset: number, count: number) {
        super(render_state);
        this.vertex_array_ref = new ReadonlyRef(vertex_array);
        this.offset = offset;
        this.length = count;
    }

    public bind_Buffers(pass: GPURenderPassEncoder) {
        this.vertex_array_ref.expect.bind_Buffers(pass);
    }

    public draw(pass: GPURenderPassEncoder, instance_count: number = 1, instance_offset: number = 0) {
        if (this.is_indexed) {
            pass.drawIndexed(this.length, instance_count, this.offset, undefined, instance_offset);
        }
        else {
            pass.draw(this.length, instance_count, this.offset, instance_offset);
        }
    }

    public dispose() {
        this.vertex_array_ref.clear();
    }
}