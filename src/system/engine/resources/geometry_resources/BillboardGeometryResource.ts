import { Cacher } from "@/system/utils/Cacher";
import type { Config } from "../../ConfiguredObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { RenderDeviceVector2AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Ref } from "@/system/utils/RefCounted";
import { GeometryResource } from "./GeometryResource";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

const BillboardPositionAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector2.create(-0.5, 0.5),
        Vector2.create(-0.5, -0.5),
        Vector2.create(0.5, 0.5),
        Vector2.create(0.5, -0.5),
    ]));
});

const BillboardUVAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector2.create(0, 1),
        Vector2.create(0, 0),
        Vector2.create(1, 1),
        Vector2.create(1, 0),
    ]));
});

export class BillboardGeometryResource extends GeometryResource {

    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.TriangleStrip,
            { 
                position: BillboardPositionAttributeBuffer.get(config).expect,
                uv: BillboardUVAttributeBuffer.get(config).expect,
            },
            undefined,
            4,
            Box3.create(Vector3.create(-100000,-100000,-100000), Vector3.create(100000, 100000, 100000)),
        );
    }

    protected dispose(): void {
        super.dispose();
    }
}