import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike } from "./GeometryLike";

export interface LineLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat>  {
    get start(): Vec;
    get end(): Vec;

    get length(): number;
    get direction(): Vec;
    get_Direction(target: Vec): Vec;

    get_Point(p: number, target: Vec): Vec; 

    set(start: Vec, end: Vec): LineLike<Vec, Mat>;
}