import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import type { Vector3 } from "../linear_algebra/Vector3";
import type { RayLike } from "./RayLike";
import { Line3 } from "./Line3";
import { Epsilon } from "../Scalar";

export class Ray3 implements RayLike<Vector3, Matrix3> {
    public readonly origin: Vector3;
    public readonly direction: Vector3;

    constructor(origin: Vector3, direction: Vector3) {
        this.origin = origin;
        this.direction = direction;
    }

    public get_Point(distance: number): Vector3 {
        return this.origin.add_Scaled(distance, this.direction);
    }

    public get_Line(start: number, end: number): Line3 {
        return new Line3(this.get_Point(start), this.get_Point(end));
    }

    public apply_Matrix4(mat: Matrix4, non_uniform_scale: boolean = false) {
        return new Ray3(
            this.origin.apply_Matrix4(mat),
            non_uniform_scale ?
                this.direction.transform(mat.basis).normalize() :
                this.direction.transform(mat.basis.inverse().transpose()).normalize()
        );
    }

    public get_ClosestPointUncapped(p: Vector3): Vector3 {
        const _p = p.sub(this.origin);
        const n = this.direction;
        const l2 = n.squared_length;
        if (l2 < Epsilon) {
            return this.origin.clone(); // Both points are the same, just give any.
        }
        const d = n.dot(_p) / l2;
        return this.origin.add_Scaled(d, n); // Inside.
    }

    public get_ClosestPointsUncapped(l1: Ray3): [p0: Vector3, p1: Vector3] {
        const r1 = this.origin.clone();
        const r2 = l1.origin.clone();
        const e1 = this.direction.clone();
        const e2 = l1.direction.clone();

        const n = e1.cross(e2);

        if (n.length < Epsilon) {
            return [r1, l1.get_ClosestPointUncapped(r1)];
        }

        const n_length_sq = n.squared_length;
        const r = r2.sub(r1);

        const t1 = e2.cross(n).dot(r) / (n_length_sq);
        const t2 = e1.cross(n).dot(r) / (n_length_sq);

        return [r1.add_Scaled(t1, e1), r2.add_Scaled(t2, e2)];
    }
}

export function ray3(origin: Vector3, direction: Vector3) {
    return new Ray3(origin, direction);
}