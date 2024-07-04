import type { BoxLike } from "../geometries/BoxLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export type AABB<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> = BoxLike<Vec, Mat>;

export interface BvhShape<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get_AABB(target: AABB<Vec, Mat>): AABB<Vec, Mat>;
}

export interface BvhIndexShape<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get count(): number;
    get_AABB(index: number, target: AABB<Vec, Mat>): AABB<Vec, Mat>;
}

export type BvhShapes<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> = BvhShape<Vec, Mat>[] | BvhIndexShape<Vec, Mat>;

export interface BvhLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>, Shape extends BvhShapes<Vec, Mat>, BuildShape = Shape> {
    get is_empty(): boolean;
    build(shapes: Shape, max_depth?: number, strategy?: number): void;
    clear(): void;
    traverse(func: (aabb: AABB<Vec, Mat>) => boolean, max_depth?: number, target?: BuildShape[]): BuildShape[];
    traverse_Iterator(func: (aabb: AABB<Vec, Mat>) => boolean, max_depth?: number): Iterator<BuildShape>;
}