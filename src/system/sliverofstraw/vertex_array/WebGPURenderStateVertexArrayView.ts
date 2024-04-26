import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateVertexArray } from "./WebGPURenderStateVertexArray";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export class WebGPURenderStateVertexArrayView extends WebGPURenderStateObjectRefCounted {

    public readonly vertex_array_ref: Ref<WebGPURenderStateVertexArray> = new Ref();

    public get primitive_type() { return this.vertex_array_ref.expect.primitive_type; }
    public readonly offset: number;
    public readonly count: number;

    constructor(render_state: WebGPURenderState, vertex_array: WebGPURenderStateVertexArray, offset: number, count: number) {
        super(render_state);
        this.vertex_array_ref.value = vertex_array;
        this.offset = offset;
        this.count = count;
    }
    
    public dispose() {
        this.vertex_array_ref.clear();
    }
}