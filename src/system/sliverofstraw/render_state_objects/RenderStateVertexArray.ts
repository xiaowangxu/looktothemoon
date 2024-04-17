import { Ref } from "@/system/utils/RefCounted";
import { RenderStateObject } from "./RenderStateObject";
import type { RenderState } from "../RenderState";

export class RenderStateVertexArray<T extends RenderState<T>> extends RenderStateObject<T> {
    public readonly primitive_type: number;
    public readonly offset: number;
    public count: number;
    public readonly attribute_locations: Set<number> = new Set();

    constructor(render_state: T, primitive_type: number, offset: number, count: number) {
        super(render_state);
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.count = count;
    }

    public has_AttributeLocation(location: number) {
        return this.attribute_locations.has(location);
    }

    public dispose(): void {
        this.attribute_locations.clear();
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

    public has_AttributeLocation(location: number) {
        return this.vertex_array_ref.expect.attribute_locations.has(location);
    }

    public dispose() {
        this.vertex_array_ref.clear();
    }
}