import { lerp } from "../Scalar";
import type { Matrix4 } from "./Matrix4";
import type { MatrixLike } from "./MatrixLike";
import type { VectorLike } from "./VectorLike";

export class Vector4 implements VectorLike<Vector4, Matrix4> {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    // color 
    public get r() { return this.x; }
    public get g() { return this.y; }
    public get b() { return this.z; }
    public get a() { return this.w; }
    public set r(val: number) { this.x = val; }
    public set g(val: number) { this.y = val; }
    public set b(val: number) { this.z = val; }
    public set a(val: number) { this.w = val; }

    get dimension(): number { return 4; }
    get array(): number[] { return [this.x, this.y, this.z, this.w]; }
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

    public static make_Zero(): Vector4 {
        return new Vector4(0, 0, 0, 0);
    }

    public static make_One(): Vector4 {
        return new Vector4(1, 1, 1, 1);
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
    adds(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        this.w = a.w + b.w;
        return this;
    }

    add_Number(b: number): Vector4 {
        return new Vector4(this.x + b, this.y + b, this.z + b, this.w + b);
    }
    adds_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x + b;
        this.y = a.y + b;
        this.z = a.z + b;
        this.w = a.w + b;
        return this;
    }

    sub(b: Vector4): Vector4 {
        return new Vector4(this.x - b.x, this.y - b.y, this.z - b.z, this.w - b.w);
    }
    subs(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        this.w = a.w - b.w;
        return this;
    }

