import { ReadonlyRef } from "@/system/utils/RefCounted";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import { GeometryResource } from "../GeometryResource";
import { RenderServerGeometry3D } from "@/system/engine/render_server/geometry/RenderServerGeometry3D";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";

export abstract class Geometry3DResource extends GeometryResource<RenderServerGeometry3D, Vector3, Matrix3, Box3> {

    static readonly $tmp_box3_for_bbox = Box3.new;

    protected readonly render_server_geometry_ref: ReadonlyRef<RenderServerGeometry3D> = new ReadonlyRef(new RenderServerGeometry3D());
    public get render_server_geometry() { return this.render_server_geometry_ref.expect; }

    protected dispose(): void {
        this.render_server_geometry_ref.clear();
    }
}