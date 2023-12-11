import type { RayLike } from "../geometries/RayLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { Vector2 } from "../linear_algebra/Vector2";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { FrustumLike } from "./FrustumLike";

export interface CameraLike<Proj extends MatrixLike<Proj>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get projection(): Proj;
    get global_transform(): Proj;

    get mask(): number;

    project_Point(point: Vec): Vector2;
    unproject_Point(ndc: Vector2, depth?: number): Vec;
    unproject_Normal(ndc: Vector2): Vec;

    project_Ray(ndc: Vector2): RayLike<Vec, Mat>;

    get_Frustum(): FrustumLike<Vec, Mat>;
}