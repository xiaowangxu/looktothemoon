import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderState } from "../../RenderState";
import { RenderStateVertexArray } from "./RenderStateVertexArray";


export class RenderStateVertexArrayView<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly vertex_array_ref: Ref<RenderStateVertexArray<T>> = new Ref();

    public get primitive_type() { return this.vertex_array_ref.expect.primitive_type; }
    public readonly vertex_offset: number;
    public readonly vertex_count: number;

    constructor(render_state: T, vertex_array: RenderStateVertexArray<T>, vertex_offset: number, vertex_count: number) {
        super(render_state);
        this.vertex_array_ref.value = vertex_array;
        this.vertex_offset = vertex_offset;
        this.vertex_count = vertex_count;
    }

    public dispose() {
        this.vertex_array_ref.clear();
    }
}