import { ReadonlyRef } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import { RenderServerGeometry } from "../../render_server/geometry/RenderServerGeometry";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

export abstract class Geometry3DResource extends Resource {

    static readonly $tmp_box3_for_bbox = Box3.new;

    protected readonly render_server_geometry_ref: ReadonlyRef<RenderServerGeometry> = new ReadonlyRef(new RenderServerGeometry());
    public get render_server_geometry() { return this.render_server_geometry_ref.expect; }

    protected dispose(): void {
        this.render_server_geometry_ref.clear();
    }
}