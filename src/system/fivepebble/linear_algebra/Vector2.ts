import { lerp } from "../Scalar";
import type { Matrix2 } from "./Matrix2";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector2 implements VectorLike<Vector2, Matrix2> {
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

    public static make_One(): Vector2 {
        return new Vector2(1, 1);
    }

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            default: return 0;
        }
    }

    add(b: Vector2): Vector2 {
        return new Vector2(this.x + b.x, this.y + b.y);
    }
    adds(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this;
    }

    add_Number(b: number): Vector2 {
        return new Vector2(this.x + b, this.y + b);
    }
    adds_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x + b;
        this.y = a.y + b;
        return this;
    }

    sub(b: Vector2): Vector2 {
        return new Vector2(this.x - b.x, this.y - b.y);
    }
    subs(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this;
    }

    sub_Number(b: number): Vector2 {
        return new Vector2(this.x - b, this.y - b);
    }
    subs_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x - b;
        this.y = a.y - b;
        return this;
    }

    mult(b: Vector2): Vector2 {
        return new Vector2(this.x * b.x, this.y * b.y);
    }
    mults(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        return this;
    }

    mult_Number(b: number): Vector2 {
        return new Vector2(this.x * b, this.y * b);
    }
    mults_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x * b;
        this.y = a.y * b;
        return this;
    }

    div(b: Vector2): Vector2 {
        return new Vector2(this.x / b.x, this.y / b.y);
    }
    divs(a: Vector2, b: Vector2): Vector2 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        return this;
    }

    div_Number(b: number): Vector2 {
        return new Vector2(this.x / b, this.y / b);
    }
    divs_Number(a: Vector2, b: number): Vector2 {
        this.x = a.x / b;
        this.y = a.y / b;
        return this;
    }

    add_Scaled(num: number, b: Vector2): Vector2 {
        return new Vector2(this.x + b.x * num, this.y + b.y * num);
    }
    adds_Scaled(a: Vector2, num: number, b: Vector2): Vector2 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        return this;
    }

    lerp(b: Vector2, weight: number): Vector2 {
        return new Vector2(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight));
    }
    lerps(a: Vector2, b: Vector2, weight: number): Vector2 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        return this;
    }

    transform(matrix: Matrix2): Vector2 {
        const n11 = matrix.n11, n12 = matrix.n12;
        const n21 = matrix.n21, n22 = matrix.n22;
        const { x, y } = this;
        return new Vector2(
            n11 * x + n12 * y,
            n21 * x + n22 * y,
        );
    }
    transforms(a: Vector2, matrix: Matrix2): Vector2 {
        const n11 = matrix.n11, n12 = matrix.n12;
        const n21 = matrix.n21, n22 = matrix.n22;
        const x = a.x, y = a.y;
        this.x = n11 * x + n12 * y;
        this.y = n21 * x + n22 * y;
        return this;
    }

    normalize(): Vector2 {
        return this.div_Number(this.length);
    }
    normalizes(a: Vector2): Vector2 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        return this;
    }

    negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }
    negates(a: Vector2): Vector2 {
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
    min(b: Vector2): Vector2 {
        return new Vector2(Math.min(this.x, b.x), Math.min(this.y, b.y));
    }
    mins(a: Vector2, b: Vector2): Vector2 {
        this.x = Math.min(a.x, b.x);
        this.y = Math.min(a.y, b.y);
        return this;
    }
    max(b: Vector2): Vector2 {
        return new Vector2(Math.max(this.x, b.x), Math.max(this.y, b.y));
    }
    maxs(a: Vector2, b: Vector2): Vector2 {
        this.x = Math.max(a.x, b.x);
        this.y = Math.max(a.y, b.y);
        return this;
    }
    abs(): Vector2 {
        return new Vector2(Math.abs(this.x), Math.abs(this.y));
    }
    get_Abs(a: Vector2): Vector2 {
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
    direction_to(b: Vector2) {
        return b.sub(this).normalize();
    }
    get_DirectionTo(a: Vector2, b: Vector2): Vector2 {
        return this.subs(b, a).normalizes(this);
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