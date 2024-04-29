import { ReadonlyRef } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { WebGPURenderStateVertexArray } from "./WebGPURenderStateVertexArray";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";

export class WebGPURenderStateVertexArrayView extends WebGPURenderObjectRefCounted {

    public readonly vertex_array_ref: ReadonlyRef<WebGPURenderStateVertexArray>;

    public get primitive_type() { return this.vertex_array_ref.expect.primitive_type; }
    public readonly offset: number;
    public readonly count: number;

    public get is_indexed(): boolean {
        return this.vertex_array_ref.expect.is_indexed;
    }

    public get attribute_bitmask() { return this.vertex_array_ref.expect.attribute_bitmask; }

    constructor(render_state: WebGPURenderState, vertex_array: WebGPURenderStateVertexArray, offset: number, count: number) {
        super(render_state);
        this.vertex_array_ref = new ReadonlyRef(vertex_array);
        this.offset = offset;
        this.count = count;
    }

    public bind_Buffers(pass: GPURenderPassEncoder) {
        this.vertex_array_ref.expect.bind_Buffers(pass);
    }

    public draw(pass: GPURenderPassEncoder, instance_count: number = 1, instance_offset: number = 0) {
        if (this.is_indexed) {
            pass.drawIndexed(this.count, instance_count, this.offset, undefined, instance_offset);
        }
        else {
            pass.draw(this.count, instance_count, this.offset, instance_offset);
        }
    }

    public dispose() {
        this.vertex_array_ref.clear();
    }
}