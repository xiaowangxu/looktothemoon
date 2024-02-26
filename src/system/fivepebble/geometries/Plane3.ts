import type { PlaneLike } from "./PlaneLike";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import type { Line3 } from "./Line3";
import type { Ray3 } from "./Ray3";
import type { Sphere3 } from "./Sphere3";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Epsilon, is_ApproxZero } from "../Scalar";
import { Vector3 } from "../linear_algebra/Vector3";

export class Plane3 implements PlaneLike<Vector3, Matrix3>  {
    // ax + by + cz = d
    // where point = (x, y, z)
    //       normal = (a, b, c)
    //       distance = ax + by + cz = d = n * p
    public normal: Vector3;
    public distance: number;

    get center() { return this.normal.mult_Number(this.distance); }
    get_Center(target: Vector3): Vector3 {
        return target.mults_Number(this.normal, this.distance);
    }

    constructor(normal: Vector3, distance: number) {
        this.normal = normal;
        this.distance = distance;
    }

    public static from_PointAndNormal(point: Vector3, normal: Vector3) {
        return new Plane3(normal, normal.dot(point));
    }

    public set_PointAndNormal(point: Vector3, normal: Vector3) {
        this.normal.copy(normal);
        this.distance = normal.dot(point);
        return this;
    }

    public static from_Points(a: Vector3, b: Vector3, c: Vector3, clockwise: boolean = false) {
        if (clockwise) {
            const normal = (a.sub(c)).cross(a.sub(b)).normalize();
            return new Plane3(normal, normal.dot(a));
        } else {
            const normal = (a.sub(b)).cross(a.sub(c)).normalize();
            return new Plane3(normal, normal.dot(a));
        }
    }

    static #vector3_0 = Vector3.make_Zero();
    static #vector3_1 = Vector3.make_Zero();

    public set_Points(a: Vector3, b: Vector3, c: Vector3, clockwise: boolean = false) {
        const vetcor3_0 = Plane3.#vector3_0;
        const vetcor3_1 = Plane3.#vector3_1;
        const a_sub_c = vetcor3_0.subs(a, c);
        const a_sub_b = vetcor3_1.subs(a, b);
        if (clockwise) {
            this.normal.crosses(a_sub_c, a_sub_b);
            this.normal.normalizes(this.normal);
        } else {
            this.normal.crosses(a_sub_b, a_sub_c);
            this.normal.normalizes(this.normal);
        }
        this.distance = this.normal.dot(a);
        return this;
    }

    public static from_Components(x: number, y: number, z: number, d: number) {
        const normal = new Vector3(x, y, z);
        const length = normal.length;
        return new Plane3(normal.div_Number(length), d / length);
    }

    public set_Components(x: number, y: number, z: number, d: number) {
        this.normal.set(x, y, z);
        const length = this.normal.length;
        this.normal.normalizes(this.normal);
        this.distance = d / length;
        return this;
    }

    // #region Geometry Bounded

    signed_distance_to_Point(point: Vector3) {
        return this.normal.dot(point) - this.distance;
    }

    distance_to_Point(point: Vector3) {
        return Math.abs(this.normal.dot(point) - this.distance);
    }

    project_Point(point: Vector3) {
        return point.add_Scaled(-this.signed_distance_to_Point(point), this.normal);
    }

    // #endregion

    public apply_Matrix4(mat: Matrix4, non_uniform_scale: boolean = false) {
        const point = this.normal.mult_Number(this.distance).apply_Matrix4(mat);
        const normal = this.normal.transform(
            non_uniform_scale ?
                mat.basis :
                mat.basis.inverse().transpose()
        ).normalize();
        const distance = normal.dot(point);
        return new Plane3(normal, distance);
    }

    public is_PointOver(point: Vector3, touching: boolean = false) {
        return touching ?
            (this.normal.dot(point) > (this.distance - Epsilon)) :
            (this.normal.dot(point) > this.distance);
    }

    public is_PointBelow(point: Vector3, touching: boolean = false) {
        return touching ?
            (-this.normal.dot(point) > (this.distance - Epsilon)) :
            (-this.normal.dot(point) > this.distance);
    }

    public is_SphereOver(sphere: Sphere3, touching: boolean = false) {
        const signed_distance = this.signed_distance_to_Point(sphere.center);
        return signed_distance > (touching ? (sphere.radius - Epsilon) : sphere.radius);
    }

    public is_SphereBelow(sphere: Sphere3, touching: boolean = false) {
        const signed_distance = -this.signed_distance_to_Point(sphere.center);
        return signed_distance > (touching ? (sphere.radius - Epsilon) : sphere.radius);
    }

    // intersect

    public intersect_Point(point: Vector3) {
        return is_ApproxZero(this.normal.dot(point) - this.distance);
    }

    public intersect_Planes(plane1: Plane3, plane2: Plane3): Vector3 | undefined {
        const plane0 = this;
        const normal0 = plane0.normal;
        const normal1 = plane1.normal;
        const normal2 = plane2.normal;
        const denom = normal0.cross(normal1).dot(normal2);
        if (is_ApproxZero(denom)) {
            return undefined;
        }
        const r_result =
            normal1.cross(normal2).mult_Number(plane0.distance)
                .add(
                    normal2.cross(normal0).mult_Number(plane1.distance)
                )
                .add(
                    normal0.cross(normal1).mult_Number(plane2.distance)
                )
                .div_Number(denom);
        return r_result;
    }

    public intersect_Ray(ray: Ray3): Vector3 | undefined {
        const segment = ray.direction;
        const den = this.normal.dot(segment);
        if (is_ApproxZero(den)) {
            return undefined;
        }
        const dist = (this.normal.dot(ray.origin) - this.distance) / den;
        if (dist > Epsilon) { //this is a ray, before the emitting pos (p_from) doesn't exist
            return undefined;
        }
        return ray.origin.add_Scaled(-dist, segment);
    }

    public intersect_UncappedRay(ray: Ray3): Vector3 | undefined {
        const segment = ray.direction;
        const den = this.normal.dot(segment);
        if (is_ApproxZero(den)) {
            return undefined;
        }
        const dist = (this.normal.dot(ray.origin) - this.distance) / den;
        return ray.origin.add_Scaled(-dist, segment);
    }

    public intersect_Line(line: Line3): Vector3 | undefined {
        const segment = line.start.sub(line.end);
        const den = this.normal.dot(segment);
        if (is_ApproxZero(den)) {
            return undefined;
        }
        const dist = (this.normal.dot(line.start) - this.distance) / den;
        if (dist < -Epsilon || dist > (1 + Epsilon)) {
            return undefined;
        }
        return line.start.add_Scaled(-dist, segment);
    }
}

export function plane3(normal: Vector3, distance: number) {
    return new Plane3(normal, distance);
}