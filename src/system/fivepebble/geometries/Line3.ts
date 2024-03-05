import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { LineLike } from "./LineLike";

export class Line3 implements LineLike<Vector3, Matrix3> {
    public readonly start: Vector3;
    public readonly end: Vector3;

    public get length() { return this.start.distance_to(this.end); }
    public get direction() { return Vector3.new.direction_to(this.start, this.end); }

    constructor(start: Vector3, end: Vector3) {
        this.start = start;
        this.end = end;
    }

    public apply_Matrix4(mat: Matrix4) {
        return new Line3(Vector3.new.apply_Matrix4(this.start, mat), Vector3.new.apply_Matrix4(this.end, mat));
    }

    equal(b: Line3): boolean {
        return this.start.equal(b.start) && this.end.equal(b.end);
    }

    copy(b: Line3): Line3 {
        this.start.copy(b.start);
        this.end.copy(b.end);
        return this;
    }
    clone(): Line3 {
        return new Line3(this.start.clone(), this.end.clone());
    }
}

export function line3(start: Vector3, end: Vector3) {
    return new Line3(start, end);
}