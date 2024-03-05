import { lerp } from "../Scalar";
import type { MatrixLike } from "./MatrixLike";
import type { Vector2 } from "./Vector2";

export class Matrix2 implements MatrixLike<Matrix2> {

    //#region init

    static get new() { return new Matrix2(1, 0, 0, 1); }
    static create(n11: number, n12: number, n21: number, n22: number) {
        return new Matrix2(n11, n12, n21, n22);
    }

    //#endregion

    // [ n11 n12 ]
    // [ n21 n22 ]
    // n11 n12 n21 n22

    public n11: number;
    public n12: number;
    public n21: number;
    public n22: number;

    get row_dimension(): number { return 2; }
    get col_dimension(): number { return 2; }
    get determinant(): number {
        return this.n11 * this.n22 - this.n12 * this.n21;
    }
    get array(): number[] {
        return [this.n11, this.n12, this.n21, this.n22];
    }
    get transposed_array(): number[] {
        return [this.n11, this.n21, this.n12, this.n22];
    }

    constructor(n11: number, n12: number, n21: number, n22: number) {
        this.n11 = n11; this.n12 = n12;
        this.n21 = n21; this.n22 = n22;
    }

    public set_Identity() {
        this.n11 = 1; this.n12 = 0;
        this.n21 = 0; this.n22 = 1;
        return this;
    }

    public set_Axis(x: Vector2, y: Vector2) {
        this.n11 = x.x; this.n21 = y.x;
        this.n12 = x.y; this.n22 = y.y;
        return this;
    }

    public set_Rotate(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        this.n11 = cr; this.n12 = -sr;
        this.n21 = sr; this.n22 = cr;
        return this;
    }

    public set_Scale(x: number, y: number) {
        this.n11 = x; this.n12 = 0;
        this.n21 = 0; this.n22 = y;
        return this;
    }

    index(row: number, col: number): number {
        if (row < 0 || row > 1 || col < 0 || col > 1) return 0;
        return this.array[row * 2 + col];
    }

    add(b: Matrix2): Matrix2 {
        this.n11 = this.n11 + b.n11; this.n12 = this.n12 + b.n12;
        this.n21 = this.n21 + b.n21; this.n22 = this.n22 + b.n22;
        return this;
    }
    add_Number(a: Matrix2, b: number): Matrix2 {
        this.n11 = a.n11 + b; this.n12 = a.n12 + b;
        this.n21 = a.n21 + b; this.n22 = a.n22 + b;
        return this;
    }
    sub(b: Matrix2): Matrix2 {
        this.n11 = this.n11 - b.n11; this.n12 = this.n12 - b.n12;
        this.n21 = this.n21 - b.n21; this.n22 = this.n22 - b.n22;
        return this;
    }
    sub_Number(a: Matrix2, b: number): Matrix2 {
        this.n11 = a.n11 - b; this.n12 = a.n12 - b;
        this.n21 = a.n21 - b; this.n22 = a.n22 - b;
        return this;
    }
    mult(b: Matrix2): Matrix2 {
        this.n11 = this.n11 * b.n11; this.n12 = this.n12 * b.n12;
        this.n21 = this.n21 * b.n21; this.n22 = this.n22 * b.n22;
        return this;
    }
    mult_Number(a: Matrix2, b: number): Matrix2 {
        this.n11 = a.n11 * b; this.n12 = a.n12 * b;
        this.n21 = a.n21 * b; this.n22 = a.n22 * b;
        return this;
    }
    div(b: Matrix2): Matrix2 {
        this.n11 = this.n11 / b.n11; this.n12 = this.n12 / b.n12;
        this.n21 = this.n21 / b.n21; this.n22 = this.n22 / b.n22;
        return this;
    }
    div_Number(a: Matrix2, b: number): Matrix2 {
        this.n11 = a.n11 / b; this.n12 = a.n12 / b;
        this.n21 = a.n21 / b; this.n22 = a.n22 / b;
        return this;
    }
    add_Scaled(a: Matrix2, num: number, b: Matrix2): Matrix2 {
        this.n11 = a.n11 + b.n11 * num; this.n12 = a.n12 + b.n12 * num;
        this.n21 = a.n21 + b.n21 * num; this.n22 = a.n22 + b.n22 * num;
        return this;
    }
    lerp(a: Matrix2, b: Matrix2, weight: number): Matrix2 {
        this.n11 = lerp(a.n11, b.n11, weight); this.n12 = lerp(a.n12, b.n12, weight);
        this.n21 = lerp(a.n21, b.n21, weight); this.n22 = lerp(a.n22, b.n22, weight);
        return this;
    }
    transpose(a: Matrix2): Matrix2 {
        this.n11 = a.n11; this.n12 = a.n21;
        this.n21 = a.n12; this.n22 = a.n22;
        return this;
    }
    inverse(a: Matrix2): Matrix2 {
        const det = a.determinant;
        if (det === 0) {
            this.n11 = 0;
            this.n12 = 0;
            this.n21 = 0;
            this.n22 = 0;
            return this;
        }
        const n11 = a.n11, n12 = a.n12;
        const n21 = a.n21, n22 = a.n22;
        const idet = 1 / det;
        this.n11 = n22 * idet;
        this.n12 = n12 * -idet;
        this.n21 = n21 * -idet;
        this.n22 = n11 * idet;
        return this;
    }

    /**
     * b * this
     */
    compose(a: Matrix2, b: Matrix2): Matrix2 {
        const n11 = a.n11, n12 = a.n12;
        const n21 = a.n21, n22 = a.n22;
        const b11 = b.n11, b12 = b.n12;
        const b21 = b.n21, b22 = b.n22;
        this.n11 = b11 * n11 + b12 * n21; this.n12 = b11 * n12 + b12 * n22;
        this.n21 = b21 * n11 + b22 * n21; this.n22 = b21 * n12 + b22 * n22;
        return this;
    }

    equal(b: Matrix2): boolean {
        if (this.n11 !== b.n11) return false;
        if (this.n12 !== b.n12) return false;
        if (this.n21 !== b.n21) return false;
        if (this.n22 !== b.n22) return false;
        return true;
    }
    set(n11: number, n12: number, n21: number, n22: number) {
        this.n11 = n11; this.n12 = n12;
        this.n21 = n21; this.n22 = n22;
        return this;
    }
    copy(b: Matrix2) {
        this.n11 = b.n11; this.n12 = b.n12;
        this.n21 = b.n21; this.n22 = b.n22;
        return this;
    }
    clone(): Matrix2 {
        return new Matrix2(
            this.n11,
            this.n12,
            this.n21,
            this.n22,
        );
    }
}