import type { VectorLike } from "../linear_algebra/VectorLike";
import type { LineLike } from "../geometries/LineLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { GeometryLike } from "./GeometryLike";

export interface RayLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat> {
    get origin(): Vec;
    get direction(): Vec;

    get_Point(distance: number): Vec;
    gets_Point(distance: number, target: Vec): Vec;

    get_Line(start: number, end: number): LineLike<Vec, Mat>;
    gets_Line(start: number, end: number, target: LineLike<Vec, Mat>): LineLike<Vec, Mat>;

    set(origin: Vec, direction: Vec): RayLike<Vec, Mat>;
}