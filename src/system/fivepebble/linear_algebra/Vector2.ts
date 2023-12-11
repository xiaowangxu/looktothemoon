import { lerp } from "../Scalar";
import type { Matrix2 } from "./Matrix2";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector2 implements VectorLike<Vector2, Matrix2> {
    public readonly x: number;
    public readonly y: number;

    get dimension(): number { return 2; }
    get array(): number[] { return [this.x, this.y]; }
    get typed_array_f64(): Float64Array { return new Float64Array(this.array); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.array); }
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
    add_Number(b: number): Vector2 {
        return new Vector2(this.x + b, this.y + b);
    }
    minus(b: Vector2): Vector2 {
        return new Vector2(this.x - b.x, this.y - b.y);
    }
    minus_Number(b: number): Vector2 {
        return new Vector2(this.x - b, this.y - b);
    }
    mult(b: Vector2): Vector2 {
        return new Vector2(this.x * b.x, this.y * b.y);
    }
    mult_Number(b: number): Vector2 {
        return new Vector2(this.x * b, this.y * b);
    }
    div(b: Vector2): Vector2 {
        return new Vector2(this.x / b.x, this.y / b.y);
    }
    div_Number(b: number): Vector2 {
        return new Vector2(this.x / b, this.y / b);
    }
    add_Scaled(num: number, b: Vector2): Vector2 {
        return new Vector2(this.x + b.x * num, this.y + b.y * num);
    }

    lerp(b: Vector2, weight: number): Vector2 {
        return new Vector2(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight));
    }
    dot(b: Vector2): number {
        return this.x * b.x + this.y * b.y;
    }
    cross(b: Vector2): number {
        return this.x * b.y - b.x * this.y;
    }
    transform(matrix: Matrix2): Vector2 {
        const [n11, n12, n21, n22] = matrix.elements;
        const { x, y } = this;
        return new Vector2(
            n11 * x + n12 * y ,
            n21 * x + n22 * y ,
        );
    }
    min(b: Vector2): Vector2 {
        return new Vector2(Math.min(this.x, b.x), Math.min(this.y, b.y));
    }
    max(b: Vector2): Vector2 {
        return new Vector2(Math.max(this.x, b.x), Math.max(this.y, b.y));
    }
    abs(): Vector2 {
        return new Vector2(Math.abs(this.x), Math.abs(this.y));
    }
    normalize(): Vector2 {
        return this.div_Number(this.length);
    }
    negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
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
        return b.minus(this).normalize();
    }

    equal(b: Vector2): boolean {
        return this.x === b.x && this.y === b.y;
    }
}

export function vec2(x: number = 0, y: number = 0) {
    return new Vector2(x, y);
}