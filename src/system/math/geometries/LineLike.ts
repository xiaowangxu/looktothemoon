import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface LineLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get start(): Vec;
    get end(): Vec;

    get length(): number;
    get direction(): Vec;
}