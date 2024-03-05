import { lerp } from "../Scalar";
import type { Matrix3 } from "./Matrix3";
import type { Matrix4 } from "./Matrix4";
import type { VectorLike } from "./VectorLike";

export class Vector3 implements VectorLike<Vector3, Matrix3> {

    //#region init

    public static get new() { return new Vector3(); }
    public static create(x: number = 0, y: number = 0, z: number = 0) { return new Vector3(x, y, z); }

    //#endregion

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

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            default: return 0;
        }
    }

    add(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
    }

    add_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x + b;
        this.y = a.y + b;
        this.z = a.z + b;
        return this;
    }

    sub(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
    }

    sub_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x - b;
        this.y = a.y - b;
        this.z = a.z - b;
        return this;
    }

    mult(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this;
    }

    mult_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x * b;
        this.y = a.y * b;
        this.z = a.z * b;
        return this;
    }

    div(a: Vector3, b: Vector3): Vector3 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        this.z = a.z / b.z;
        return this;
    }

    div_Number(a: Vector3, b: number): Vector3 {
        this.x = a.x / b;
        this.y = a.y / b;
        this.z = a.z / b;
        return this;
    }

    add_Scaled(a: Vector3, num: number, b: Vector3): Vector3 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        this.z = a.z + num * b.z;
        return this;
    }

    lerp(a: Vector3, b: Vector3, weight: number): Vector3 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        this.z = lerp(a.z, b.z, weight);
        return this;
    }

    transform(a: Vector3, matrix: Matrix3): Vector3 {
        const n11 = matrix.n11, n21 = matrix.n21, n31 = matrix.n31;
        const n12 = matrix.n12, n22 = matrix.n22, n32 = matrix.n32;
        const n13 = matrix.n13, n23 = matrix.n23, n33 = matrix.n33;
        const x = a.x, y = a.y, z = a.z;
        this.x = n11 * x + n12 * y + n13 * z;
        this.y = n21 * x + n22 * y + n23 * z;
        this.z = n31 * x + n32 * y + n33 * z;
        return this;
    }

    normalize(a: Vector3): Vector3 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        this.z = a.z / length;
        return this;
    }

    negate(a: Vector3): Vector3 {
        this.x = -a.x;
        this.y = -a.y;
        this.z = -a.z;
        return this;
    }

    dot(b: Vector3): number {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }
    _cross(a: Vector3, b: Vector3): Vector3 {
        this.x = a.y * b.z - a.z * b.y;
        this.y = a.z * b.x - a.x * b.z;
        this.z = a.x * b.y - a.y * b.x;
        return this;
    }
    min(a: Vector3, b: Vector3): Vector3 {
        this.x = Math.min(a.x, b.x);
        this.y = Math.min(a.y, b.y);
        this.z = Math.min(a.z, b.z);
        return this;
    }
    max(a: Vector3, b: Vector3): Vector3 {
        this.x = Math.max(a.x, b.x);
        this.y = Math.max(a.y, b.y);
        this.z = Math.max(a.z, b.z);
        return this;
    }
    abs(a: Vector3): Vector3 {
        this.x = Math.abs(a.x);
        this.y = Math.abs(a.y);
        this.z = Math.abs(a.z);
        return this;
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
    direction_to(a: Vector3, b: Vector3) {
        this.sub(b, a);
        this.normalize(this);
        return this;
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

    public _apply_Matrix4(a: Vector3, mat: Matrix4) {
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