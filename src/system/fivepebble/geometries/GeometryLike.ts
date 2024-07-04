import type { Cloneable, Copyable, Equality } from "@/system/utils/Type";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { Vector2 } from "../linear_algebra/Vector2";

export interface GeometryLike<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends Cloneable<GeometryLike<Vec, Mat>>, Copyable<GeometryLike<Vec, Mat>>, Equality<GeometryLike<Vec, Mat>> { }

export interface GeometryLikeBounded<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    signed_distance_to_Point(point: Vec): number; // outside is positive , inside is negative , boundary is 0
    distance_to_Point(point: Vec): number;

    project_Point(point: Vec, target: Vec): Vec;
}

export enum RaycastSide {
    Front, Back, Double
}

export interface Raycastable<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    raycast(from: Vec, to: Vec, side: RaycastSide): RaycastResult<Vec, Mat> | undefined;
}

export interface RaycastResult<Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    position: Vec,
    normal: Vec,
    uv?: Vector2,
}