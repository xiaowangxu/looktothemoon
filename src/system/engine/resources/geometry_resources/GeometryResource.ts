import { Ref } from "@/system/utils/RefCounted";
import type { RenderServerGeometry } from "../../render_server/RenderServerGeometry";
import { Resource } from "../Resource";
import { RenderDeviceVector3AttributeBuffer } from "@/system/sliverofstraw/render_device_objects/RenderDeviceAttributeBuffer";
import { RenderStatePrimitiveType } from "@/system/sliverofstraw/RenderState";
import type { Config } from "../../ConfiguredObject";
import { Triangle3 } from "@/system/fivepebble/geometries/Triangle3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export abstract class GeometryResource extends Resource {
    protected readonly geometry_ref: Ref<RenderServerGeometry> = new Ref();

    public get geometry() { return this.geometry_ref.expect; }

    protected get render_server() { return this.config.render_server; }

    constructor(config: Config) {
        super(config);
    }

    // experimental
    public get_TriFaces() {
        if (this.geometry.primitive_type !== RenderStatePrimitiveType.Triangles) return undefined;
        const position = this.geometry.get_AttributeBuffer('position');
        if (position === undefined || !(position instanceof RenderDeviceVector3AttributeBuffer)) return;
        const point = position.data;
        if (this.geometry.is_indexed) {
            const index = this.geometry.get_IndexAttributeBuffer()!.data;
            if (!(index instanceof Uint32Array)) return undefined;
            const tri: Triangle3[] = [];
            for (let i = 0; i < index.length; i += 3) {
                const base0 = index[i] * 3;
                const base1 = index[i + 1] * 3;
                const base2 = index[i + 2] * 3;
                const x0 = point[base0 + 0], y0 = point[base0 + 1], z0 = point[base0 + 2];
                const x1 = point[base1 + 0], y1 = point[base1 + 1], z1 = point[base1 + 2];
                const x2 = point[base2 + 0], y2 = point[base2 + 1], z2 = point[base2 + 2];
                tri.push(Triangle3.create(Vector3.create(x0, y0, z0), Vector3.create(x1, y1, z1), Vector3.create(x2, y2, z2)));
            }
            return tri;
        }
        else {
            const index = this.geometry.vertex_count;
            const tri: Triangle3[] = [];
            for (let i = 0; i < index; i += 3) {
                const base0 = i * 3;
                const base1 = (i + 1) * 3;
                const base2 = (i + 2) * 3;
                const x0 = point[base0 + 0], y0 = point[base0 + 1], z0 = point[base0 + 2];
                const x1 = point[base1 + 0], y1 = point[base1 + 1], z1 = point[base1 + 2];
                const x2 = point[base2 + 0], y2 = point[base2 + 1], z2 = point[base2 + 2];
                tri.push(Triangle3.create(Vector3.create(x0, y0, z0), Vector3.create(x1, y1, z1), Vector3.create(x2, y2, z2)));
            }
            return tri;
        }
    }

    protected dispose(): void {
        console.log(">>> dispose <GeometryResource>", this.rid);
        this.geometry_ref.clear();
    }
}