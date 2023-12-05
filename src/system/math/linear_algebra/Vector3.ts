import { lerp } from "../Scalar";
import type { Matrix3 } from "./Matrix3";
import type { Matrix4 } from "./Matrix4";
import type { VectorLike } from "./VectorLike";

export class Vector3 implements VectorLike {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

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

    public static make_Zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    public static make_One(): Vector3 {
        return new Vector3(1, 1, 1);
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
    transform(matrix: Matrix3): Vector3 {
        const [n11, n12, n13, n21, n22, n23, n31, n32, n33] = matrix.elements;
        const { x, y, z } = this;
        return new Vector3(
            n11 * x + n12 * y + n13 * z,
            n21 * x + n22 * y + n23 * z,
            n31 * x + n32 * y + n33 * z,
        );
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
    negate(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }
    distance(b: Vector3) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        return Math.sqrt(x * x + y * y + z * z);
    }
    squared_distance(b: Vector3) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        return x * x + y * y + z * z;
    }

    equal(b: Vector3): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z;
    }

    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public apple_Transformation(transformation: Matrix4) {
        const [n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44] = transformation.elements;
        const { x, y, z } = this;
        const w = 1 / (n41 * x + n42 * y + n43 * z + n44);
        return new Vector3(
            (n11 * x + n12 * y + n13 * z + n14) * w,
            (n21 * x + n22 * y + n23 * z + n24) * w,
            (n31 * x + n32 * y + n33 * z + n34) * w,
        );
    }
}

export function vec3(x: number = 0, y: number = 0, z: number = 0) {
    return new Vector3(x, y, z);
}