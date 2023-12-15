import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike } from "./GeometryLike";

export interface BoxLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat> {
    get min(): Vec;
    get max(): Vec;

    get size(): Vec;
    get is_empty(): boolean;

    enlarge(amount: number): BoxLike<Vec, Mat>;
}
