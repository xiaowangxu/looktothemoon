import type { BoxLike } from "../geometries/BoxLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export type AABB<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> = BoxLike<Vec, Mat>;

export interface BvhShape<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get aabb(): AABB<Vec, Mat>;
    get_AABB(target: AABB<Vec, Mat>): AABB<Vec, Mat>;
}

export interface BvhLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    build(shapes: BvhShape<Vec, Mat>[]): void;
    traverse(func: (aabb: AABB<Vec, Mat>) => boolean, max_depth: number): BvhShape<Vec, Mat>[];
}