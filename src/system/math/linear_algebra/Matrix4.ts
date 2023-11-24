import type { MatrixLike } from "./MatrixLike";
import { Matrix3 } from "./Matrix3";
import { Vector3 } from "./Vector3";

export class Matrix4 implements MatrixLike {
    // [ n11 n12 n13 n14 ]
    // [ n21 n22 n23 n24 ]
    // [ n31 n32 n33 n34 ]
    // [ n41 n42 n43 n44 ]
    public readonly elements: number[] = new Array(16);

    get row_dimension(): number { return 4; }
    get col_dimension(): number { return 4; }
    get determinant(): number {
        const [
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33,
        ] = this.elements;
        return m03 * m12 * m21 * m30 - m02 * m13 * m21 * m30 - m03 * m11 * m22 * m30 + m01 * m13 * m22 * m30 +
            m02 * m11 * m23 * m30 - m01 * m12 * m23 * m30 - m03 * m12 * m20 * m31 + m02 * m13 * m20 * m31 +
            m03 * m10 * m22 * m31 - m00 * m13 * m22 * m31 - m02 * m10 * m23 * m31 + m00 * m12 * m23 * m31 +
            m03 * m11 * m20 * m32 - m01 * m13 * m20 * m32 - m03 * m10 * m21 * m32 + m00 * m13 * m21 * m32 +
            m01 * m10 * m23 * m32 - m00 * m11 * m23 * m32 - m02 * m11 * m20 * m33 + m01 * m12 * m20 * m33 +
            m02 * m10 * m21 * m33 - m00 * m12 * m21 * m33 - m01 * m10 * m22 * m33 + m00 * m11 * m22 * m33;
    }
    get array(): number[] {
        const arr = new Array(16);
        arr[0] = this.elements[0];
        arr[1] = this.elements[1];
        arr[2] = this.elements[2];
        arr[3] = this.elements[3];
        arr[4] = this.elements[4];
        arr[5] = this.elements[5];
        arr[6] = this.elements[6];
        arr[7] = this.elements[7];
        arr[8] = this.elements[8];
        arr[9] = this.elements[9];
        arr[10] = this.elements[10];
        arr[11] = this.elements[11];
        arr[12] = this.elements[12];
        arr[13] = this.elements[13];
        arr[14] = this.elements[14];
        arr[15] = this.elements[15];
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

    public get basis() {
        return new Matrix3(
            this.elements[0], this.elements[1], this.elements[2],
            this.elements[4], this.elements[5], this.elements[6],
            this.elements[8], this.elements[9], this.elements[10],
        );
    }

    public get position() {
        return new Vector3(
            this.elements[3],
            this.elements[7],
            this.elements[11],
        );
    }

    constructor(n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number,
    ) {
        this.elements[0] = n11;
        this.elements[1] = n12;
        this.elements[2] = n13;
        this.elements[3] = n14;
        this.elements[4] = n21;
        this.elements[5] = n22;
        this.elements[6] = n23;
        this.elements[7] = n24;
        this.elements[8] = n31;
        this.elements[9] = n32;
        this.elements[10] = n33;
        this.elements[11] = n34;
        this.elements[12] = n41;
        this.elements[13] = n42;
        this.elements[14] = n43;
        this.elements[15] = n44;
    }

    public static make_Identity(): Matrix4 {
        return new Matrix4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }

    public static from_BasisPosition(basis: Matrix3 = Matrix3.make_Identity(), position: Vector3 = Vector3.make_Zero()): Matrix4 {
        return new Matrix4(
            basis.elements[0], basis.elements[1], basis.elements[2], position.x,
            basis.elements[3], basis.elements[4], basis.elements[5], position.y,
            basis.elements[6], basis.elements[7], basis.elements[8], position.z,
            0 /*           */, 0 /*           */, 0 /*           */, 1 /*    */,
        );
    }

    public static make_PrespectiveProjection(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);
        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = - (far + near) / (far - near);
        const d = (- 2 * far * near) / (far - near);
        return new Matrix4(
            x, 0, a, 0,
            0, y, b, 0,
            0, 0, c, d,
            0, 0, -1, 0,
        );
    }

    public static make_PerspectiveFovProjection(fov: number, aspect: number, near: number, far: number) {
        const top = near * Math.tan(fov / 2);
        const height = 2 * top;
        const width = aspect * height;
        const left = - 0.5 * width;
        return Matrix4.make_PrespectiveProjection(left, left + width, top, top - height, near, far);
    }

    public static make_OrthogonalProjection(left: number, right: number, top: number, bottom: number, near: number, far: number) {
        const w = 1.0 / (right - left);
        const h = 1.0 / (top - bottom);
        const p = 1.0 / (far - near);
        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = (far + near) * p;
        const z_inverse = - 2 * p;
        return new Matrix4(
            2 * w, 0, 0, - x,
            0, 2 * h, 0, - y,
            0, 0, z_inverse, - z,
            0, 0, 0, 1,

        );
    }

