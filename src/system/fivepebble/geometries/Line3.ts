import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import type { Vector3 } from "../linear_algebra/Vector3";
import type { LineLike } from "./LineLike";

export class Line3 implements LineLike<Vector3, Matrix3> {
    public readonly start: Vector3;
    public readonly end: Vector3;

    public get length() { return this.start.distance_to(this.end); }
    public get direction() { return this.start.direction_to(this.end); }

    constructor(start: Vector3, end: Vector3) {
        this.start = start;
        this.end = end;
    }

    public apply_Matrix4(mat: Matrix4) {
        return new Line3(this.start.apply_Matrix4(mat), this.end.apply_Matrix4(mat));
    }
}

export function line3(start: Vector3, end: Vector3) {
    return new Line3(start, end);
}