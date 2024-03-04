import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike } from "./GeometryLike";

export interface TriangleLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat> {
    get p0(): Vec;
    get p1(): Vec;
    get p2(): Vec;

    get center(): Vec;
    get_Center(target: Vec): Vec;

    set(p0: Vec, p1: Vec, p2: Vec): TriangleLike<Vec, Mat>;
}
