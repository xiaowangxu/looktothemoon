import type { BvhShape } from "../bvh/BvhLike";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { BoxLike } from "./BoxLike";

export class Box3 implements BoxLike<Vector3, Matrix3>, BvhShape<Vector3, Matrix3> {

    //#region init

    static get new() { return new Box3(Box3.#const_vector3_zero, Box3.#const_vector3_zero); }
    static create(min: Vector3, max: Vector3) { return new Box3(min, max); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);

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

    static readonly #points: [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

    public apply_Matrix4(a: Box3, mat: Matrix4): Box3 {
        if (a.min.x >= a.max.x && a.min.y >= a.max.y && a.min.z >= a.max.z) {
            this.min.set(0, 0, 0);
            this.max.set(0, 0, 0);
            return this;
        }
        const p0 = Box3.#points[0];
        const p1 = Box3.#points[1];
        const p2 = Box3.#points[2];
        const p3 = Box3.#points[3];
        const p4 = Box3.#points[4];
        const p5 = Box3.#points[5];
        const p6 = Box3.#points[6];
        const p7 = Box3.#points[7];
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
        return new Box3(this.min.clone(), this.max.clone());
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