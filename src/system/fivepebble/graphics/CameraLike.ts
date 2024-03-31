import type { Cloneable } from "@/system/utils/Type";
import type { LineLike } from "../geometries/LineLike";
import type { RayLike } from "../geometries/RayLike";
import type { MatrixLike } from "../linear_algebra/MatrixLike";
import type { Vector2 } from "../linear_algebra/Vector2";
import type { VectorLike } from "../linear_algebra/VectorLike";
import type { FrustumLike } from "./FrustumLike";

export interface CameraLike<Proj extends MatrixLike<Proj>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>>
    extends Cloneable<CameraLike<Proj, Vec, Mat>> {
    get projection(): Proj;
    set projection(mat: Proj);
    get_Projection(target: Proj): Proj;

    get global_transform(): Proj;
    set global_transform(mat: Proj);
    get_GlobalTransform(target: Proj): Proj;

    get global_projection(): Proj;
    get_GlobalProjection(target: Proj): Proj;

    get mask(): number;
    set mask(mask: number);

    project_Point(point: Vec, target: Vector2): Vector2;
    unproject_Point(ndc: Vector2, depth: number | undefined, target: Vec): Vec;
    unproject_Normal(ndc: Vector2, target: Vec): Vec;

    project_Ray(ndc: Vector2, depth: number | undefined, target: RayLike<Vec, Mat>): RayLike<Vec, Mat>;
    project_Line(ndc: Vector2, target: LineLike<Vec, Mat>): LineLike<Vec, Mat>;

    get frustum(): FrustumLike<Vec, Mat>;
    get_Frustum(target: FrustumLike<Vec, Mat>): FrustumLike<Vec, Mat>;
}

export interface CameraFrustumLikeCullable<Proj extends MatrixLike<Proj>, Vec extends VectorLike<Vec, Mat>, Mat extends MatrixLike<Mat>> {
    get is_empty(): boolean;
    cull(camera: CameraLike<Proj, Vec, Mat>, frustum: FrustumLike<Vec, Mat>, screen_size: Vector2, enlargement: number): boolean;
}