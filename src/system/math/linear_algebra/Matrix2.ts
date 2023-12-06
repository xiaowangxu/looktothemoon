import type { MatrixLike } from "./MatrixLike";
import type { Vector2 } from "./Vector2";

export class Matrix2 implements MatrixLike<Matrix2> {
    // [ n11 n12 ]
    // [ n21 n22 ]
    public readonly elements: number[] = new Array(4);

    get row_dimension(): number { return 2; }
    get col_dimension(): number { return 2; }
    get determinant(): number {
        const [a, b, c, d] = this.elements;
        return a * d - b * c;
    }
    get array(): number[] {
        const arr = new Array(4);
        arr[0] = this.elements[0];
        arr[1] = this.elements[1];
        arr[2] = this.elements[2];
        arr[3] = this.elements[3];
        return arr;
    }
    get typed_array_f64(): Float64Array { return new Float64Array(this.elements); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.elements); }
    get transposed_array(): number[] {
        const arr = new Array(4);
        arr[0] = this.elements[0];
        arr[1] = this.elements[2];
        arr[2] = this.elements[1];
        arr[3] = this.elements[3];
        return arr;
    }
    get typed_transposed_array_f64(): Float64Array { return new Float64Array(this.transposed_array); }
    get typed_transposed_array_f32(): Float32Array { return new Float32Array(this.transposed_array); }

    constructor(n11: number, n12: number, n21: number, n22: number) {
        this.elements[0] = n11; this.elements[1] = n12;
        this.elements[3] = n21; this.elements[4] = n22;
    }

    public static make_Identity(): Matrix2 {
        return new Matrix2(
            1, 0,
            0, 1,
        );
    }

    public static from_Axis(x: Vector2, y: Vector2, z: Vector2) {
        return new Matrix2(
            x.x, y.x,
            x.y, y.y,
        );
    }

    public static make_Rotate(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        return new Matrix2(cr, -sr, sr, cr);
    }

    public static make_Scale(x: number, y: number) {
        return new Matrix2(
            x, 0,
            0, y,
        );
    }

    index(row: number, col: number): number {
        if (row < 0 || row > 1 || col < 0 || col > 1) return 0;
        return this.elements[row * 2 + col];
    }

    add(b: Matrix2): Matrix2 {
        return new Matrix2(
            this.elements[0] + b.elements[0], this.elements[1] + b.elements[1],
            this.elements[2] + b.elements[2], this.elements[3] + b.elements[3],
        );
    }
    add_Number(b: number): Matrix2 {
        return new Matrix2(
            this.elements[0] + b, this.elements[1] + b,
            this.elements[2] + b, this.elements[3] + b,
        );
    }
    minus(b: Matrix2): Matrix2 {
        return new Matrix2(
            this.elements[0] - b.elements[0], this.elements[1] - b.elements[1],
            this.elements[2] - b.elements[2], this.elements[3] - b.elements[3],
        );
    }
    minus_Number(b: number): Matrix2 {
        return new Matrix2(
            this.elements[0] - b, this.elements[1] - b,
            this.elements[2] - b, this.elements[3] - b,
        );
    }
    mult(b: Matrix2): Matrix2 {
        return new Matrix2(
            this.elements[0] * b.elements[0], this.elements[1] * b.elements[1],
            this.elements[2] * b.elements[2], this.elements[3] * b.elements[3],
        );
    }
    mult_Number(b: number): Matrix2 {
        return new Matrix2(
            this.elements[0] * b, this.elements[1] * b,
            this.elements[2] * b, this.elements[3] * b,
        );
    }
    div(b: Matrix2): Matrix2 {
        return new Matrix2(
            this.elements[0] / b.elements[0], this.elements[1] / b.elements[1],
            this.elements[2] / b.elements[2], this.elements[3] / b.elements[3],
        );
    }
    div_Number(b: number): Matrix2 {
        return new Matrix2(
            this.elements[0] / b, this.elements[1] / b,
            this.elements[2] / b, this.elements[3] / b,
        );
    }
    addScaled(num: number, b: Matrix2): Matrix2 {
        return new Matrix2(
            this.elements[0] + b.elements[0] * num, this.elements[1] + b.elements[1] * num,
            this.elements[2] + b.elements[2] * num, this.elements[3] + b.elements[3] * num,
        );
    }
    transpose(): Matrix2 {
        return new Matrix2(
            this.elements[0], this.elements[2],
            this.elements[1], this.elements[3],
        );
    }
    inverse(): Matrix2 {
        const det = this.determinant;
        if (det === 0) return new Matrix2(0, 0, 0, 0);
        const [n11, n12, n21, n22] = this.elements;
        const idet = 1 / det;
        return new Matrix2(n22 * idet, n12 * -idet, n21 * -idet, n11 * idet);
    }
    /**
     * b * this
     */
    compose(b: Matrix2): Matrix2 {
        // [ b11 b12 ] * [ n11 n12 ]   
        // [ b21 b22 ]   [ n21 n22 ]   
        const [n11, n12, n21, n22] = this.elements;
        const [b11, b12, b21, b22] = b.elements;
        return new Matrix2(
            b11 * n11 + b12 * n21, b11 * n12 + b12 * n22,
            b21 * n11 + b22 * n21, b21 * n12 + b22 * n22,
        );
    }

    equal(b: Matrix2): boolean {
        for (let i = 0; i < 4; i++) {
            if (this.elements[i] !== b.elements[i]) return false;
        }
        return true;
    }
}

export function mat2(n11: number, n12: number, n21: number, n22: number) {
    return new Matrix2(n11, n12, n21, n22);
}