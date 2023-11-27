import { Ref } from "@/system/utils/RefCounted";
import { RenderDeviceObject } from "../RenderDeviceObject";
import { RenderState, RenderStatePrimitiveType } from "../RenderState";
import { RenderDeviceAttributeBuffer, RenderDeviceIndexAttributeBuffer } from "./RenderDeviceAttributeBuffer";
import { RenderStateVertexArray } from "../render_state_objects/RenderStateVertexArray";
import { RenderDevice } from "../RenderDevice";

type BufferMap<T extends RenderState<T>> = Map<string, { buffer: Ref<RenderDeviceAttributeBuffer<T>>, location: number | undefined }>;

export abstract class RenderDeviceSurface<
    T extends RenderState<T>,
    Vert extends RenderStateVertexArray<T> = RenderStateVertexArray<T>,
>
    extends RenderDeviceObject<T> {
    protected buffer_refs: BufferMap<T> = new Map();
    protected readonly index_refs: Ref<RenderDeviceIndexAttributeBuffer<T>> = new Ref();
    protected readonly vertex_array_ref: Ref<Vert> = new Ref();

    public get vertex_array() { return this.vertex_array_ref.expect; }
    public get index() { return this.index_refs.expect.buffer; }
    public get index_type() { return this.index_refs.expect.data_type; }
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

    public set_AttributeBuffer(primitive_type: RenderStatePrimitiveType, count: number, buffers: { [name: string]: RenderDeviceAttributeBuffer<T> }, index?: RenderDeviceIndexAttributeBuffer<T>) {
        this.changed = true;
        this.vertex_array_ref.value = this.render_state.create_VertexArray(primitive_type, 0, count, 1).expect() as Vert;
        const map: BufferMap<T> = new Map();
        for (const [attribute, buffer] of Object.entries(buffers)) {
            map.set(attribute, {
                location: undefined,
                buffer: new Ref(buffer),
            });
        }
        this.clear_Buffers();
        this.buffer_refs = map;
        if (index !== undefined) {
            this.index_refs.value = index;
            this.render_state.set_VertexArrayIndexBuffer(this.vertex_array_ref.expect, this.index_refs.expect.buffer);
        }
    }

    public get_AttributeBuffer<Buffer extends RenderDeviceAttributeBuffer<T>>(attribute: string) {
        return this.buffer_refs.get(attribute)?.buffer?.value as Buffer | undefined;
    }

    public dispose(): void {
        console.log(">>> dispose <RenderDeviceSurface>");
        this.clear_Buffers();
        this.index_refs.clear();
        this.vertex_array_ref.clear();
    }
}