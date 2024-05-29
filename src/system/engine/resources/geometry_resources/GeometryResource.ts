import { Resource } from "../Resource";
import { RenderServerGeometry } from "../../render_server/geometry/RenderServerGeometry";
import type { BoxLike } from "@/system/fivepebble/geometries/BoxLike";
import type { MatrixLike } from "@/system/fivepebble/linear_algebra/MatrixLike";
import type { VectorLike } from "@/system/fivepebble/linear_algebra/VectorLike";

export abstract class GeometryResource<Geo extends RenderServerGeometry<Vec, Mat, Box>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>, Box extends BoxLike<Vec, Mat>> extends Resource {
    public abstract get render_server_geometry(): Geo;
}