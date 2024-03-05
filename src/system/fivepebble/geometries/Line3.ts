import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Vector3 } from "../linear_algebra/Vector3";
import type { LineLike } from "./LineLike";

export class Line3 implements LineLike<Vector3, Matrix3> {

    //#region init

    static get new() { return new Line3(Line3.#const_vector3_zero, Line3.#const_vector3_zero); }
    static create(start: Vector3, end: Vector3) { return new Line3(start, end); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);

    public readonly start: Vector3;
    public readonly end: Vector3;

    get length() { return this.start.distance_to(this.end); }

    get direction() { return Vector3.new.direction_to(this.start, this.end); }
    get_Direction(target: Vector3): Vector3 { return target.direction_to(this.start, this.end); }

    constructor(start: Vector3, end: Vector3) {
        this.start = start.clone();
        this.end = end.clone();
    }

    equal(b: Line3): boolean {
        return this.start.equal(b.start) && this.end.equal(b.end);
    }

    set(start: Vector3, end: Vector3): Line3 {
        this.start.copy(start);
        this.end.copy(end);
        return this;
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