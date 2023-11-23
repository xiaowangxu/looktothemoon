import { lerp } from "../Scalar";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector4 implements VectorLike {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    get dimension(): number { return 4; }
    get array(): number[] { return [this.x, this.y, this.z, this.w]; }
    get typed_array_f64(): Float64Array { return new Float64Array(this.array); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.array); }
    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w; }
    get sum(): number { return this.x + this.y + this.z + this.w; }
    get product(): number { return this.x * this.y * this.z * this.w; }
    get min_component(): number { return Math.min(this.x, this.y, this.z, this.w); }
    get max_component(): number { return Math.max(this.x, this.y, this.z, this.w); }

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
            default: return 0;
        }
    }
    add(b: Vector4): Vector4 {
        return new Vector4(this.x + b.x, this.y + b.y, this.z + b.z, this.w + b.w);
    }
    add_Number(b: number): Vector4 {
        return new Vector4(this.x + b, this.y + b, this.z + b, this.w + b);
    }
    minus(b: Vector4): Vector4 {
        return new Vector4(this.x - b.x, this.y - b.y, this.z - b.z, this.w - b.w);
    }
    minus_Number(b: number): Vector4 {
        return new Vector4(this.x - b, this.y - b, this.z - b, this.w - b);
    }
    mult(b: Vector4): Vector4 {
        return new Vector4(this.x * b.x, this.y * b.y, this.z * b.z, this.w * b.w);
    }
    mult_Number(b: number): Vector4 {
        return new Vector4(this.x * b, this.y * b, this.z * b, this.w * b);
    }
    div(b: Vector4): Vector4 {
        return new Vector4(this.x / b.x, this.y / b.y, this.z / b.z, this.w / b.w);
    }
    div_Number(b: number): Vector4 {
        return new Vector4(this.x / b, this.y / b, this.z / b, this.w / b);
    }
    add_Scaled(num: number, b: Vector4): Vector4 {
        return new Vector4(this.x + b.x * num, this.y + b.y * num, this.z + b.z * num, this.w + b.w * num);
    }
    lerp(b: Vector4, weight: number): Vector4 {
        return new Vector4(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight), lerp(this.z, b.z, weight), lerp(this.w, b.w, weight));
    }
    dot(b: Vector4): number {
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    }
    transform(matrix: MatrixLike): Vector4 {
        throw new Error("Method not implemented.");
    }
    min(b: Vector4): Vector4 {
        return new Vector4(Math.min(this.x, b.x), Math.min(this.y, b.y), Math.min(this.z, b.z), Math.min(this.w, b.w));
    }
    max(b: Vector4): Vector4 {
        return new Vector4(Math.max(this.x, b.x), Math.max(this.y, b.y), Math.max(this.z, b.z), Math.max(this.w, b.w));
    }
    abs(): Vector4 {
        return new Vector4(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z), Math.abs(this.w));
    }
    normalize(): Vector4 {
        return this.div_Number(this.length);
    }

    equal(b: Vector4): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z && this.w === b.w;
    }

    zero(): Vector4 {
        return new Vector4(0, 0, 0, 0);
    }
    one(): Vector4 {
        return new Vector4(1, 1, 1, 1);
    }
    clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    public set(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export function vec4(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    return new Vector4(x, y, z, w);
}