import { Resource } from "../Resource";
import { RenderServerGeometry, type RenderServerGeometrySurfaces } from "../../render_server/geometry/RenderServerGeometry";
import type { BoxLike } from "@/system/fivepebble/geometries/BoxLike";
import type { MatrixLike } from "@/system/fivepebble/linear_algebra/MatrixLike";
import type { VectorLike } from "@/system/fivepebble/linear_algebra/VectorLike";

export abstract class GeometryResource<Geo extends RenderServerGeometry<Vec, Mat, Box>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>, Box extends BoxLike<Vec, Mat>> extends Resource {
    
    public abstract get render_server_geometry(): Geo;

    public get primitive_type() { return this.render_server_geometry.primitive_type; }
    public get vertex_length() { return this.render_server_geometry.vertex_length; }
    public get bbox() { return this.render_server_geometry.bbox.clone() as Box; }
    public get surfaces() {
        const surfaces: RenderServerGeometrySurfaces = [];
        const surfaces_length = this.render_server_geometry.surface_length;
        for (let i = 0; i < surfaces_length; i++) {
            const surface = this.render_server_geometry.get_Surface(i);
            if (surface === undefined) throw new Error('<ArrayGeometry3DResource> get surfaces: failed to get all surfaces');
            surfaces.push({
                offset: surface.offset,
                length: surface.length,
            })
        }
        return surfaces;
    }

}