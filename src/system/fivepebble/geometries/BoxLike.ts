import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike } from "./GeometryLike";

export interface BoxLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat> {
    get min(): Vec;
    get max(): Vec;

    get size(): Vec;
    get_Size(target: Vec): Vec;

    get center(): Vec;
    get_Center(target: Vec): Vec;

    get is_empty(): boolean;

    enlarge(a: BoxLike<Vec, Mat>, amount: number): BoxLike<Vec, Mat>;
    merge(a: BoxLike<Vec, Mat>, b: BoxLike<Vec, Mat>): BoxLike<Vec, Mat>;
    fit(a: BoxLike<Vec, Mat>, b: Vec): BoxLike<Vec, Mat>;

    set(min: Vec, max: Vec): BoxLike<Vec, Mat>;
}
