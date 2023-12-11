import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike, GeometryLikeBounded } from "./GeometryLike";

export interface PlaneLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends GeometryLike<Vec, Mat>, GeometryLikeBounded<Vec, Mat> {
    get normal(): Vec;
    get distance(): number;
}
