import type { MatrixLike } from "./MatrixLike";
import type { Vector3 } from "./Vector3";

export class Matrix3 implements MatrixLike {
    // [ n11 n12 n13 ]
    // [ n21 n22 n23 ]
    // [ n31 n32 n33 ]
    public readonly elements: number[] = new Array(9);

    get row_dimension(): number { return 3; }
    get col_dimension(): number { return 3; }
    get determinant(): number {
        const [a, b, c, d, e, f, g, h, i] = this.elements;
        return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    }
    get array(): number[] {
        const arr = new Array(9);
        arr[0] = this.elements[0];
        arr[1] = this.elements[1];
        arr[2] = this.elements[2];
        arr[3] = this.elements[3];
        arr[4] = this.elements[4];
        arr[5] = this.elements[5];
        arr[6] = this.elements[6];
        arr[7] = this.elements[7];
        arr[8] = this.elements[8];
        return arr;
    }
    get typed_array_f64(): Float64Array { return new Float64Array(this.elements); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.elements); }
    // get rank(): number {
    //     throw new Error("Method not implemented.");
    // }
    // get full_rank(): boolean {
    //     throw new Error("Method not implemented.");
    // }

    constructor(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        this.elements[0] = n11; this.elements[1] = n12; this.elements[2] = n13;
        this.elements[3] = n21; this.elements[4] = n22; this.elements[5] = n23;
        this.elements[6] = n31; this.elements[7] = n32; this.elements[8] = n33;
    }

    public static make_Identity(): Matrix3 {
        return new Matrix3(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        );
    }

    public static from_Axis(x: Vector3, y: Vector3, z: Vector3) {
        return new Matrix3(
            x.x, y.x, z.x,
            x.y, y.y, z.y,
            x.z, y.z, z.z,
        );
    }

    public static make_RotateX(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        return new Matrix3(
            1, 0, 0,
            0, cr, -sr,
            0, sr, cr,
        );
    }

    public static make_RotateY(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        return new Matrix3(
            cr, 0, sr,
            0, 1, 0,
            -sr, 0, cr,
        );
    }

    public static make_RotateZ(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        return new Matrix3(
            cr, -sr, 0,
            sr, cr, 0,
            0, 0, 1,
        );
    }

    public static make_Scale(x: number, y: number, z: number) {
        return new Matrix3(
            x, 0, 0,
            0, y, 0,
            0, 0, z,
        );
    }

    index(row: number, col: number): number {
        if (row < 0 || row > 2 || col < 0 || col > 2) return 0;
        return this.elements[row * 3 + col];
    }

    add(b: Matrix3): Matrix3 {
        return new Matrix3(
            this.elements[0] + b.elements[0], this.elements[1] + b.elements[1], this.elements[2] + b.elements[2],
            this.elements[3] + b.elements[3], this.elements[4] + b.elements[4], this.elements[5] + b.elements[5],
            this.elements[6] + b.elements[6], this.elements[7] + b.elements[7], this.elements[8] + b.elements[8],
        );
    }
    add_Number(b: number): Matrix3 {
        return new Matrix3(
            this.elements[0] + b, this.elements[1] + b, this.elements[2] + b,
            this.elements[3] + b, this.elements[4] + b, this.elements[5] + b,
            this.elements[6] + b, this.elements[7] + b, this.elements[8] + b,
        );
    }
    minus(b: Matrix3): Matrix3 {
        return new Matrix3(
            this.elements[0] - b.elements[0], this.elements[1] - b.elements[1], this.elements[2] - b.elements[2],
            this.elements[3] - b.elements[3], this.elements[4] - b.elements[4], this.elements[5] - b.elements[5],
            this.elements[6] - b.elements[6], this.elements[7] - b.elements[7], this.elements[8] - b.elements[8],
        );
    }
    minus_Number(b: number): Matrix3 {
        return new Matrix3(
            this.elements[0] - b, this.elements[1] - b, this.elements[2] - b,
            this.elements[3] - b, this.elements[4] - b, this.elements[5] - b,
            this.elements[6] - b, this.elements[7] - b, this.elements[8] - b,
        );
    }
    mult(b: Matrix3): Matrix3 {
        return new Matrix3(
            this.elements[0] * b.elements[0], this.elements[1] * b.elements[1], this.elements[2] * b.elements[2],
            this.elements[3] * b.elements[3], this.elements[4] * b.elements[4], this.elements[5] * b.elements[5],
            this.elements[6] * b.elements[6], this.elements[7] * b.elements[7], this.elements[8] * b.elements[8],
        );
    }
    mult_Number(b: number): Matrix3 {
        return new Matrix3(
            this.elements[0] * b, this.elements[1] * b, this.elements[2] * b,
            this.elements[3] * b, this.elements[4] * b, this.elements[5] * b,
            this.elements[6] * b, this.elements[7] * b, this.elements[8] * b,
        );
    }
    div(b: Matrix3): Matrix3 {
        return new Matrix3(
            this.elements[0] / b.elements[0], this.elements[1] / b.elements[1], this.elements[2] / b.elements[2],
            this.elements[3] / b.elements[3], this.elements[4] / b.elements[4], this.elements[5] / b.elements[5],
            this.elements[6] / b.elements[6], this.elements[7] / b.elements[7], this.elements[8] / b.elements[8],
        );
    }
    div_Number(b: number): Matrix3 {
        return new Matrix3(
            this.elements[0] / b, this.elements[1] / b, this.elements[2] / b,
            this.elements[3] / b, this.elements[4] / b, this.elements[5] / b,
            this.elements[6] / b, this.elements[7] / b, this.elements[8] / b,
        );
    }
    addScaled(num: number, b: Matrix3): Matrix3 {
        return new Matrix3(
            this.elements[0] + b.elements[0] * num, this.elements[1] + b.elements[1] * num, this.elements[2] + b.elements[2] * num,
            this.elements[3] + b.elements[3] * num, this.elements[4] + b.elements[4] * num, this.elements[5] + b.elements[5] * num,
            this.elements[6] + b.elements[6] * num, this.elements[7] + b.elements[7] * num, this.elements[8] + b.elements[8] * num,
        );
    }
    transpose(): Matrix3 {
        // [ 1 2 3 ]      [ 1 4 7 ]
        // [ 4 5 6 ]  ->  [ 2 5 8 ]
        // [ 7 8 9 ]      [ 3 6 9 ]
        return new Matrix3(
            this.elements[0], this.elements[3], this.elements[6],
            this.elements[1], this.elements[4], this.elements[7],
            this.elements[2], this.elements[5], this.elements[8],
        );
    }
    inverse(): Matrix3 {
        const [n11, n21, n31, n12, n22, n32, n13, n23, n33] = this.elements;
        const t11 = n33 * n22 - n32 * n23;
        const t12 = n32 * n13 - n33 * n12;
        const t13 = n23 * n12 - n22 * n13;
        const det = n11 * t11 + n21 * t12 + n31 * t13;
        if (det === 0) return new Matrix3(0, 0, 0, 0, 0, 0, 0, 0, 0);
        const det_inverse = 1 / det;
        return new Matrix3(
            t11 * det_inverse,
            (n31 * n23 - n33 * n21) * det_inverse,
            (n32 * n21 - n31 * n22) * det_inverse,
            t12 * det_inverse,
            (n33 * n11 - n31 * n13) * det_inverse,
            (n31 * n12 - n32 * n11) * det_inverse,
            t13 * det_inverse,
            (n21 * n13 - n23 * n11) * det_inverse,
            (n22 * n11 - n21 * n12) * det_inverse,
        );
    }
    /**
     * b * this
     */
    compose(b: Matrix3): Matrix3 {
        // [ b11 b12 b13 ]   [ n11 n12 n13 ]   
        // [ b21 b22 b23 ] * [ n21 n22 n23 ]   
        // [ b31 b32 b33 ]   [ n31 n32 n33 ]   
        const [n11, n12, n13, n21, n22, n23, n31, n32, n33] = this.elements;
        const [b11, b12, b13, b21, b22, b23, b31, b32, b33] = b.elements;
        return new Matrix3(
            b11 * n11 + b12 * n21 + b13 * n31, b11 * n12 + b12 * n22 + b13 * n32, b11 * n13 + b12 * n23 + b13 * n33,
            b21 * n11 + b22 * n21 + b23 * n31, b21 * n12 + b22 * n22 + b23 * n32, b21 * n13 + b22 * n23 + b23 * n33,
            b31 * n11 + b32 * n21 + b33 * n31, b31 * n12 + b32 * n22 + b33 * n32, b31 * n13 + b32 * n23 + b33 * n33,
        );
    }

    equal(b: Matrix3): boolean {
        for (let i = 0; i < 9; i++) {
            if (this.elements[i] !== b.elements[i]) return false;
        }
        return true;
    }

    clone(): Matrix3 {
        return new Matrix3(
            this.elements[0], this.elements[1], this.elements[2],
            this.elements[3], this.elements[4], this.elements[5],
            this.elements[6], this.elements[7], this.elements[8],
        );
    }
}

export function mat3(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
    return new Matrix3(n11, n12, n13, n21, n22, n23, n31, n32, n33);
}