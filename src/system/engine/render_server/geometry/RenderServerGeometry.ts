import { ReadonlyRef, RefArray } from "@/system/utils/RefCounted";
import { WebGPURenderElementVertexArray, type WebGPURenderElementVertexArrayBuffer } from "../../../sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArray";
import { WebGPURenderElementVertexArrayView } from "../../../sliverofstraw/render_element_object/vertex_array/WebGPURenderElementVertexArrayView";
import type { RenderServerGeometryAttributeLayoutBuffer } from "./RenderServerGeometryDefination";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Self } from "@/system/utils/Type";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import { WebGPURenderStatePrimitiveType } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import { RenderServer } from "../RenderServer";
import { RenderServerObjectRefCounted } from "../RenderServerObject";

export class RenderServerGeometry extends RenderServerObjectRefCounted {

    public readonly vertex_array_ref: ReadonlyRef<WebGPURenderElementVertexArray> = new ReadonlyRef(new WebGPURenderElementVertexArray(RenderServer.render_state, WebGPURenderStatePrimitiveType.Triangles, 0, 0));
    public readonly vertex_array_view_refs: RefArray<WebGPURenderElementVertexArrayView> = new RefArray();

    public get surface_length() { return this.vertex_array_view_refs.length; }
    protected _instance_count: number = 1;
    public get instance_count() { return this._instance_count; }

    protected _bbox: Box3 = Box3.new;
    /**
     * returned by reference
     */
    public get bbox(): Self<Box3> { return this._bbox; }

    // signal
    public readonly singal_bbox_changed: SignalEmitter<(bbox: Self<Box3>) => void> = new SignalEmitter();

    protected trigger_BBoxChange() {
        this.singal_bbox_changed.trigger(this._bbox);
    }

    public clear_Geometry(clear_surfaces: boolean = true) {
        this.vertex_array_ref.expect.clear_Buffers();
        this.vertex_array_ref.expect.clear_Index();
        this._bbox.min.set(0, 0, 0);
        this._bbox.max.set(0, 0, 0);
        this.trigger_BBoxChange();
        if (clear_surfaces) this.clear_Surfaces();
    }

    public clear_Surfaces() {
        this.vertex_array_view_refs.clear();
    }

    public set_AttributeBuffer(attribute: RenderServerGeometryAttributeLayoutBuffer, buffer: WebGPURenderElementVertexArrayBuffer) {
        this.vertex_array_ref.expect.set_Buffer(attribute, buffer);
    }

    public set_IndexBuffer(buffer: WebGPURenderElementVertexArrayBuffer) {
        this.vertex_array_ref.expect.set_Index(buffer);
    }

    public set_PrimitiveType(primitive_type: WebGPURenderStatePrimitiveType) {
        this.vertex_array_ref.expect.primitive_type = primitive_type;
    }

    public set_VertexLength(length: number) {
        this.vertex_array_ref.expect.length = length;
    }

    public add_Surface(offset: number, length: number) {
        this.vertex_array_view_refs.push(new WebGPURenderElementVertexArrayView(RenderServer.render_state, this.vertex_array_ref.expect, offset, length));
    }

    public get_Surface(index: number) {
        return this.vertex_array_view_refs.get(index);
    }

    public set_BBox(box: Box3) {
        this._bbox.copy(box);
        this.trigger_BBoxChange();
    }

    public set_InstanceCount(count: number) {
        this._instance_count = Math.floor(Math.max(1, count));
    }

    public dispose(): void {
        this.vertex_array_ref.clear();
        this.vertex_array_view_refs.clear();
    }
}