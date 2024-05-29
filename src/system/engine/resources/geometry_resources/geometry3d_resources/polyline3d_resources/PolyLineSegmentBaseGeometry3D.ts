import { RenderServer } from "@/system/engine/render_server/RenderServer";
import { RenderServerGeometry } from "@/system/engine/render_server/geometry/RenderServerGeometry";
import { RenderServerGeometry3D } from "@/system/engine/render_server/geometry/RenderServerGeometry3D";
import { RenderServerGeometryAttributeLayoutBuffer } from "@/system/engine/render_server/geometry/RenderServerGeometryDefination";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { WebGPURenderElementIndexBuffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementBuffer";
import { WebGPURenderElementVector3Buffer, WebGPURenderElementVector2Buffer } from "@/system/sliverofstraw/render_element_object/buffer/WebGPURenderElementVectorBuffer";
import { WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { RefCacher } from "@/system/utils/RefCounted";

export const PolyLineSegmentBaseGeometry3D = new RefCacher(() => {

    const position_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, [
        Vector3.create(-1,  2, 0),
        Vector3.create( 1,  2, 0),
        Vector3.create(-1,  1, 0),
        Vector3.create( 1,  1, 0),
        Vector3.create(-1,  0, 0),
        Vector3.create( 1,  0, 0),
        Vector3.create(-1, -1, 0),
        Vector3.create( 1, -1, 0),
    ]);
    const normal_buffer = new WebGPURenderElementVector3Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, [
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 0, -1),
    ]);
    const uv_buffer = new WebGPURenderElementVector2Buffer(RenderServer.render_state, WebGPURenderStateBufferType.VertexArray, WebGPURenderStateBufferUsage.None, [
        Vector2.create(- 1, 2),
        Vector2.create(1, 2),
        Vector2.create(- 1, 1),
        Vector2.create(1, 1),
        Vector2.create(- 1, - 1),
        Vector2.create(1, - 1),
        Vector2.create(- 1, - 2),
        Vector2.create(1, - 2),
    ]);
    const index_buffer = new WebGPURenderElementIndexBuffer(RenderServer.render_state, WebGPURenderStateBufferType.Index, WebGPURenderStateBufferUsage.None, [
        0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5
    ]);

    const geometry = new RenderServerGeometry3D();
    geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Position, position_buffer.buffer);
    geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Normal, normal_buffer.buffer);
    geometry.set_AttributeBuffer(RenderServerGeometryAttributeLayoutBuffer.Uv, uv_buffer.buffer);
    geometry.set_IndexBuffer(index_buffer.buffer);
    geometry.set_VertexLength(18);

    position_buffer.release();
    normal_buffer.release();
    uv_buffer.release();
    index_buffer.release();

    return geometry;
});