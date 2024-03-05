import { lerp } from "../Scalar";
import type { Matrix2 } from "./Matrix2";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector2 implements VectorLike<Vector2, Matrix2> {

    //#region tmp

    public static get new() { return new Vector2(); }

    //#endregion

    public x: number;
    public y: number;

    get dimension(): number { return 2; }
    get array(): number[] { return [this.x, this.y]; }
    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y; }
    get sum(): number { return this.x + this.y; }
    get product(): number { return this.x * this.y; }
    get min_component(): number { return Math.min(this.x, this.y); }
    get max_component(): number { return Math.max(this.x, this.y); }

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public static make_Zero(): Vector2 {
        return new Vector2(0, 0);
    }

    public set_Zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    public static make_One(): Vector2 {
        return new Vector2(1, 1);
    }

    public set_One() {
        this.x = 1;
        this.y = 1;
        return this;
    }

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            default: return 0;
        }
    }

    _add(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this;
    }

    _add_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x + b;
        this.y = a.y + b;
        return this;
    }

    _sub(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this;
    }

    _sub_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x - b;
        this.y = a.y - b;
        return this;
    }

    _mult(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        return this;
    }

    _mult_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x * b;
        this.y = a.y * b;
        return this;
    }

    _div(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        return this;
    }

    _div_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x / b;
        this.y = a.y / b;
        return this;
    }

    _add_Scaled(a: Vector2, num: number, b: Vector2): Vector2 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        return this;
    }

    _lerp(a: Vector2, b: Vector2, weight: number): Vector2 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        return this;
    }

    _transform(a: Vector2, matrix: Matrix2): Vector2 {
        const n11 = matrix.n11, n12 = matrix.n12;
        const n21 = matrix.n21, n22 = matrix.n22;
        const x = a.x, y = a.y;
        this.x = n11 * x + n12 * y;
        this.y = n21 * x + n22 * y;
        return this;
    }

    _normalize(a: Vector2): Vector2 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        return this;
    }

    _negate(a: Vector2): Vector2 {
        this.x = -a.x;
        this.y = -a.y;
        return this;
    }

    dot(b: Vector2): number {
        return this.x * b.x + this.y * b.y;
    }
    cross(b: Vector2): number {
        return this.x * b.y - b.x * this.y;
    }
    _min(a: Vector2, b: Vector2): Vector2 {
        this.x = Math.min(a.x, b.x);
        this.y = Math.min(a.y, b.y);
        return this;
    }
    _max(a: Vector2, b: Vector2): Vector2 {
        this.x = Math.max(a.x, b.x);
        this.y = Math.max(a.y, b.y);
        return this;
    }
    _abs(a: Vector2): Vector2 {
        this.x = Math.abs(a.x);
        this.y = Math.abs(a.y);
        return this;
    }
    distance_to(b: Vector2) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        return Math.sqrt(x * x + y * y);
    }
    squared_distance_to(b: Vector2) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        return x * x + y * y;
    }
    _direction_to(a: Vector2, b: Vector2): Vector2 {
        this._sub(b, a);
        return this._normalize(this);
    }

    equal(b: Vector2): boolean {
        return this.x === b.x && this.y === b.y;
    }
    set(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }
    copy(b: Vector2): Vector2 {
        this.x = b.x;
        this.y = b.y;
        return this;
    }
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}

export function vec2(x: number = 0, y: number = 0) {
    return new Vector2(x, y);
}