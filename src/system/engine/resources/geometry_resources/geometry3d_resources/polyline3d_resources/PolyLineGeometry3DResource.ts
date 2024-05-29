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

    private readonly point_buffer_ref: Ref<WebGPURenderElementVector3Buffer> = new Ref();
    private readonly point_end_buffer_view_ref: Ref<WebGPURenderStateBufferView> = new Ref();

    constructor() {
        super();
        this.render_server_geometry.clear_Geometry();
        this.render_server_geometry.set_BaseGeometry(PolyLineSegmentBaseGeometry3D.get());
        this.render_server_geometry.set_InstanceCount(5);
        this.render_server_geometry.set_BBox(Box3.create(Vector3.create(-1000, -1000, -1000), Vector3.create(1000, 1000, 1000)));
        this.build();
    }

    public build() {
        this.point_buffer_ref.value = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, [
            Vector3.create(-0.5, 0.5, -0.5),
            Vector3.create(0.5, 0.5, -0.5),
            Vector3.create(0.5, 0.5, 0.5),
            Vector3.create(-0.5, 0.5, 0.5),
            Vector3.create(-0.5, 0.5, -0.5),
            Vector3.create(-0.5, -0.5, -0.5),
        ]);
        this.point_end_buffer_view_ref.value = RenderServer.render_state.create_BufferView(this.point_buffer_ref.expect.buffer, 12).expect();
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Custom0, this.point_buffer_ref.expect.buffer);
        this.render_server_geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Custom1, this.point_end_buffer_view_ref.expect);
        console.log(this.render_server_geometry);
    }
}