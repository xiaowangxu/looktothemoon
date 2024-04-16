import { Cacher } from "@/system/utils/Cacher";
import type { Config } from "../../ConfiguredObject";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { RenderDeviceVector2AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Ref } from "@/system/utils/RefCounted";
import { GeometryResource } from "./GeometryResource";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

const BillboardSquarePositionAttributeBuffer = new Cacher((config: Config) => {
    return new Ref(new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector2.create(-0.5, 0.5),
        Vector2.create(-0.5, -0.5),
        Vector2.create(0.5, 0.5),
        Vector2.create(0.5, -0.5),
    ]));
});

export class BillboardSquareGeometryResource extends GeometryResource {
    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.TriangleStrip,
            {
                position: BillboardSquarePositionAttributeBuffer.get(config).expect,
            },
            undefined,
            4,
            Box3.create(Vector3.create(-100000, -100000, -100000), Vector3.create(100000, 100000, 100000)),
        );
    }

    protected dispose(): void {
        super.dispose();
    }
}

const BillboardCirclePositionAttributeBuffer = new Cacher((config: Config) => {
    // let str = '';
    // for (let i = 0; i <= 16; i++) {
    //     str += `Vector2.create(${Math.cos(i / 32 * Tau) / 2}, ${Math.sin(i / 32 * Tau) / 2}),\n`;
    // }
    // console.log(str);
    return new Ref(new RenderDeviceVector2AttributeBuffer(config.render_server, RenderStateBufferUsage.StaticDraw, [
        Vector2.create(0, 0),
        Vector2.create(0.5, 0),
        Vector2.create(0.4903926402016152, 0.09754516100806412),
        Vector2.create(0.46193976625564337, 0.1913417161825449),
        Vector2.create(0.4157348061512726, 0.2777851165098011),
        Vector2.create(0.3535533905932738, 0.35355339059327373),
        Vector2.create(0.27778511650980114, 0.4157348061512726),
        Vector2.create(0.19134171618254492, 0.46193976625564337),
        Vector2.create(0.09754516100806417, 0.4903926402016152),
        Vector2.create(0, 0.5),
        Vector2.create(-0.0975451610080641, 0.4903926402016152),
        Vector2.create(-0.19134171618254486, 0.46193976625564337),
        Vector2.create(-0.277785116509801, 0.41573480615127273),
        Vector2.create(-0.35355339059327373, 0.3535533905932738),
        Vector2.create(-0.4157348061512727, 0.2777851165098011),
        Vector2.create(-0.46193976625564337, 0.19134171618254495),
        Vector2.create(-0.4903926402016152, 0.0975451610080643),
        Vector2.create(-0.5, 0),
        Vector2.create(-0.4903926402016152, -0.09754516100806418),
        Vector2.create(-0.4619397662556434, -0.19134171618254484),
        Vector2.create(-0.41573480615127273, -0.277785116509801),
        Vector2.create(-0.35355339059327384, -0.35355339059327373),
        Vector2.create(-0.2777851165098011, -0.4157348061512726),
        Vector2.create(-0.19134171618254517, -0.46193976625564326),
        Vector2.create(-0.09754516100806433, -0.49039264020161516),
        Vector2.create(0, -0.5),
        Vector2.create(0.09754516100806415, -0.4903926402016152),
        Vector2.create(0.191341716182545, -0.4619397662556433),
        Vector2.create(0.2777851165098009, -0.41573480615127273),
        Vector2.create(0.3535533905932737, -0.35355339059327384),
        Vector2.create(0.4157348061512726, -0.2777851165098011),
        Vector2.create(0.46193976625564326, -0.1913417161825452),
        Vector2.create(0.49039264020161516, -0.09754516100806436),
        Vector2.create(0.5, 0),
    ]));
});

export class BillboardCircleGeometryResource extends GeometryResource {
    constructor(config: Config) {
        super(config);
        this.geometry_ref.value = this.render_server.create_Geometry();
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.TriangleFan,
            {
                position: BillboardCirclePositionAttributeBuffer.get(config).expect,
            },
            undefined,
            34,
            Box3.create(Vector3.create(-100000, -100000, -100000), Vector3.create(100000, 100000, 100000)),
        );
    }

    protected dispose(): void {
        super.dispose();
    }
}