    sub_Number(b: number): Vector4 {
        return new Vector4(this.x - b, this.y - b, this.z - b, this.w - b);
    }
    subs_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x - b;
        this.y = a.y - b;
        this.z = a.z - b;
        this.w = a.w - b;
        return this;
    }

    mult(b: Vector4): Vector4 {
        return new Vector4(this.x * b.x, this.y * b.y, this.z * b.z, this.w * b.w);
    }
    mults(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        this.w = a.w * b.w;
        return this;
    }

    mult_Number(b: number): Vector4 {
        return new Vector4(this.x * b, this.y * b, this.z * b, this.w * b);
    }
    mults_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x * b;
        this.y = a.y * b;
        this.z = a.z * b;
        this.w = a.w * b;
        return this;
    }

    div(b: Vector4): Vector4 {
        return new Vector4(this.x / b.x, this.y / b.y, this.z / b.z, this.w / b.w);
    }
    divs(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        this.z = a.z / b.z;
        this.w = a.w / b.w;
        return this;
    }

    div_Number(b: number): Vector4 {
        return new Vector4(this.x / b, this.y / b, this.z / b, this.w / b);
    }
    divs_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x / b;
        this.y = a.y / b;
        this.z = a.z / b;
        this.w = a.w / b;
        return this;
    }

    add_Scaled(num: number, b: Vector4): Vector4 {
        return new Vector4(this.x + b.x * num, this.y + b.y * num, this.z + b.z * num, this.w + b.w * num);
    }
    adds_Scaled(a: Vector4, num: number, b: Vector4): Vector4 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        this.z = a.z + num * b.z;
        this.w = a.w + num * b.w;
        return this;
    }

    lerp(b: Vector4, weight: number): Vector4 {
        return new Vector4(lerp(this.x, b.x, weight), lerp(this.y, b.y, weight), lerp(this.z, b.z, weight), lerp(this.w, b.w, weight));
    }
    lerps(a: Vector4, b: Vector4, weight: number): Vector4 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        this.z = lerp(a.z, b.z, weight);
        this.w = lerp(a.w, b.w, weight);
        return this;
    }

    transform(matrix: Matrix4): Vector4 {
        const n11 = matrix.n11, n12 = matrix.n12, n13 = matrix.n13, n14 = matrix.n14;
        const n21 = matrix.n21, n22 = matrix.n22, n23 = matrix.n23, n24 = matrix.n24;
        const n31 = matrix.n31, n32 = matrix.n32, n33 = matrix.n33, n34 = matrix.n34;
        const n41 = matrix.n41, n42 = matrix.n42, n43 = matrix.n43, n44 = matrix.n44;
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return new Vector4(
            n11 * x + n12 * y + n13 * z + n14 * w,
            n21 * x + n22 * y + n23 * z + n24 * w,
            n31 * x + n32 * y + n33 * z + n34 * w,
            n41 * x + n42 * y + n43 * z + n44 * w,
        );
    }
    transforms(a: Vector4, matrix: Matrix4): Vector4 {
        const n11 = matrix.n11, n12 = matrix.n12, n13 = matrix.n13, n14 = matrix.n14;
        const n21 = matrix.n21, n22 = matrix.n22, n23 = matrix.n23, n24 = matrix.n24;
        const n31 = matrix.n31, n32 = matrix.n32, n33 = matrix.n33, n34 = matrix.n34;
        const n41 = matrix.n41, n42 = matrix.n42, n43 = matrix.n43, n44 = matrix.n44;
        const x = a.x, y = a.y, z = a.z, w = a.w;
        this.x = n11 * x + n12 * y + n13 * z + n14 * w;
        this.y = n21 * x + n22 * y + n23 * z + n24 * w;
        this.z = n31 * x + n32 * y + n33 * z + n34 * w;
        this.w = n41 * x + n42 * y + n43 * z + n44 * w;
        return this;
    }

    normalize(): Vector4 {
        return this.div_Number(this.length);
    }
    normalizes(a: Vector4): Vector4 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        this.z = a.z / length;
        this.w = a.w / length;
        return this;
    }

    negate(): Vector4 {
        return new Vector4(-this.x, -this.y, -this.z, -this.w);
    }
    negates(a: Vector4): Vector4 {
        this.x = -a.x;
        this.y = -a.y;
        this.z = -a.z;
        this.w = -a.w;
        return this;
    }

    dot(b: Vector4): number {
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    }
    min(b: Vector4): Vector4 {
        return new Vector4(Math.min(this.x, b.x), Math.min(this.y, b.y), Math.min(this.z, b.z), Math.min(this.w, b.w));
    }
    mins(a: Vector4, b: Vector4): Vector4 {
        this.x = Math.min(a.x, b.x);
        this.y = Math.min(a.y, b.y);
        this.z = Math.min(a.z, b.z);
        this.w = Math.min(a.w, b.w);
        return this;
    }
    max(b: Vector4): Vector4 {
        return new Vector4(Math.max(this.x, b.x), Math.max(this.y, b.y), Math.max(this.z, b.z), Math.max(this.w, b.w));
    }
    maxs(a: Vector4, b: Vector4): Vector4 {
        this.x = Math.max(a.x, b.x);
        this.y = Math.max(a.y, b.y);
        this.z = Math.max(a.z, b.z);
        this.w = Math.max(a.w, b.w);
        return this;
    }
    abs(): Vector4 {
        return new Vector4(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z), Math.abs(this.w));
    }
    get_Abs(a: Vector4): Vector4 {
        this.x = Math.abs(a.x);
        this.y = Math.abs(a.y);
        this.z = Math.abs(a.z);
        this.w = Math.abs(a.w);
        return this;
    }
    distance_to(b: Vector4) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        const w = this.w - b.w;
        return Math.sqrt(x * x + y * y + z * z + w * w);
    }
    squared_distance_to(b: Vector4) {
        const x = this.x - b.x;
        const y = this.y - b.y;
        const z = this.z - b.z;
        const w = this.w - b.w;
        return x * x + y * y + z * z + w * w;
    }
    direction_to(b: Vector4) {
        return b.sub(this).normalize();
    }
    get_DirectionTo(a: Vector4, b: Vector4) {
        return this.subs(b, a).normalizes(this);
    }

    equal(b: Vector4): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z && this.w === b.w;
    }
    set(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
    copy(b: Vector4) {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.w = b.w;
        return this;
    }
    clone(): Vector4 {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
}

export function vec4(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    return new Vector4(x, y, z, w);
}