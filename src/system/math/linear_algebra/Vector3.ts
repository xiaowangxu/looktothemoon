import { lerp } from "../Scalar";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector3 implements VectorLike {
    public x: number;
    public y: number;
    public z: number;

    get dimension(): number { return 3; }
    get array(): number[] { return [this.x, this.y, this.z]; }
    get typed_array_f64(): Float64Array { return new Float64Array(this.array); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.array); }
    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y + this.z * this.z; }
    get sum(): number { return this.x + this.y + this.z; }
    get product(): number { return this.x * this.y * this.z; }
    get min_component(): number { return Math.min(this.x, this.y, this.z); }
    get max_component(): number { return Math.max(this.x, this.y, this.z); }

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            default: return 0;
        }
    }
    add(b: Vector3): Vector3 {
        return new Vector3(this.x + b.x, this.y + b.y, this.z + b.z);
    }
    add_Number(b: number): Vector3 {
        return new Vector3(this.x + b, this.y + b, this.z + b);
    }
    minus(b: Vector3): Vector3 {
        return new Vector3(this.x - b.x, this.y - b.y, this.z - b.z);
    }
    minus_Number(b: number): Vector3 {
        return new Vector3(this.x - b, this.y - b, this.z - b);
    }
    mult(b: Vector3): Vector3 {
        return new Vector3(this.x * b.x, this.y * b.y, this.z * b.z);
    }
    mult_Number(b: number): Vector3 {
        return new Vector3(this.x * b, this.y * b, this.z * b);
    }
    div(b: Vector3): Vector3 {
        return new Vector3(this.x / b.x, this.y / b.y, this.z / b.z);
    }
    div_Number(b: number): Vector3 {
        return new Vector3(this.x / b, this.y / b, this.z / b);
    }
    add_Scaled(num: number, b: Vector3): Vector3 {
        return new Vector3(this.x + b.x * num, this.y + b.y * num, this.z + b.z * num);
    }
    lerp(b: Vector3, weight: number): Vector3 {
        return new Vector3(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight), lerp(this.z, b.z, weight));
    }
    dot(b: Vector3): number {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }
    cross(b: Vector3): Vector3 {
        return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x);
    }
    transform(matrix: MatrixLike): Vector3 {
        throw new Error("Method not implemented.");
    }
    min(b: Vector3): Vector3 {
        return new Vector3(Math.min(this.x, b.x), Math.min(this.y, b.y), Math.min(this.z, b.z));
    }
    max(b: Vector3): Vector3 {
        return new Vector3(Math.max(this.x, b.x), Math.max(this.y, b.y), Math.max(this.z, b.z));
    }
    abs(): Vector3 {
        return new Vector3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }
    normalize(): Vector3 {
        return this.div_Number(this.length);
    }
    equal(b: Vector3): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z;
    }
    zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }
    one(): Vector3 {
        return new Vector3(1, 1, 1);
    }
    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public set(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export function vec3(x: number = 0, y: number = 0, z: number = 0) {
    return new Vector3(x, y, z);
}

export function euler(x: number = 0, y: number = 0, z: number = 0) {
    return new Vector3(x, y, z);
}