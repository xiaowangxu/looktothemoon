import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";

export interface GeometryLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    equal(b: GeometryLike<Vec, Mat>): boolean;

    copy(b: GeometryLike<Vec, Mat>): GeometryLike<Vec, Mat>;
    clone(): GeometryLike<Vec, Mat>;
}

export interface GeometryLikeBounded<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    signed_distance_to_Point(point: Vec): number; // outside is positive , inside is negative , boundary is 0
    distance_to_Point(point: Vec): number;

    project_Point(point: Vec): Vec;
}

export enum GeometryContainType {
    Inside = 0b001,
    Touching = 0b010,
    Outside = 0b100,
}

export interface GeometryLikeContainPoint<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends GeometryLikeBounded<Vec, Mat> {
    contain_Point(point: Vec, type: GeometryContainType): boolean;
}