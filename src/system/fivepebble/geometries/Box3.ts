import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { BoxLike } from "./BoxLike";

export class Box3 implements BoxLike<Vector3, Matrix3> {
    public readonly min: Vector3;
    public readonly max: Vector3;

    public get size() { return this.max.minus(this.min); }
    public get is_empty() { return this.min.equal(this.max); }

    constructor(min: Vector3 = new Vector3(), max: Vector3 = new Vector3()) {
        this.min = min.min(max);
        this.max = min.max(max);
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
        return new Box3(this.min.minus_Number(amount), this.max.add_Number(amount));
    }

    static #points: [Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    
    public apply_Matrix4(mat: Matrix4): Box3 {
        if (this.is_empty) return this;
        Box3.#points[0] = new Vector3(this.min.x, this.min.y, this.min.z).apply_Matrix4(mat); // 000
        Box3.#points[1] = new Vector3(this.min.x, this.min.y, this.max.z).apply_Matrix4(mat); // 001
        Box3.#points[2] = new Vector3(this.min.x, this.max.y, this.min.z).apply_Matrix4(mat); // 010
        Box3.#points[3] = new Vector3(this.min.x, this.max.y, this.max.z).apply_Matrix4(mat); // 011
        Box3.#points[4] = new Vector3(this.max.x, this.min.y, this.min.z).apply_Matrix4(mat); // 100
        Box3.#points[5] = new Vector3(this.max.x, this.min.y, this.max.z).apply_Matrix4(mat); // 101
        Box3.#points[6] = new Vector3(this.max.x, this.max.y, this.min.z).apply_Matrix4(mat); // 110
        Box3.#points[7] = new Vector3(this.max.x, this.max.y, this.max.z).apply_Matrix4(mat); // 111
        return Box3.from_Points(Box3.#points);
    }
}

export function box3(min: Vector3 = new Vector3(), max: Vector3 = new Vector3()) {
    return new Box3(min, max);
}