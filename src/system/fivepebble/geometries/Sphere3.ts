import { Matrix3 } from "../linear_algebra/Matrix3";
import type { SphereLike } from "./SphereLike";
import { Vector3 } from "../linear_algebra/Vector3";
import type { CameraFrustumLikeCullable, CameraLike } from "../graphics/CameraLike";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import type { Vector2 } from "../linear_algebra/Vector2";
import type { Camera3 } from "../graphics/Camera3";
import { Frustum3 } from "../graphics/Frustum3";
import type { Transformable } from "./GeometryLike";
import type { Vector4 } from "../linear_algebra/Vector4";
import { is_ApproxZero } from "../Scalar";
import { Euler } from "../linear_algebra/Euler";

export class Sphere3 implements SphereLike<Vector3, Matrix3>, CameraFrustumLikeCullable<Matrix4, Vector3, Matrix3>, Transformable<Sphere3, Vector4, Matrix4> {

    //#region init

    static get new() { return new Sphere3(Sphere3.#const_vector3_zero, 0); }
    static create(center: Vector3, radius: number) { return new Sphere3(center, radius); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3(0, 0, 0);
    static readonly #tmp_euler_0 = new Euler(0, 0, 0);
    static readonly #tmp_matrix3_0 = new Matrix3();

    public readonly center: Vector3;
    public radius: number;

    constructor(center: Vector3, radius: number) {
        this.center = center.clone();
        this.radius = radius;
    }

    get is_empty(): boolean { return is_ApproxZero(this.radius); }

    // #region Geometry Bounded

    signed_distance_to_Point(point: Vector3): number {
        return point.distance_to(this.center) - this.radius;
    }

    distance_to_Point(point: Vector3): number {
        return Math.abs(this.signed_distance_to_Point(point));
    }

    project_Point(point: Vector3, target: Vector3): Vector3 {
        const normal = target.direction_to(this.center, point);
        if (normal.squared_length === 0) return target.add_Scaled(this.center, this.radius, new Vector3(1, 0, 0));
        return target.add_Scaled(this.center, this.radius, normal);
    }

    // #endregion

    //#region camera frustum cull

    affine_transform(a: Sphere3, mat: Matrix4): Sphere3 {
        const basis = mat.get_Basis(Sphere3.#tmp_matrix3_0);
        basis.decompose_RotationScale(Sphere3.#tmp_euler_0, Sphere3.#tmp_vector3_0);
        this.center.affine_transform(a.center, mat);
        this.radius = a.radius * Sphere3.#tmp_vector3_0.max_component;
        return this;
    }

    sort_distance_to(camera: CameraLike<Matrix4, Vector3, Matrix3>, enlargement: number): number {
        const position = camera.get_GlobalPosition(Sphere3.#tmp_vector3_0);
        return this.center.distance_to(position);
    }

    cull(camera: Camera3, frustum: Frustum3, screen_size: Vector2, enlargement: number): boolean {
        const _frustum = enlargement === 0 ? frustum : Frustum3.$tmp_frustum3_for_cullable_0.enlarge(frustum, -enlargement);
        return _frustum.contain_Point(this.center);
    }

    // #endregion

    equal(b: Sphere3): boolean {
        return this.radius === b.radius && this.center.equal(b.center);
    }

    set(center: Vector3, radius: number): Sphere3 {
        this.center.copy(center);
        this.radius = radius;
        return this;
    }
    copy(b: Sphere3): Sphere3 {
        this.center.copy(b.center);
        this.radius = b.radius;
        return this;
    }
    clone(): Sphere3 {
        return new Sphere3(this.center, this.radius);
    }
}