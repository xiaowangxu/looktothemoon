import type { Cloneable, Copyable, Equality, Self } from "@/system/utils/Type";
import type { PlaneLike } from "../geometries/PlaneLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface FrustumLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends Cloneable<FrustumLike<Vec, Mat>>, Copyable<FrustumLike<Vec, Mat>>, Equality<FrustumLike<Vec, Mat>> {

    enlarge(a: FrustumLike<Vec, Mat>, amount: number): Self<FrustumLike<Vec, Mat>>;

    contain_Point(point: Vec): boolean;

    set(...args: PlaneLike<Vec, Mat>[]): FrustumLike<Vec, Mat>;
}