import type { VectorLike } from "../linear_algebra/VectorLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { GeometryLike, GeometryLikeBounded, GeometryLikeContainPoint } from "./GeometryLike";

export interface SphereLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends GeometryLike<Vec, Mat>, GeometryLikeBounded<Vec, Mat>, GeometryLikeContainPoint<Vec, Mat> {
    get center(): Vec;
    get radius(): number;
}