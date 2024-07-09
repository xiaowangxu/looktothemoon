import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { PolyLineSegmentBaseGeometry3D } from "./PolyLineSegmentBaseGeometry3D";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { WebGPURenderElementVector3Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { Ref } from "@/system/utils/RefCounted";
import { RenderServer } from "@/system/engine/render_server/RenderServer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { Geometry3DResource } from "../Geometry3DResource";
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";

export class PolyLineGeometry3DResource extends Geometry3DResource {

    static #tmp_vector3_0 = Vector3.new;
    static #const_vector3_default_point = Vector3.new;
    static #const_vector3_default_right = Vector3.create(1, 0, 0);

    private readonly point_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly point_end_buffer_view_ref: Ref<WebGPURenderStateBufferView> = new Ref();

    public get point_count() { return this.point_buffer_ref.value?.elements_count ?? 0; }

    constructor() {
        super();
        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_BaseGeometry(PolyLineSegmentBaseGeometry3D.get());
        this.set_PointCount(2);
        this.set_Point(1, PolyLineGeometry3DResource.#const_vector3_default_right);
        this.commit();
    }

    public set_PointCount(count: number, trigger_changed: boolean = true) {
        if (count === this.point_count) return;
        if (count <= 1) throw new Error('<PolyLineGeometry3DResource> set_PointCount: count should be greater than 1');
        this.point_buffer_ref.value = new WebGPURenderElementVector3Buffer(
            RenderServer.render_state,
            WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.CopyDst,
            count,
        );
        for (let i = 0; i < count; i++) {
            this.point_buffer_ref.expect.set_Data(PolyLineGeometry3DResource.#const_vector3_default_point, i);
        }
        this.point_end_buffer_view_ref.value = RenderServer.render_state.create_BufferView(this.point_buffer_ref.expect.buffer, 12).expect();
        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Custom0, this.point_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Custom1, this.point_end_buffer_view_ref.expect);
        this.render_server_geometry.set_InstanceCount(count - 1);
        if (trigger_changed) this.trigger_Changed();
    }

    public set_Point(index: number, point: Vector3) {
        this.point_buffer_ref.expect.set_Data(point, index);
    }

    public update_BBox() {
        const bbox = Geometry3DResource.$tmp_box3_for_bbox;
        const min = bbox.min.set(Infinity, Infinity, Infinity);
        const max = bbox.max.set(-Infinity, -Infinity, -Infinity);
        const point_count = this.point_count;
        const point = PolyLineGeometry3DResource.#tmp_vector3_0;
        for (let i = 0; i < point_count; i++) {
            this.point_buffer_ref.expect.get_Data(i, point);
            min.min(min, point);
            max.max(max, point);
        }
        this.render_server_geometry.set_BBox(bbox);
    }

    public commit(force_update_bbox: boolean = true, trigger_changed: boolean = true) {
        this.point_buffer_ref.expect.commit();
        if (force_update_bbox) this.update_BBox();

        if (trigger_changed) this.trigger_Changed();
    }

    protected dispose(): void {
        this.point_buffer_ref.clear();
        this.point_end_buffer_view_ref.clear();
        super.dispose();
    }
}