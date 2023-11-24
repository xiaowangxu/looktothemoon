import { Ref, RefArray } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import type { RenderState, RenderStatePrimitiveType } from "../RenderState";
import type { RenderStateBuffer, RenderStateBufferView } from "../render_state_objects/RenderStateBuffer";
import type { RenderStateVertexArray, RenderStateVertexArrayView } from "../render_state_objects/RenderStateVertexArray";
import type { RenderDevice } from "../RenderDevice";
import type { RenderDeviceAttributeBuffer, RenderDeviceIndexAttributeBuffer } from "./RenderDeviceAttributeBuffer";
import type { RenderStateProgram } from "../render_state_objects/RenderStateProgram";

export class RenderDeviceArrayMesh<T extends RenderState<T>> extends RenderDeviceObject<T> {
    private readonly buffer_refs: Map<string, { buffer: Ref<RenderDeviceAttributeBuffer<T>>, location: number | undefined }> = new Map();
    private readonly index_refs: Ref<RenderDeviceIndexAttributeBuffer<T>> = new Ref();
    private readonly vertex_array_ref: Ref<RenderStateVertexArray<T>> = new Ref();
    private readonly vertex_array_view_refs: RefArray<RenderStateVertexArrayView<T>> = new RefArray();

    public get vertex_array() { return this.vertex_array_ref.expect; }
    public get index() { return this.index_refs.expect.buffer; }
    public get indexed() { return this.index_refs.value !== undefined; }

    public changed: boolean = false;

    constructor(render_device: RenderDevice<T>) {
        super(render_device);
    }

    private clear_Buffers() {
        for (const buffer_ref of this.buffer_refs.values()) {
            buffer_ref.buffer.clear();
        }
    }

    public set_AttributeBuffer(primitive_type: RenderStatePrimitiveType, count: number, buffers: Map<string, RenderDeviceAttributeBuffer<T>>, index?: RenderDeviceIndexAttributeBuffer<T>, groups?: { offset: number, count: number }[]) {
        this.changed = true;
        this.vertex_array_view_refs.clear();
        this.vertex_array_ref.value = this.render_state.create_VertexArray(primitive_type, 0, count, 1).expect();
        this.clear_Buffers();
        for (const [attribute, buffer] of buffers) {
            this.buffer_refs.set(attribute, {
                location: undefined,
                buffer: new Ref(buffer),
            });
        }
        if (index !== undefined) {
            this.index_refs.value = index;
            this.render_state.set_VertexArrayIndexBuffer(this.vertex_array_ref.expect, this.index_refs.expect.buffer);
        }
        if (groups !== undefined) {
            for (const { offset, count } of groups) {
                const vertex_array_view = this.render_state.create_VertexArrayView(this.vertex_array_ref.expect, offset, count, 1).expect();
                this.vertex_array_view_refs.push(vertex_array_view);
            }
        }
    }

    public bound_Program(program: RenderStateProgram<T>) {
        if (!this.changed) return;
        const vertex_array = this.vertex_array_ref.expect;
        for (const [attribute, buffer_ref] of this.buffer_refs) {
            if (buffer_ref.location === undefined) {
                const buffer = buffer_ref.buffer;
                const attribute_location = this.render_state.get_ProgramAttributeLocation(program, attribute);
                if (attribute_location < 0) continue;
                this.render_state.set_VertexArrayAttributeBuffer(vertex_array, attribute_location, buffer.expect.buffer);
                this.render_state.set_VertexArrayAttribute(vertex_array, attribute_location, true);
                buffer_ref.location = attribute_location;
            }
        }
        this.changed = false;
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceArrayMesh>");
        this.clear_Buffers();
        this.index_refs.clear();
        this.vertex_array_view_refs.clear();
        this.vertex_array_ref.clear();
    }
}