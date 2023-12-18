import type { BoxLike } from "../geometries/BoxLike";
import type { SphereLike } from "../geometries/SphereLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface FrustumLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    contain_Point(point: Vec): boolean;
    // contain_Sphere(sphere: SphereLike<Vec, Mat>, touching?: boolean): boolean;
    contain_Box(box: BoxLike<Vec, Mat>): boolean;
}