import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { GeometryLike } from "./GeometryLike";

export interface BoxLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> extends GeometryLike<Vec, Mat> {
    get min(): Vec;
    get max(): Vec;

    get size(): Vec;
    gets_Size(target: Vec): Vec;

    get center(): Vec;
    gets_Center(target: Vec): Vec;

    get is_empty(): boolean;

    enlarge(amount: number): BoxLike<Vec, Mat>;
    enlarges(a: BoxLike<Vec, Mat>, amount: number): BoxLike<Vec, Mat>;

    merge(b: BoxLike<Vec, Mat>): BoxLike<Vec, Mat>;
    merges(a: BoxLike<Vec, Mat>, b: BoxLike<Vec, Mat>): BoxLike<Vec, Mat>;

    grow(b: Vec): BoxLike<Vec, Mat>;
    grows(a: BoxLike<Vec, Mat>, b: Vec): BoxLike<Vec, Mat>;

    set(min: Vec, max: Vec): BoxLike<Vec, Mat>;
}
