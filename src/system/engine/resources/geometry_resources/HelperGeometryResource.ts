import { RenderStateBufferUsage, RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import { PrimitiveGeometryResource } from "./PrimitiveGeometryResource";
import { RenderDeviceIndexAttributeBuffer, RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
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

export class WireframeBoxGeometryResource extends PrimitiveGeometryResource {

    public box: Box3 = Box3.new;

    public build(): void {
        const points = [];
        const index = [];
        const aabb = this.box;
        const x0 = aabb.min.x, y0 = aabb.min.y, z0 = aabb.min.z;
        const x1 = aabb.max.x, y1 = aabb.max.y, z1 = aabb.max.z;
        const i0 = index.length / 3;
        const i1 = i0 + 1;
        const i2 = i1 + 1;
        const i3 = i2 + 1;
        const i4 = i3 + 1;
        const i5 = i4 + 1;
        const i6 = i5 + 1;
        const i7 = i6 + 1;
        points.push(
            x0, y0, z0,
            x0, y0, z1,
            x1, y0, z1,
            x1, y0, z0,

            x0, y1, z0,
            x0, y1, z1,
            x1, y1, z1,
            x1, y1, z0,
        );
        index.push(
            i0, i1,
            i1, i2,
            i2, i3,
            i3, i0,

            i0, i4,
            i1, i5,
            i2, i6,
            i3, i7,

            i4, i5,
            i5, i6,
            i6, i7,
            i7, i4,
        );
        this.geometry.set_Geometry(
            RenderStatePrimitiveType.Lines,
            {
                position: new RenderDeviceVector3AttributeBuffer(this.config.render_server, RenderStateBufferUsage.StaticDraw, new Float32Array(points)),
            },
            new RenderDeviceIndexAttributeBuffer(this.config.render_server, RenderStateBufferUsage.StaticDraw,new Uint32Array(index)),
            24,
            this.box
        );
    }
}