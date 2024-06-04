import { lerp } from "../Scalar";
import type { Matrix4 } from "./Matrix4";
import { Vector3 } from "./Vector3";
import type { VectorLike } from "./VectorLike";

export class Vector4 implements VectorLike<Vector4, Matrix4> {

    //#region init

    public static get new() { return new Vector4(); }
    public static create(x: number = 0, y: number = 0, z: number = 0, w: number = 0) { return new Vector4(x, y, z, w); }
    static readonly #tmp = new Vector4();
    public static tmp(x: number = 0, y: number = 0, z: number = 0, w: number = 0) { return Vector4.#tmp.set(x, y, z, w); }

    //#endregion

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
    public get_PlainColor(mult_alpha: boolean = false) { return new Vector3(this.x * this.w, this.y * this.w, this.z * this.w); }

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

    index(index: number): number {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
            default: return 0;
        }
    }

    add(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        this.w = a.w + b.w;
        return this;
    }
    add_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x + b;
        this.y = a.y + b;
        this.z = a.z + b;
        this.w = a.w + b;
        return this;
    }
    sub(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        this.w = a.w - b.w;
        return this;
    }
    sub_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x - b;
        this.y = a.y - b;
        this.z = a.z - b;
        this.w = a.w - b;
        return this;
    }
    mult(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        this.w = a.w * b.w;
        return this;
    }
    mult_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x * b;
        this.y = a.y * b;
        this.z = a.z * b;
        this.w = a.w * b;
        return this;
    }
    div(a: Vector4, b: Vector4): Vector4 {
        this.x = a.x / b.x;
        this.y = a.y / b.y;
        this.z = a.z / b.z;
        this.w = a.w / b.w;
        return this;
    }
    div_Number(a: Vector4, b: number): Vector4 {
        this.x = a.x / b;
        this.y = a.y / b;
        this.z = a.z / b;
        this.w = a.w / b;
        return this;
    }
    add_Scaled(a: Vector4, num: number, b: Vector4): Vector4 {
        this.x = a.x + num * b.x;
        this.y = a.y + num * b.y;
        this.z = a.z + num * b.z;
        this.w = a.w + num * b.w;
        return this;
    }
    lerp(a: Vector4, b: Vector4, weight: number): Vector4 {
        this.x = lerp(a.x, b.x, weight);
        this.y = lerp(a.y, b.y, weight);
        this.z = lerp(a.z, b.z, weight);
        this.w = lerp(a.w, b.w, weight);
        return this;
    }
    transform(a: Vector4, matrix: Matrix4): Vector4 {
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
    normalize(a: Vector4): Vector4 {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        this.z = a.z / length;
        this.w = a.w / length;
        return this;
    }
    negate(a: Vector4): Vector4 {
        this.x = -a.x;
        this.y = -a.y;
        this.z = -a.z;
        this.w = -a.w;
        return this;
    }
    dot(b: Vector4): number {
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    }
    min(a: Vector4, b: Vector4): Vector4 {
        this.x = Math.min(a.x, b.x);
        this.y = Math.min(a.y, b.y);
        this.z = Math.min(a.z, b.z);
        this.w = Math.min(a.w, b.w);
        return this;
    }
    max(a: Vector4, b: Vector4): Vector4 {
        this.x = Math.max(a.x, b.x);
        this.y = Math.max(a.y, b.y);
        this.z = Math.max(a.z, b.z);
        this.w = Math.max(a.w, b.w);
        return this;
    }
    abs(a: Vector4): Vector4 {
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
    direction_to(a: Vector4, b: Vector4) {
        this.sub(b, a);
        return this.normalize(this);
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

    //#region color

    public get srgb() { return this.get_SRGB(new Vector4()); }
    public get_SRGB(target: Vector4): Vector4 {
        const { x, y, z, w } = this;
        target.x = (x < 0.0031308) ? x * 12.92 : 1.055 * (Math.pow(x, 0.41666)) - 0.055;
        target.y = (y < 0.0031308) ? y * 12.92 : 1.055 * (Math.pow(y, 0.41666)) - 0.055;
        target.z = (z < 0.0031308) ? z * 12.92 : 1.055 * (Math.pow(z, 0.41666)) - 0.055;
        target.w = w;
        return target;
    }

    public get linear_rgb() { return this.get_LinearRGB(new Vector4()); }
    public get_LinearRGB(target: Vector4): Vector4 {
        const { x, y, z, w } = this;
        target.x = (x < 0.04045) ? x * 0.0773993808 : Math.pow(x * 0.9478672986 + 0.0521327014, 2.4);
        target.y = (y < 0.04045) ? y * 0.0773993808 : Math.pow(y * 0.9478672986 + 0.0521327014, 2.4);
        target.z = (z < 0.04045) ? z * 0.0773993808 : Math.pow(z * 0.9478672986 + 0.0521327014, 2.4);
        target.w = w;
        return target;
    }

    //#endregion
}