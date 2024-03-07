import { Epsilon } from "../Scalar";
import type { BvhShape } from "../bvh/BvhLike";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { BoxLike } from "./BoxLike";
import type { LineLike } from "./LineLike";
import type { RayLike } from "./RayLike";

export class Box3 implements BoxLike<Vector3, Matrix3>, BvhShape<Vector3, Matrix3> {

    //#region init

    static get new() { return new Box3(Box3.#const_vector3_zero, Box3.#const_vector3_zero); }
    static create(min: Vector3, max: Vector3) { return new Box3(min, max); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3();
    static readonly #tmp_vector3_1 = new Vector3();
    static readonly #tmp_vector3_2 = new Vector3();
    static readonly #tmp_vector3_3 = new Vector3();
    static readonly #tmp_vector3_4 = new Vector3();
    static readonly #tmp_vector3_5 = new Vector3();
    static readonly #tmp_vector3_6 = new Vector3();
    static readonly #tmp_vector3_7 = new Vector3();

    public readonly min: Vector3;
    public readonly max: Vector3;

    get size() { return Vector3.new.sub(this.max, this.min); }
    get_Size(target: Vector3): Vector3 {
        target.x = this.max.x - this.min.x;
        target.y = this.max.y - this.min.y;
        target.z = this.max.z - this.min.z;
        return target;
    }

    get center(): Vector3 { return this.get_Center(Vector3.new); }
    get_Center(target: Vector3): Vector3 {
        target.x = (this.min.x + this.max.x) / 2;
        target.y = (this.min.y + this.max.y) / 2;
        target.z = (this.min.z + this.max.z) / 2;
        return target;
    }

    public get is_empty() { return this.min.x >= this.max.x && this.min.y >= this.max.y && this.min.z >= this.max.z; }

    constructor(min: Vector3, max: Vector3) {
        this.min = min.clone();
        this.max = max.clone();
    }

    public set_Points(points: Vector3[]) {
        const length = points.length;
        if (length === 0) {
            this.min.set(0, 0, 0);
            this.max.set(0, 0, 0);
            return this;
        }
        const point0 = points[0];
        this.min.copy(point0);
        this.max.copy(point0);
        if (length === 1) return this;
        for (let i = 1; i < length; i++) {
            const point = points[i];
            this.min.min(this.min, point);
            this.max.max(this.max, point);
        }
        return this;
    }

    // #region Geometry Bounded

    signed_distance_to_Point(point: Vector3): number {
        const center = this.get_Center(Box3.#tmp_vector3_0);
        const p = center.sub(point, center);
        const half_size = this.get_Size(Box3.#tmp_vector3_1);
        half_size.div_Number(half_size, 2);
        const edge_distance = p.abs(p).sub(p, half_size);
        const outside_distance = edge_distance.max(edge_distance, Box3.#const_vector3_zero).length;
        const inside_distance = Math.min(0, edge_distance.max_component);
        return outside_distance + inside_distance;
    }

    distance_to_Point(point: Vector3): number {
        return Math.abs(this.signed_distance_to_Point(point));
    }

    project_Point(point: Vector3, target: Vector3): Vector3 {
        throw new Error('not impl');
        // const { x, y, z } = point;
        // const { x: min_x, y: min_y, z: min_z } = this.min;
        // const { x: max_x, y: max_y, z: max_z } = this.max;
        // let is_inside = true;
        // // x
        // if (x > max_x) {
        //     target.x = max_x;
        //     is_inside = false;
        // }
        // else if (x < min_x) {
        //     target.x = min_x;
        //     is_inside = false;
        // }
        // else target.x = x;
        // // y
        // if (y > max_y) {
        //     target.y = max_y;
        //     is_inside = false;
        // }
        // else if (y < min_y) {
        //     target.y = min_y;
        //     is_inside = false;
        // }
        // else target.y = y;
        // // z
        // if (z > max_z) {
        //     target.z = max_z;
        //     is_inside = false;
        // }
        // else if (z < min_z) {
        //     target.z = min_z;
        //     is_inside = false;
        // }
        // else target.z = z;

        // if (!is_inside) return target;
        // // inside

    }

    // #endregion

    enlarge(a: Box3, amount: number): Box3 {
        this.min.sub_Number(a.min, amount);
        this.max.add_Number(a.max, amount);
        return this;
    }
    merge(a: Box3, b: Box3): Box3 {
        this.min.min(a.min, b.min);
        this.max.max(a.max, b.max);
        return this;
    }
    fit(a: Box3, b: Vector3): Box3 {
        this.min.min(a.min, b);
        this.max.max(a.max, b);
        return this;
    }

    public touch_Line(line: LineLike<Vector3, Matrix3>): boolean {
        // separating axis theorem
        const p1 = line.start, p2 = line.end;
        const max = this.max, min = this.min;
        const d_x = (p2.x - p1.x) / 2, d_y = (p2.y - p1.y) / 2, d_z = (p2.z - p1.z) / 2;
        const e_x = (max.x - min.x) / 2, e_y = (max.y - min.y) / 2, e_z = (max.z - min.z) / 2;
        const c_x = p1.x + d_x - (min.x + max.x) / 2;
        const c_y = p1.y + d_y - (min.y + max.y) / 2;
        const c_z = p1.z + d_z - (min.z + max.z) / 2;
        const ad_x = Math.abs(d_x);
        const ad_y = Math.abs(d_y);
        const ad_z = Math.abs(d_z);
        if (Math.abs(c_x) > e_x + ad_x) return false;
        if (Math.abs(c_y) > e_y + ad_y) return false;
        if (Math.abs(c_z) > e_z + ad_z) return false;
        if (Math.abs(d_y * c_z - d_z * c_y) > e_y * ad_z + e_z * ad_y + Epsilon) return false;
        if (Math.abs(d_z * c_x - d_x * c_z) > e_z * ad_x + e_x * ad_z + Epsilon) return false;
        if (Math.abs(d_x * c_y - d_y * c_x) > e_x * ad_y + e_y * ad_x + Epsilon) return false;
        return true;
    }

    public touch_Ray(ray: RayLike<Vector3, Matrix3>): boolean {
        const vmin = this.min, vmax = this.max;
        const rdir = ray.direction, rpos = ray.origin;
        const t1 = (vmin.x - rpos.x) / rdir.x;
        const t2 = (vmax.x - rpos.x) / rdir.x;
        const t3 = (vmin.y - rpos.y) / rdir.y;
        const t4 = (vmax.y - rpos.y) / rdir.y;
        const t5 = (vmin.z - rpos.z) / rdir.z;
        const t6 = (vmax.z - rpos.z) / rdir.z;
        const aMin = t1 < t2 ? t1 : t2;
        const bMin = t3 < t4 ? t3 : t4;
        const cMin = t5 < t6 ? t5 : t6;
        const aMax = t1 > t2 ? t1 : t2;
        const bMax = t3 > t4 ? t3 : t4;
        const cMax = t5 > t6 ? t5 : t6;
        const fMax = aMin > bMin ? aMin : bMin;
        const fMin = aMax < bMax ? aMax : bMax;
        const t7 = fMax > cMin ? fMax : cMin;
        const t8 = fMin < cMax ? fMin : cMax;
        return (t8 < 0 || t7 > t8) ? false : t7 > 0;
    }

    public apply_Matrix4(a: Box3, mat: Matrix4): Box3 {
        if (a.min.x >= a.max.x && a.min.y >= a.max.y && a.min.z >= a.max.z) {
            this.min.set(0, 0, 0);
            this.max.set(0, 0, 0);
            return this;
        }
        const p0 = Box3.#tmp_vector3_0;
        const p1 = Box3.#tmp_vector3_1;
        const p2 = Box3.#tmp_vector3_2;
        const p3 = Box3.#tmp_vector3_3;
        const p4 = Box3.#tmp_vector3_4;
        const p5 = Box3.#tmp_vector3_5;
        const p6 = Box3.#tmp_vector3_6;
        const p7 = Box3.#tmp_vector3_7;
        p0.set(a.min.x, a.min.y, a.min.z).apply_Matrix4(p0, mat); // 000
        p1.set(a.min.x, a.min.y, a.max.z).apply_Matrix4(p1, mat); // 001
        p2.set(a.min.x, a.max.y, a.min.z).apply_Matrix4(p2, mat); // 010
        p3.set(a.min.x, a.max.y, a.max.z).apply_Matrix4(p3, mat); // 011
        p4.set(a.max.x, a.min.y, a.min.z).apply_Matrix4(p4, mat); // 100
        p5.set(a.max.x, a.min.y, a.max.z).apply_Matrix4(p5, mat); // 101
        p6.set(a.max.x, a.max.y, a.min.z).apply_Matrix4(p6, mat); // 110
        p7.set(a.max.x, a.max.y, a.max.z).apply_Matrix4(p7, mat); // 111
        this.min.x = Math.min(p0.x, p1.x, p2.x, p3.x, p4.x, p5.x, p6.x, p7.x);
        this.min.y = Math.min(p0.y, p1.y, p2.y, p3.y, p4.y, p5.y, p6.y, p7.y);
        this.min.z = Math.min(p0.z, p1.z, p2.z, p3.z, p4.z, p5.z, p6.z, p7.z);
        this.max.x = Math.max(p0.x, p1.x, p2.x, p3.x, p4.x, p5.x, p6.x, p7.x);
        this.max.y = Math.max(p0.y, p1.y, p2.y, p3.y, p4.y, p5.y, p6.y, p7.y);
        this.max.z = Math.max(p0.z, p1.z, p2.z, p3.z, p4.z, p5.z, p6.z, p7.z);
        return this;
    }

    equal(b: Box3): boolean {
        return this.min.equal(b.min) && this.max.equal(b.max);
    }

    set(min: Vector3, max: Vector3) {
        this.min.x = min.x;
        this.min.y = min.y;
        this.min.z = min.z;
        this.max.x = max.x;
        this.max.y = max.y;
        this.max.z = max.z;
        return this;
    }
    copy(b: Box3): Box3 {
        this.min.x = b.min.x;
        this.min.y = b.min.y;
        this.min.z = b.min.z;
        this.max.x = b.max.x;
        this.max.y = b.max.y;
        this.max.z = b.max.z;
        return this;
    }
    clone(): Box3 {
        return new Box3(this.min, this.max);
    }

    //#region Bvh

    get aabb(): Box3 {
        return this.clone();
    }
    get_AABB(target: Box3): Box3 {
        return target.copy(this);
    }

    //#endregion
}