import { Plane3 } from "../geometries/Plane3";
import type { Sphere3 } from "../geometries/Sphere3";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
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
        const [me0, me4, me8, me12,
            me1, me5, me9, me13,
            me2, me6, me10, me14,
            me3, me7, me11, me15] = projection.elements;
        const top = Plane3.from_Components(me3 - me1, me7 - me5, me11 - me9, -(me15 - me13));
        const right = Plane3.from_Components(me3 - me0, me7 - me4, me11 - me8, -(me15 - me12));
        const bottom = Plane3.from_Components(me3 + me1, me7 + me5, me11 + me9, -(me15 + me13));
        const left = Plane3.from_Components(me3 + me0, me7 + me4, me11 + me8, -(me15 + me12));
        const near = Plane3.from_Components(me3 + me2, me7 + me6, me11 + me10, -(me15 + me14));
        const far = Plane3.from_Components(me3 - me2, me7 - me6, me11 - me10, -(me15 - me14));
        return new Frustum3(top, right, bottom, left, near, far);
    }

    contain_Point(point: Vector3, touching?: boolean | undefined): boolean {
        if (this.near.is_PointBelow(point, !touching)) return false;
        if (this.top.is_PointBelow(point, !touching)) return false;
        if (this.right.is_PointBelow(point, !touching)) return false;
        if (this.bottom.is_PointBelow(point, !touching)) return false;
        if (this.left.is_PointBelow(point, !touching)) return false;
        if (this.far.is_PointBelow(point, !touching)) return false;
        return true;
    }

    contain_Sphere(sphere: Sphere3, touching?: boolean | undefined ): boolean {
        if (this.near.is_SphereBelow(sphere, !touching)) return false;
        if (this.top.is_SphereBelow(sphere, !touching)) return false;
        if (this.right.is_SphereBelow(sphere, !touching)) return false;
        if (this.bottom.is_SphereBelow(sphere, !touching)) return false;
        if (this.left.is_SphereBelow(sphere, !touching)) return false;
        if (this.far.is_SphereBelow(sphere, !touching)) return false;
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