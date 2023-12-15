import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderState } from "../RenderState";

export class RenderStateVertexArray<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly primitive_type: number;
    public readonly offset: number;
    public readonly count: number;

    constructor(render_state: T, primitive_type: number, offset: number, count: number) {
        super(render_state);
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.count = count;
    }

    public dispose(): void {
        this.render_state.delete_VertexArray(this);
    }
}

export class RenderStateVertexArrayView<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly vertex_array_ref: Ref<RenderStateVertexArray<T>> = new Ref();

    public get primitive_type() { return this.vertex_array_ref.expect.primitive_type; }
    public readonly offset: number;
    public readonly count: number;

    constructor(render_state: T, vertex_array: RenderStateVertexArray<T>, offset: number, count: number) {
        super(render_state);
        this.vertex_array_ref.value = vertex_array;
        this.offset = offset;
        this.count = count;
    }

    public dispose() {
        this.vertex_array_ref.clear();
    }
}