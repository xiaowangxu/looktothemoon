import type { Box3 } from "../geometries/Box3";
import { Plane3 } from "../geometries/Plane3";
import type { PlaneLike } from "../geometries/PlaneLike";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { FrustumLike } from "./FrustumLike";

export class Frustum3 implements FrustumLike<Vector3, Matrix3> {

    //#region init

    static get new() {
        return new Frustum3(
            Frustum3.#const_plane3_top,
            Frustum3.#const_plane3_right,
            Frustum3.#const_plane3_bottom,
            Frustum3.#const_plane3_left,
            Frustum3.#const_plane3_near,
            Frustum3.#const_plane3_far,
        );
    }
    static create(top: Plane3, right: Plane3, bottom: Plane3, left: Plane3, near: Plane3, far: Plane3) {
        return new Frustum3(top, right, bottom, left, near, far);
    }

    //#endregion

    static readonly #const_plane3_top: Plane3 = new Plane3(new Vector3(0, -1, 0), -1);
    static readonly #const_plane3_right: Plane3 = new Plane3(new Vector3(-1, 0, 0), -1);
    static readonly #const_plane3_bottom: Plane3 = new Plane3(new Vector3(0, 1, 0), -1);
    static readonly #const_plane3_left: Plane3 = new Plane3(new Vector3(1, 0, 0), -1);
    static readonly #const_plane3_near: Plane3 = new Plane3(new Vector3(0, 0, 1), -1);
    static readonly #const_plane3_far: Plane3 = new Plane3(new Vector3(0, 0, -1), -1);
    static readonly #tmp_vector3_0: Vector3 = new Vector3();

    public readonly top: Plane3;
    public readonly right: Plane3;
    public readonly bottom: Plane3;
    public readonly left: Plane3;
    public readonly near: Plane3;
    public readonly far: Plane3;

    constructor(top: Plane3, right: Plane3, bottom: Plane3, left: Plane3, near: Plane3, far: Plane3) {
        this.top = top.clone();
        this.right = right.clone();
        this.bottom = bottom.clone();
        this.left = left.clone();
        this.near = near.clone();
        this.far = far.clone();
    }

    public set_Projection(projection: Matrix4) {
        const me0 = projection.n11, me4 = projection.n12, me8 = projection.n13, me12 = projection.n14;
        const me1 = projection.n21, me5 = projection.n22, me9 = projection.n23, me13 = projection.n24;
        const me2 = projection.n31, me6 = projection.n32, me10 = projection.n33, me14 = projection.n34;
        const me3 = projection.n41, me7 = projection.n42, me11 = projection.n43, me15 = projection.n44;
        this.top.set_Components(me3 - me1, me7 - me5, me11 - me9, -(me15 - me13));
        this.right.set_Components(me3 - me0, me7 - me4, me11 - me8, -(me15 - me12));
        this.bottom.set_Components(me3 + me1, me7 + me5, me11 + me9, -(me15 + me13));
        this.left.set_Components(me3 + me0, me7 + me4, me11 + me8, -(me15 + me12));
        this.near.set_Components(me3 + me2, me7 + me6, me11 + me10, -(me15 + me14));
        this.far.set_Components(me3 - me2, me7 - me6, me11 - me10, -(me15 - me14));
        return this;
    }

    contain_Point(point: Vector3): boolean {
        if (this.near.is_PointBelow(point, false)) return false;
        if (this.top.is_PointBelow(point, false)) return false;
        if (this.right.is_PointBelow(point, false)) return false;
        if (this.bottom.is_PointBelow(point, false)) return false;
        if (this.left.is_PointBelow(point, false)) return false;
        if (this.far.is_PointBelow(point, false)) return false;
        return true;
    }

    equal(b: Frustum3): boolean {
        return this.top.equal(b.top) && this.right.equal(b.right) && this.bottom.equal(b.bottom) && this.left.equal(b.left) && this.near.equal(b.near) && this.far.equal(b.far);
    }

    set(top: Plane3, right: Plane3, bottom: Plane3, left: Plane3, near: Plane3, far: Plane3): Frustum3 {
        this.top.copy(top);
        this.right.copy(right);
        this.bottom.copy(bottom);
        this.left.copy(left);
        this.near.copy(near);
        this.far.copy(far);
        return this;
    }
    copy(b: Frustum3): Frustum3 {
        this.top.copy(b.top);
        this.right.copy(b.right);
        this.bottom.copy(b.bottom);
        this.left.copy(b.left);
        this.near.copy(b.near);
        this.far.copy(b.far);
        return this;
    }
    clone(): Frustum3 {
        return new Frustum3(this.top, this.right, this.bottom, this.left, this.near, this.far);
    }
}