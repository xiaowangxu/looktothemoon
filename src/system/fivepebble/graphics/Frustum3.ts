import type { Box3 } from "../geometries/Box3";
import { Plane3, plane3 } from "../geometries/Plane3";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3, vec3 } from "../linear_algebra/Vector3";
import type { FrustumLike } from "./FrustumLike";

export class Frustum3 implements FrustumLike<Vector3, Matrix3> {
    public readonly top: Plane3;
    public readonly right: Plane3;
    public readonly bottom: Plane3;
    public readonly left: Plane3;
    public readonly near: Plane3;
    public readonly far: Plane3;

    constructor(top: Plane3, right: Plane3, bottom: Plane3, left: Plane3, near: Plane3, far: Plane3) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
        this.near = near;
        this.far = far;
    }

    public static from_Projection(projection: Matrix4) {
        // https://web.archive.org/web/20061020020112/https://www2.ravensoft.com/users/ggribb/plane%20extraction.pdf
        // notice that we use ax + by + cz = d as plane equation in Plane3
        // so the distance should be negated compared to the code in the web page
        // use column-major data
        const me0 = projection.n11, me4 = projection.n12, me8 = projection.n13, me12 = projection.n14;
        const me1 = projection.n21, me5 = projection.n22, me9 = projection.n23, me13 = projection.n24;
        const me2 = projection.n31, me6 = projection.n32, me10 = projection.n33, me14 = projection.n34;
        const me3 = projection.n41, me7 = projection.n42, me11 = projection.n43, me15 = projection.n44;
        const top = Plane3.from_Components(me3 - me1, me7 - me5, me11 - me9, -(me15 - me13));
        const right = Plane3.from_Components(me3 - me0, me7 - me4, me11 - me8, -(me15 - me12));
        const bottom = Plane3.from_Components(me3 + me1, me7 + me5, me11 + me9, -(me15 + me13));
        const left = Plane3.from_Components(me3 + me0, me7 + me4, me11 + me8, -(me15 + me12));
        const near = Plane3.from_Components(me3 + me2, me7 + me6, me11 + me10, -(me15 + me14));
        const far = Plane3.from_Components(me3 - me2, me7 - me6, me11 - me10, -(me15 - me14));
        return new Frustum3(top, right, bottom, left, near, far);
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

    static #point: Vector3 = new Vector3();

    contain_Box(box: Box3, check_empty: boolean = true): boolean {
        if (check_empty && box.is_empty) return false;
        const p = Frustum3.#point;
        const near = this.near;
        {
            p.set(near.normal.x > 0 ? box.max.x : box.min.x, near.normal.y > 0 ? box.max.y : box.min.y, near.normal.z > 0 ? box.max.z : box.min.z);
            if (near.signed_distance_to_Point(p) < 0) return false;
        }
        const far = this.far;
        {
            p.set(far.normal.x > 0 ? box.max.x : box.min.x, far.normal.y > 0 ? box.max.y : box.min.y, far.normal.z > 0 ? box.max.z : box.min.z);
            if (far.signed_distance_to_Point(p) < 0) return false;
        }
        const left = this.left;
        {
            p.set(left.normal.x > 0 ? box.max.x : box.min.x, left.normal.y > 0 ? box.max.y : box.min.y, left.normal.z > 0 ? box.max.z : box.min.z);
            if (left.signed_distance_to_Point(p) < 0) return false;
        }
        const right = this.right;
        {
            p.set(right.normal.x > 0 ? box.max.x : box.min.x, right.normal.y > 0 ? box.max.y : box.min.y, right.normal.z > 0 ? box.max.z : box.min.z);
            if (right.signed_distance_to_Point(p) < 0) return false;
        }
        const top = this.top;
        {
            p.set(top.normal.x > 0 ? box.max.x : box.min.x,
                top.normal.y > 0 ? box.max.y : box.min.y, top.normal.z > 0 ? box.max.z : box.min.z);
            if (top.signed_distance_to_Point(p) < 0) return false;
        }
        const bottom = this.bottom;
        {
            p.set(bottom.normal.x > 0 ? box.max.x : box.min.x, bottom.normal.y > 0 ? box.max.y : box.min.y, bottom.normal.z > 0 ? box.max.z : box.min.z);
            if (bottom.signed_distance_to_Point(p) < 0) return false;
        }
        return true;
    }

    public apply_Matrix4(mat: Matrix4, non_uniform_scale: boolean = false) {
        return new Frustum3(
            this.top.apply_Matrix4(mat, non_uniform_scale),
            this.right.apply_Matrix4(mat, non_uniform_scale),
            this.bottom.apply_Matrix4(mat, non_uniform_scale),
            this.left.apply_Matrix4(mat, non_uniform_scale),
            this.near.apply_Matrix4(mat, non_uniform_scale),
            this.far.apply_Matrix4(mat, non_uniform_scale),
        );
    }
}

export function frustum3(
    top: Plane3 = plane3(vec3(0, -1, 0), -1),
    right: Plane3 = plane3(vec3(-1, 0, 0), -1),
    bottom: Plane3 = plane3(vec3(0, 1, 0), -1),
    left: Plane3 = plane3(vec3(1, 0, 0), -1),
    near: Plane3 = plane3(vec3(0, 0, 1), -1),
    far: Plane3 = plane3(vec3(0, 0, -1), -1),
) {
    return new Frustum3(top, right, bottom, left, near, far);
}