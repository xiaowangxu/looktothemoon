import { Epsilon, is_ApproxZero } from "../Scalar";
import type { BvhShape } from "../bvh/BvhLike";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Vector3 } from "../linear_algebra/Vector3";
import { Box3 } from "./Box3";
import { Line3 } from "./Line3";
import type { Ray3 } from "./Ray3";
import type { TriangleLike } from "./TriangleLike";

export class Triangle3 implements TriangleLike<Vector3, Matrix3>, BvhShape<Vector3, Matrix3> {

    //#region init

    static get new() { return new Triangle3(Triangle3.#const_vector3_zero, Triangle3.#const_vector3_zero, Triangle3.#const_vector3_zero); }
    static create(p0: Vector3, p1: Vector3, p2: Vector3) { return new Triangle3(p0, p1, p2); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3();
    static readonly #tmp_vector3_1 = new Vector3();
    static readonly #tmp_vector3_2 = new Vector3();
    static readonly #tmp_vector3_3 = new Vector3();
    static readonly #tmp_vector3_4 = new Vector3();

    public readonly p0: Vector3;
    public readonly p1: Vector3;
    public readonly p2: Vector3;

    public get normal(): Vector3 {
        return this.get_Normal(new Vector3());
    }
    public get_Normal(target: Vector3): Vector3 {
        target.cross(
            Triangle3.#tmp_vector3_0.sub(this.p1, this.p0),
            Triangle3.#tmp_vector3_1.sub(this.p2, this.p0),
        );
        return target.normalize(target);
    }

    get center(): Vector3 {
        return new Vector3(
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
        this.p0 = p0.clone();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
    }

    equal(b: Triangle3): boolean {
        return this.p0.equal(b.p0) && this.p1.equal(b.p1) && this.p2.equal(b.p2);
    }

    set(p0: Vector3, p1: Vector3, p2: Vector3): Triangle3 {
        this.p0.copy(p0);
        this.p1.copy(p1);
        this.p2.copy(p2);
        return this;
    }
    copy(b: Triangle3): Triangle3 {
        this.p0.copy(b.p0);
        this.p1.copy(b.p1);
        this.p2.copy(b.p2);
        return this;
    }
    clone(): Triangle3 {
        return new Triangle3(this.p0, this.p1, this.p2);
    }

    public intersect_Ray(ray: Ray3, target: Vector3): Vector3 | undefined {
        // Möller–Trumbore intersection algorithm
        const edge1 = Triangle3.#tmp_vector3_0.sub(this.p1, this.p0);
        const edge2 = Triangle3.#tmp_vector3_1.sub(this.p2, this.p0);
        const ray_cross_e2 = Triangle3.#tmp_vector3_2.cross(ray.direction, edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined; // This ray is parallel to this triangle.

        const inv_det = 1.0 / det;

        const s = Triangle3.#tmp_vector3_3.sub(ray.origin, this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;

        const s_cross_e1 = Triangle3.#tmp_vector3_4.cross(s, edge1);
        const v = inv_det * ray.direction.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;

        // At this stage we can compute t to find out where the intersection point is on the line.
        const t = inv_det * edge2.dot(s_cross_e1);

        if (t > Epsilon) return ray.get_Point(t, target);// ray intersection

        // This means that there is a line intersection but not a ray intersection.
        return undefined;
    }

    public intersect_UncappedRay(ray: Ray3, target: Vector3): Vector3 | undefined {
        const edge1 = Triangle3.#tmp_vector3_0.sub(this.p1, this.p0);
        const edge2 = Triangle3.#tmp_vector3_1.sub(this.p2, this.p0);
        const ray_cross_e2 = Triangle3.#tmp_vector3_2.cross(ray.direction, edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined;
        const inv_det = 1.0 / det;
        const s = Triangle3.#tmp_vector3_3.sub(ray.origin, this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;
        const s_cross_e1 = Triangle3.#tmp_vector3_4.cross(s, edge1);
        const v = inv_det * ray.direction.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;
        const t = inv_det * edge2.dot(s_cross_e1);
        return ray.get_Point(t, target);
    }

    public intersect_Line(line: Line3, target: Vector3): Vector3 | undefined {
        const dir = line.direction;
        const max_t = line.length;
        const edge1 = Triangle3.#tmp_vector3_0.sub(this.p1, this.p0);
        const edge2 = Triangle3.#tmp_vector3_1.sub(this.p2, this.p0);
        const ray_cross_e2 = Triangle3.#tmp_vector3_2.cross(dir, edge2);
        const det = edge1.dot(ray_cross_e2);
        if (is_ApproxZero(det)) return undefined;
        const inv_det = 1.0 / det;
        const s = Triangle3.#tmp_vector3_3.sub(line.start, this.p0);
        const u = inv_det * s.dot(ray_cross_e2);
        if (u < 0 || u > 1) return undefined;
        const s_cross_e1 = Triangle3.#tmp_vector3_4.cross(s, edge1);
        const v = inv_det * dir.dot(s_cross_e1);
        if (v < 0 || u + v > 1) return undefined;
        const t = inv_det * edge2.dot(s_cross_e1);
        if (t > Epsilon && t <= max_t - Epsilon) return target.add_Scaled(line.start, t, dir);
        return undefined;
    }

    //#region Bvh

    get aabb(): Box3 {
        return new Box3(
            new Vector3(
                Math.min(this.p0.x, this.p1.x, this.p2.x),
                Math.min(this.p0.y, this.p1.y, this.p2.y),
                Math.min(this.p0.z, this.p1.z, this.p2.z),
            ),
            new Vector3(
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