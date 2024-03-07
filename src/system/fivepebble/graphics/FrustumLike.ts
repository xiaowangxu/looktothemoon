import type { BoxLike } from "../geometries/BoxLike";
import type { PlaneLike } from "../geometries/PlaneLike";
import type { SphereLike } from "../geometries/SphereLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface FrustumLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    contain_Point(point: Vec): boolean;
    // contain_Sphere(sphere: SphereLike<Vec, Mat>, touching?: boolean): boolean;
    contain_Box(box: BoxLike<Vec, Mat>, check_empty?: boolean): boolean;
    
    equal(b: FrustumLike<Vec, Mat>): boolean;
    set(...args: PlaneLike<Vec, Mat>[]): FrustumLike<Vec, Mat>;
    copy(b: FrustumLike<Vec, Mat>): FrustumLike<Vec, Mat>;
    clone(): FrustumLike<Vec, Mat>;
}