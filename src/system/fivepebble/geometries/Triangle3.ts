import { Epsilon, is_ApproxZero } from "../Scalar";
import type { AABB, BvhShape } from "../bvh/BvhLike";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { vec3, type Vector3 } from "../linear_algebra/Vector3";
import { Box3, box3 } from "./Box3";
import { Line3 } from "./Line3";
import type { Ray3 } from "./Ray3";
import type { RaycastResult, RaycastSide } from "./GeometryLike";
import type { TriangleLike } from "./TriangleLike";

export class Triangle3 implements TriangleLike<Vector3, Matrix3>, BvhShape<Vector3, Matrix3> {
    public readonly p0: Vector3;
    public readonly p1: Vector3;
    public readonly p2: Vector3;

    get normal(): Vector3 {
        return (this.p1.sub(this.p0)).cross(this.p2.sub(this.p0));
    }


    get center(): Vector3 {
        return vec3(
            (this.p0.x, this.p1.x, this.p2.x) / 3,
            (this.p0.y, this.p1.y, this.p2.y) / 3,
            (this.p0.z, this.p1.z, this.p2.z) / 3,
        );
    }
    get_Center(target: Vector3): Vector3 {
        return target.set(
            (this.p0.x, this.p1.x, this.p2.x) / 3,
            (this.p0.y, this.p1.y, this.p2.y) / 3,
            (this.p0.z, this.p1.z, this.p2.z) / 3,
        );
    }

    constructor(p0: Vector3, p1: Vector3, p2: Vector3) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    equal(b: Triangle3): boolean {
        return this.p0.equal(b.p0) && this.p1.equal(b.p1) && this.p2.equal(b.p2);
    }
    copy(b: Triangle3): Triangle3 {
        this.p0.copy(b.p0);
        this.p1.copy(b.p1);
        this.p2.copy(b.p2);
        return this;
    }
    set(p0: Vector3, p1: Vector3, p2: Vector3): Triangle3 {
        this.p0.copy(p0);
        this.p1.copy(p1);
        this.p2.copy(p2);
        return this;
    }
    clone(): Triangle3 {
        return new Triangle3(this.p0.clone(), this.p1.clone(), this.p2.clone());
    }

    public intersect_Ray(ray: Ray3): Vector3 | undefined {
        // Möller–Trumbore intersection algorithm
        const edge1 = this.p1.sub(this.p0);
        const edge2 = this.p2.sub(this.p0);
        const ray_cross_e2 = ray.direction.cross(edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined; // This ray is parallel to this triangle.

        const inv_det = 1.0 / det;

        const s = ray.origin.sub(this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;

        const s_cross_e1 = s.cross(edge1);
        const v = inv_det * ray.direction.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;

        // At this stage we can compute t to find out where the intersection point is on the line.
        const t = inv_det * edge2.dot(s_cross_e1);

        if (t > Epsilon) return ray.get_Point(t);// ray intersection

        // This means that there is a line intersection but not a ray intersection.
        return undefined;
    }

    public intersect_UncappedRay(ray: Ray3): Vector3 | undefined {
        const edge1 = this.p1.sub(this.p0);
        const edge2 = this.p2.sub(this.p0);
        const ray_cross_e2 = ray.direction.cross(edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined;
        const inv_det = 1.0 / det;
        const s = ray.origin.sub(this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;
        const s_cross_e1 = s.cross(edge1);
        const v = inv_det * ray.direction.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;
        const t = inv_det * edge2.dot(s_cross_e1);
        return ray.get_Point(t);
    }

    public intersect_Line(line: Line3): Vector3 | undefined {
        const dir = line.direction;
        const max_t = line.length;
        const edge1 = this.p1.sub(this.p0);
        const edge2 = this.p2.sub(this.p0);
        const ray_cross_e2 = line.start.cross(edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined;
        const inv_det = 1.0 / det;
        const s = line.start.sub(this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;
        const s_cross_e1 = s.cross(edge1);
        const v = inv_det * dir.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;
        const t = inv_det * edge2.dot(s_cross_e1);
        if (t > Epsilon && t <= max_t - Epsilon) return line.start.add_Scaled(t, dir);
        return undefined;
    }

    //#region Bvh

    get aabb(): Box3 {
        return box3(
            vec3(
                Math.min(this.p0.x, this.p1.x, this.p2.x),
                Math.min(this.p0.y, this.p1.y, this.p2.y),
                Math.min(this.p0.z, this.p1.z, this.p2.z),
            ),
            vec3(
                Math.max(this.p0.x, this.p1.x, this.p2.x),
                Math.max(this.p0.y, this.p1.y, this.p2.y),
                Math.max(this.p0.z, this.p1.z, this.p2.z),
            ),
        );
    }
    get_AABB(target: Box3): Box3 {
        target.min.set(
            Math.min(this.p0.x, this.p1.x, this.p2.x),
            Math.min(this.p0.y, this.p1.y, this.p2.y),
            Math.min(this.p0.z, this.p1.z, this.p2.z),
        );
        target.max.set(
            Math.max(this.p0.x, this.p1.x, this.p2.x),
            Math.max(this.p0.y, this.p1.y, this.p2.y),
            Math.max(this.p0.z, this.p1.z, this.p2.z),
        );
        return target;
    }

    //#endregion
}

export function triangle3(p0: Vector3, p1: Vector3, p2: Vector3) {
    return new Triangle3(p0, p1, p2);
}