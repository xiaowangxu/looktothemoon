import type { VectorLike } from "../linear_algebra/VectorLike";
import type { LineLike } from "../geometries/LineLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";

export interface RayLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get origin(): Vec;
    get direction(): Vec;

    get_Point(distance: number): Vec;

    get_Line(start: number, end: number): LineLike<Vec, Mat>;
}