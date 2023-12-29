import { lerp } from "../Scalar";
import type { Matrix3 } from "./Matrix3";
import type { Matrix4 } from "./Matrix4";
import type { VectorLike } from "./VectorLike";

export class Vector3 implements VectorLike<Vector3, Matrix3> {
    public x: number;
    public y: number;
    public z: number;

    get dimension(): number { return 3; }
    get array(): number[] { return [this.x, this.y, this.z]; }
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
    adds(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
    }

    add_Number(b: number): Vector3 {
        return new Vector3(this.x + b, this.y + b, this.z + b);
    }
    adds_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x + b;
        this.y = a.y + b;
        this.z = a.z + b;
        return this;
    }

    sub(b: Vector3): Vector3 {
        return new Vector3(this.x - b.x, this.y - b.y, this.z - b.z);
    }
    subs(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    }

    sub_Number(b: number): Vector3 {
        return new Vector3(this.x - b, this.y - b, this.z - b);
    }
    subs_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x - b;
        this.y = a.y - b;
        this.z = a.z - b;
        return this;
    }

    mult(b: Vector3): Vector3 {
        return new Vector3(this.x * b.x, this.y * b.y, this.z * b.z);
    }
    mults(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this;
    }

    mult_Number(b: number): Vector3 {
        return new Vector3(this.x * b, this.y * b, this.z * b);
    }
    mults_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x * b;
        this.y = a.y * b;
        this.z = a.z * b;
        return this;
    }

    div(b: Vector3): Vector3 {
        return new Vector3(this.x / b.x, this.y / b.y, this.z / b.z);
    }
    divs(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        this.z = a.z / b.z;
        return this;
    }

    div_Number(b: number): Vector3 {
        return new Vector3(this.x / b, this.y / b, this.z / b);
    }
    divs_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x / b;
        this.y = a.y / b;
        this.z = a.z / b;
        return this;
    }

    add_Scaled(num: number, b: Vector3): Vector3 {
        return new Vector3(this.x + b.x * num, this.y + b.y * num, this.z + b.z * num);
    }
    adds_Scaled(a: Vector3, num: number, b: Vector3): Vector3 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        this.z = a.z + num * b.z;
        return this;
    }

    lerp(b: Vector3, weight: number): Vector3 {
        return new Vector3(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight), lerp(this.z, b.z, weight));
    }
    lerps(a: Vector3, b: Vector3, weight: number): Vector3 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        this.z = lerp(a.z, b.z, weight);
        return this;
    }

    transform(matrix: Matrix3): Vector3 {
        const n11 = matrix.n11, n21 = matrix.n21, n31 = matrix.n31;
        const n12 = matrix.n12, n22 = matrix.n22, n32 = matrix.n32;
        const n13 = matrix.n13, n23 = matrix.n23, n33 = matrix.n33;
        const { x, y, z } = this;
        return new Vector3(
            n11 * x + n12 * y + n13 * z,
            n21 * x + n22 * y + n23 * z,
            n31 * x + n32 * y + n33 * z,
        );
    }
    transforms(a: Vector3, matrix: Matrix3): Vector3 {
        const n11 = matrix.n11, n21 = matrix.n21, n31 = matrix.n31;
        const n12 = matrix.n12, n22 = matrix.n22, n32 = matrix.n32;
        const n13 = matrix.n13, n23 = matrix.n23, n33 = matrix.n33;
        const x = a.x, y = a.y, z = a.z;
        this.x = n11 * x + n12 * y + n13 * z;
        this.x = n21 * x + n22 * y + n23 * z;
        this.x = n31 * x + n32 * y + n33 * z;
        return this;
    }

    normalize(): Vector3 {
        return this.div_Number(this.length);
    }
    normalizes(a: Vector3): Vector3 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        this.z = a.z / length;
        return this;
    }

    negate(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }
    negates(a: Vector3): Vector3 {
        this.x = -a.x;
        this.y = -a.y;
        this.z = -a.z;
        return this;
    }

    dot(b: Vector3): number {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }
    cross(b: Vector3): Vector3 {
        return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x);
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
    distance_to(b: Vector3) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        return Math.sqrt(x * x + y * y + z * z);
    }
    squared_distance_to(b: Vector3) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        return x * x + y * y + z * z;
    }
    direction_to(b: Vector3) {
        return b.sub(this).normalize();
    }

    equal(b: Vector3): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z;
    }
    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    copy(b: Vector3) {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        return this;
    }
    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public apply_Matrix4(mat: Matrix4) {
        // 0 4 8  12
        // 1 5 9  13
        // 2 6 10 14
        // 3 7 11 15
        const n11 = mat.n11, n12 = mat.n12, n13 = mat.n13, n14 = mat.n14;
        const n21 = mat.n21, n22 = mat.n22, n23 = mat.n23, n24 = mat.n24;
        const n31 = mat.n31, n32 = mat.n32, n33 = mat.n33, n34 = mat.n34;
        const n41 = mat.n41, n42 = mat.n42, n43 = mat.n43, n44 = mat.n44;
        const x = this.x, y = this.y, z = this.z;
        const w = 1 / (n41 * x + n42 * y + n43 * z + n44);
        return new Vector3(
            (n11 * x + n12 * y + n13 * z + n14) * w,
            (n21 * x + n22 * y + n23 * z + n24) * w,
            (n31 * x + n32 * y + n33 * z + n34) * w,
        );
    }
    public applys_Matrix4(a: Vector3, mat: Matrix4) {
        const n11 = mat.n11, n12 = mat.n12, n13 = mat.n13, n14 = mat.n14;
        const n21 = mat.n21, n22 = mat.n22, n23 = mat.n23, n24 = mat.n24;
        const n31 = mat.n31, n32 = mat.n32, n33 = mat.n33, n34 = mat.n34;
        const n41 = mat.n41, n42 = mat.n42, n43 = mat.n43, n44 = mat.n44;
        const x = a.x, y = a.y, z = a.z;
        const w = 1 / (n41 * x + n42 * y + n43 * z + n44);
        this.x = (n11 * x + n12 * y + n13 * z + n14) * w;
        this.y = (n21 * x + n22 * y + n23 * z + n24) * w;
        this.z = (n31 * x + n32 * y + n33 * z + n34) * w;
        return this;
    }
}

export function vec3(x: number = 0, y: number = 0, z: number = 0) {
    return new Vector3(x, y, z);
}