    index(row: number, col: number): number {
        if (row < 0 || row > 3 || col < 0 || col > 3) return 0;
        return this.elements[row * 4 + col];
    }

    add(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.elements[0] + b.elements[0], this.elements[1] + b.elements[1], this.elements[2] + b.elements[2], this.elements[3] + b.elements[3],
            this.elements[4] + b.elements[4], this.elements[5] + b.elements[5], this.elements[6] + b.elements[6], this.elements[7] + b.elements[7],
            this.elements[8] + b.elements[8], this.elements[9] + b.elements[9], this.elements[10] + b.elements[10], this.elements[11] + b.elements[11],
            this.elements[12] + b.elements[12], this.elements[13] + b.elements[13], this.elements[14] + b.elements[14], this.elements[15] + b.elements[15],
        );
    }
    add_Number(b: number): Matrix4 {
        return new Matrix4(
            this.elements[0] + b, this.elements[1] + b, this.elements[2] + b, this.elements[3] + b,
            this.elements[4] + b, this.elements[5] + b, this.elements[6] + b, this.elements[7] + b,
            this.elements[8] + b, this.elements[9] + b, this.elements[10] + b, this.elements[11] + b,
            this.elements[12] + b, this.elements[13] + b, this.elements[14] + b, this.elements[15] + b,
        );
    }
    minus(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.elements[0] - b.elements[0], this.elements[1] - b.elements[1], this.elements[2] - b.elements[2], this.elements[3] - b.elements[3],
            this.elements[4] - b.elements[4], this.elements[5] - b.elements[5], this.elements[6] - b.elements[6], this.elements[7] - b.elements[7],
            this.elements[8] - b.elements[8], this.elements[9] - b.elements[9], this.elements[10] - b.elements[10], this.elements[11] - b.elements[11],
            this.elements[12] - b.elements[12], this.elements[13] - b.elements[13], this.elements[14] - b.elements[14], this.elements[15] - b.elements[15],
        );
    }
    minus_Number(b: number): Matrix4 {
        return new Matrix4(
            this.elements[0] - b, this.elements[1] - b, this.elements[2] - b, this.elements[3] - b,
            this.elements[4] - b, this.elements[5] - b, this.elements[6] - b, this.elements[7] - b,
            this.elements[8] - b, this.elements[9] - b, this.elements[10] - b, this.elements[11] - b,
            this.elements[12] - b, this.elements[13] - b, this.elements[14] - b, this.elements[15] - b,
        );
    }
    mult(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.elements[0] * b.elements[0], this.elements[1] * b.elements[1], this.elements[2] * b.elements[2], this.elements[3] * b.elements[3],
            this.elements[4] * b.elements[4], this.elements[5] * b.elements[5], this.elements[6] * b.elements[6], this.elements[7] * b.elements[7],
            this.elements[8] * b.elements[8], this.elements[9] * b.elements[9], this.elements[10] * b.elements[10], this.elements[11] * b.elements[11],
            this.elements[12] * b.elements[12], this.elements[13] * b.elements[13], this.elements[14] * b.elements[14], this.elements[15] * b.elements[15],
        );
    }
    mult_Number(b: number): Matrix4 {
        return new Matrix4(
            this.elements[0] * b, this.elements[1] * b, this.elements[2] * b, this.elements[3] * b,
            this.elements[4] * b, this.elements[5] * b, this.elements[6] * b, this.elements[7] * b,
            this.elements[8] * b, this.elements[9] * b, this.elements[10] * b, this.elements[11] * b,
            this.elements[12] * b, this.elements[13] * b, this.elements[14] * b, this.elements[15] * b,
        );
    }
    div(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.elements[0] / b.elements[0], this.elements[1] / b.elements[1], this.elements[2] / b.elements[2], this.elements[3] / b.elements[3],
            this.elements[4] / b.elements[4], this.elements[5] / b.elements[5], this.elements[6] / b.elements[6], this.elements[7] / b.elements[7],
            this.elements[8] / b.elements[8], this.elements[9] / b.elements[9], this.elements[10] / b.elements[10], this.elements[11] / b.elements[11],
            this.elements[12] / b.elements[12], this.elements[13] / b.elements[13], this.elements[14] / b.elements[14], this.elements[15] / b.elements[15],
        );
    }
    div_Number(b: number): Matrix4 {
        return new Matrix4(
            this.elements[0] / b, this.elements[1] / b, this.elements[2] / b, this.elements[3] / b,
            this.elements[4] / b, this.elements[5] / b, this.elements[6] / b, this.elements[7] / b,
            this.elements[8] / b, this.elements[9] / b, this.elements[10] / b, this.elements[11] / b,
            this.elements[12] / b, this.elements[13] / b, this.elements[14] / b, this.elements[15] / b,
        );
    }
    addScaled(num: number, b: Matrix4): Matrix4 {
        return new Matrix4(
            this.elements[0] + b.elements[0] * num, this.elements[1] + b.elements[1] * num, this.elements[2] + b.elements[2] * num, this.elements[3] + b.elements[3] * num,
            this.elements[4] + b.elements[4] * num, this.elements[5] + b.elements[5] * num, this.elements[6] + b.elements[6] * num, this.elements[7] + b.elements[7] * num,
            this.elements[8] + b.elements[8] * num, this.elements[9] + b.elements[9] * num, this.elements[10] + b.elements[10] * num, this.elements[11] + b.elements[11] * num,
            this.elements[12] + b.elements[12] * num, this.elements[13] + b.elements[13] * num, this.elements[14] + b.elements[14] * num, this.elements[15] + b.elements[15] * num,
        );
    }
    transpose(): Matrix4 {
        return new Matrix4(
            this.elements[0], this.elements[4], this.elements[8], this.elements[12],
            this.elements[1], this.elements[5], this.elements[9], this.elements[13],
            this.elements[2], this.elements[6], this.elements[10], this.elements[14],
            this.elements[3], this.elements[7], this.elements[11], this.elements[15],
        );
    }
    inverse(): Matrix4 {
        const det = this.determinant;
        if (det === 0) return new Matrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        const [
            m00, m01, m02, m03,
            m10, m11, m12, m13,
            m20, m21, m22, m23,
            m30, m31, m32, m33,
        ] = this.elements;
        return new Matrix4(
            (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33) / det,
            (m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33) / det,
            (m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33) / det,
            (m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23) / det,
            (m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33) / det,
            (m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33) / det,
            (m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33) / det,
            (m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23) / det,
            (m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33) / det,
            (m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33) / det,
            (m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33) / det,
            (m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23) / det,
            (m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32) / det,
            (m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32) / det,
            (m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32) / det,
            (m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22) / det,
        )
    }
    /**
     * b * this
     */
    compose(b: Matrix4): Matrix4 {
        // [ b11 b12 b13 b14 ]   [ n11 n12 n13 n14 ]
        // [ b21 b22 b23 b24 ] * [ n21 n22 n23 n24 ]
        // [ b31 b32 b33 b34 ]   [ n31 n32 n33 n34 ]
        // [ b41 b42 b43 b44 ]   [ n41 n42 n43 n44 ]
        const [n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44] = this.elements;
        const [b11, b12, b13, b14, b21, b22, b23, b24, b31, b32, b33, b34, b41, b42, b43, b44] = b.elements;
        return new Matrix4(
            b11 * n11 + b12 * n21 + b13 * n31 + b14 * n41, b11 * n12 + b12 * n22 + b13 * n32 + b14 * n42, b11 * n13 + b12 * n23 + b13 * n33 + b14 * n43, b11 * n14 + b12 * n24 + b13 * n34 + b14 * n44,
            b21 * n11 + b22 * n21 + b23 * n31 + b24 * n41, b21 * n12 + b22 * n22 + b23 * n32 + b24 * n42, b21 * n13 + b22 * n23 + b23 * n33 + b24 * n43, b21 * n14 + b22 * n24 + b23 * n34 + b24 * n44,
            b31 * n11 + b32 * n21 + b33 * n31 + b34 * n41, b31 * n12 + b32 * n22 + b33 * n32 + b34 * n42, b31 * n13 + b32 * n23 + b33 * n33 + b34 * n43, b31 * n14 + b32 * n24 + b33 * n34 + b34 * n44,
            b41 * n11 + b42 * n21 + b43 * n31 + b44 * n41, b41 * n12 + b42 * n22 + b43 * n32 + b44 * n42, b41 * n13 + b42 * n23 + b43 * n33 + b44 * n43, b41 * n14 + b42 * n24 + b43 * n34 + b44 * n44,
        );
    }

    equal(b: Matrix4): boolean {
        for (let i = 0; i < 16; i++) {
            if (this.elements[i] !== b.elements[i]) return false;
        }
        return true;
    }

    clone(): Matrix4 {
        return new Matrix4(
            this.elements[0], this.elements[1], this.elements[2], this.elements[3],
            this.elements[4], this.elements[5], this.elements[6], this.elements[7],
            this.elements[8], this.elements[9], this.elements[10], this.elements[11],
            this.elements[12], this.elements[13], this.elements[14], this.elements[15],
        );
    }
}

export function mat4(n11: number, n12: number, n13: number, n14: number,
    n21: number, n22: number, n23: number, n24: number,
    n31: number, n32: number, n33: number, n34: number,
    n41: number, n42: number, n43: number, n44: number,
) {
    return new Matrix4(
        n11, n12, n13, n14,
        n21, n22, n23, n24,
        n31, n32, n33, n34,
        n41, n42, n43, n44,
    );
}