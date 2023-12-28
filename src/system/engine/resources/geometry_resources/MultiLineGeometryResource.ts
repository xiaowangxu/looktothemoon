import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector2AttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Cacher } from "@/system/utils/Cacher";
import { RenderServer3D } from "../../render_server/RenderServer";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { GeometryResource } from "./GeometryResource";
import { Ref } from "@/system/utils/RefCounted";
import type { WebGL2RenderState } from "@/system/sliverofstraw/webgl2/WebGL2RenderState";
import type { WebGL2RenderStateBuffer } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { RenderServerGeometryAttributeLoctions } from "../../render_server/RenderServerGeometry";
import { box3 } from "@/system/fivepebble/geometries/Box3";

const PositionAttributeBuffer = new Cacher(() => {
    return new RenderDeviceVector3AttributeBuffer(RenderServer3D, RenderStateBufferUsage.StaticDraw, [
        vec3(- 1, 2, 0),
        vec3(1, 2, 0),
        vec3(- 1, 1, 0),
        vec3(1, 1, 0),
        vec3(- 1, 0, 0),
        vec3(1, 0, 0),
        vec3(- 1, - 1, 0),
        vec3(1, - 1, 0),
    ]);
});

const UVAttributeBuffer = new Cacher(() => {
    return new RenderDeviceVector2AttributeBuffer(RenderServer3D, RenderStateBufferUsage.StaticDraw, [
        vec2(- 1, 2),
        vec2(1, 2),
        vec2(- 1, 1),
        vec2(1, 1),
        vec2(- 1, - 1),
        vec2(1, - 1),
        vec2(- 1, - 2),
        vec2(1, - 2),
    ]);
});

const IndexAttributeBuffer = new Cacher(() => {
    return new RenderDeviceIndexAttributeBuffer(RenderServer3D, RenderStateBufferUsage.StaticDraw, [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5]);
});

export class MultiLineGeometryResource extends GeometryResource {

    private readonly start_attribute_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();
    private readonly end_attribute_buffer_ref: Ref<RenderDeviceVector3AttributeBuffer<WebGL2RenderState, WebGL2RenderStateBuffer>> = new Ref();

    constructor() {
        super();
        this.start_attribute_buffer_ref.value = new RenderDeviceVector3AttributeBuffer(RenderServer3D, RenderStateBufferUsage.DynamicDraw, [vec3(0, 0, 0), vec3(1, 1, 1)], 1);
        this.end_attribute_buffer_ref.value = new RenderDeviceVector3AttributeBuffer(RenderServer3D, RenderStateBufferUsage.DynamicDraw, [vec3(1, 1, 1), vec3(3, 0, 3)], 1);
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Triangles,
            {
                position: PositionAttributeBuffer.value,
                uv: UVAttributeBuffer.value,
                start: {
                    attribute: this.start_attribute_buffer_ref.expect,
                    location: 10,
                },
                end: {
                    attribute: this.end_attribute_buffer_ref.expect,
                    location: 11,
                }
            },
            IndexAttributeBuffer.value,
            undefined,
            box3(vec3(0, 0, 0), vec3(3, 1, 3)),
            false
        );
        this.geometry.instance_count = 2;
    }

    protected dispose(): void {
        this.start_attribute_buffer_ref.clear();
        this.end_attribute_buffer_ref.clear();
        super.dispose();
    }
}