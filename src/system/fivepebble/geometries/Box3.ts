import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { BoxLike } from "./BoxLike";

export class Box3 implements BoxLike<Vector3, Matrix3> {
    public readonly min: Vector3;
    public readonly max: Vector3;

    public get size() { return this.max.sub(this.min); }
    public get is_empty() { return this.min.x >= this.max.x || this.min.y >= this.max.y || this.min.z >= this.max.z; }

    constructor(min: Vector3 = new Vector3(), max: Vector3 = new Vector3()) {
        this.min = min;
        this.max = max;
    }

    public static from_Points(points: Vector3[]) {
        const length = points.length;
        if (length === 0) return new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        const point0 = points[0];
        if (length === 1) return new Box3(point0, point0);
        let min = point0;
        let max = point0;
        for (let i = 1; i < length; i++) {
            const point = points[i];
            min = min.min(point);
            max = max.max(point);
        }
        return new Box3(min, max);
    }

    enlarge(amount: number): BoxLike<Vector3, Matrix3> {
        return new Box3(this.min.sub_Number(amount), this.max.add_Number(amount));
    }

    static #points: [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];

    public apply_Matrix4(mat: Matrix4): Box3 {
        if (this.min.x >= this.max.x || this.min.y >= this.max.y || this.min.z >= this.max.z) return new Box3();
        const p0 = Box3.#points[0];
        const p1 = Box3.#points[1];
        const p2 = Box3.#points[2];
        const p3 = Box3.#points[3];
        const p4 = Box3.#points[4];
        const p5 = Box3.#points[5];
        const p6 = Box3.#points[6];
        const p7 = Box3.#points[7];
        p0.set(this.min.x, this.min.y, this.min.z).applys_Matrix4(p0, mat); // 000
        p1.set(this.min.x, this.min.y, this.max.z).applys_Matrix4(p1, mat); // 001
        p2.set(this.min.x, this.max.y, this.min.z).applys_Matrix4(p2, mat); // 010
        p3.set(this.min.x, this.max.y, this.max.z).applys_Matrix4(p3, mat); // 011
        p4.set(this.max.x, this.min.y, this.min.z).applys_Matrix4(p4, mat); // 100
        p5.set(this.max.x, this.min.y, this.max.z).applys_Matrix4(p5, mat); // 101
        p6.set(this.max.x, this.max.y, this.min.z).applys_Matrix4(p6, mat); // 110
        p7.set(this.max.x, this.max.y, this.max.z).applys_Matrix4(p7, mat); // 111
        return Box3.from_Points(Box3.#points);
    }
    public applys_Matrix4(a: Box3, mat: Matrix4): Box3 {
        if (a.min.x >= a.max.x || a.min.y >= a.max.y || a.min.z >= a.max.z) {
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
        p0.set(a.min.x, a.min.y, a.min.z).applys_Matrix4(p0, mat); // 000
        p1.set(a.min.x, a.min.y, a.max.z).applys_Matrix4(p1, mat); // 001
        p2.set(a.min.x, a.max.y, a.min.z).applys_Matrix4(p2, mat); // 010
        p3.set(a.min.x, a.max.y, a.max.z).applys_Matrix4(p3, mat); // 011
        p4.set(a.max.x, a.min.y, a.min.z).applys_Matrix4(p4, mat); // 100
        p5.set(a.max.x, a.min.y, a.max.z).applys_Matrix4(p5, mat); // 101
        p6.set(a.max.x, a.max.y, a.min.z).applys_Matrix4(p6, mat); // 110
        p7.set(a.max.x, a.max.y, a.max.z).applys_Matrix4(p7, mat); // 111
        this.min.x = Math.min(p0.x, p1.x, p2.x, p3.x, p4.x, p5.x, p6.x, p7.x);
        this.min.y = Math.min(p0.y, p1.y, p2.y, p3.y, p4.y, p5.y, p6.y, p7.y);
        this.min.z = Math.min(p0.z, p1.z, p2.z, p3.z, p4.z, p5.z, p6.z, p7.z);
        this.max.x = Math.max(p0.x, p1.x, p2.x, p3.x, p4.x, p5.x, p6.x, p7.x);
        this.max.y = Math.max(p0.y, p1.y, p2.y, p3.y, p4.y, p5.y, p6.y, p7.y);
        this.max.z = Math.max(p0.z, p1.z, p2.z, p3.z, p4.z, p5.z, p6.z, p7.z);
        return this;
    }

    public set(min_x: number,min_y: number,min_z: number, max_x: number,max_y: number,max_z: number) {
        this.min.x = min_x;
        this.min.y = min_y;
        this.min.z = min_z;
        this.max.x = max_x;
        this.max.y = max_y;
        this.max.z = max_z;
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
}

export function box3(min: Vector3 = new Vector3(), max: Vector3 = new Vector3()) {
    return new Box3(min, max);
}