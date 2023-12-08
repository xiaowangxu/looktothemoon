import type { VectorLike } from "../linear_algebra/VectorLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";

export interface SphereLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get center(): Vec;
    get radius(): number;
}