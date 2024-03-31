import type { Cloneable, Copyable, Equality } from "@/system/utils/Type";
import type { BoxLike } from "../geometries/BoxLike";
import type { PlaneLike } from "../geometries/PlaneLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface FrustumLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends Cloneable<FrustumLike<Vec, Mat>>, Copyable<FrustumLike<Vec, Mat>>, Equality<FrustumLike<Vec, Mat>> {
    contain_Point(point: Vec): boolean;
    // contain_Sphere(sphere: SphereLike<Vec, Mat>, touching?: boolean): boolean;
    contain_Box(box: BoxLike<Vec, Mat>, check_empty?: boolean): boolean;

    set(...args: PlaneLike<Vec, Mat>[]): FrustumLike<Vec, Mat>;
}

export interface FrustumLikeCullable<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    cull(frustum: FrustumLike<Vec, Mat>): boolean;
}