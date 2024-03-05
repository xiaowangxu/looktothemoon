import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { PrimitiveGeometryResource } from "./PrimitiveGeometryResource";
import { RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export class GridGeometryResource extends PrimitiveGeometryResource {

    public build(): void {
        const size = 100;
        const divisions = 100;
        const step = size / divisions;
        const halfSize = size / 2;

        const vertices = [];
        for (let i = 0, k = - halfSize; i <= divisions; i++, k += step) {
            if (k === 0) continue;
            vertices.push(- halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, - halfSize, k, 0, halfSize);
        }

        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Lines,
            {
                position: new RenderDeviceVector3AttributeBuffer(this.config.render_server, RenderStateBufferUsage.StaticDraw, new Float32Array(vertices))
            },
            undefined,
            vertices.length / 3,
            Box3.create(Vector3.create(-halfSize, -0.1, -halfSize), Vector3.create(halfSize, 0.1, halfSize))
        );
    }
}