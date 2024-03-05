import type { RayLike } from "../geometries/RayLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { Vector2 } from "../linear_algebra/Vector2";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { FrustumLike } from "./FrustumLike";

export interface CameraLike<Proj extends MatrixLike<Proj>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get projection(): Proj;
    get global_transform(): Proj;

    get mask(): number;

    project_Point(point: Vec, target: Vector2): Vector2;
    unproject_Point(ndc: Vector2, depth: number | undefined, target: Vec): Vec;
    unproject_Normal(ndc: Vector2, target: Vec): Vec;

    project_Ray(ndc: Vector2, depth: number | undefined, target: RayLike<Vec, Mat>): RayLike<Vec, Mat>;

    get frustum(): FrustumLike<Vec, Mat>;
    get_Frustum(target: FrustumLike<Vec, Mat>): FrustumLike<Vec, Mat>;

    clone(): CameraLike<Proj, Vec, Mat>;
}