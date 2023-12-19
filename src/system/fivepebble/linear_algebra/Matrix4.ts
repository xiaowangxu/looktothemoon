import type { MatrixLike } from "./MatrixLike";
import { Matrix3 } from "./Matrix3";
import { Vector3 } from "./Vector3";

export class Matrix4 implements MatrixLike<Matrix4> {
    // [ n11 n12 n13 n14 ]
    // [ n21 n22 n23 n24 ]
    // [ n31 n32 n33 n34 ]
    // [ n41 n42 n43 n44 ]
    // n11,n12,n13,n14,n21,n22,n23,n24,n31,n32,n33,n34,n41,n42,n43,n44
    public readonly n11: number;
    public readonly n12: number;
    public readonly n13: number;
    public readonly n14: number;
    public readonly n21: number;
    public readonly n22: number;
    public readonly n23: number;
    public readonly n24: number;
    public readonly n31: number;
    public readonly n32: number;
    public readonly n33: number;
    public readonly n34: number;
    public readonly n41: number;
    public readonly n42: number;
    public readonly n43: number;
    public readonly n44: number;

    get row_dimension(): number { return 4; }
    get col_dimension(): number { return 4; }
    get determinant(): number {
        const m00 = this.n11, m01 = this.n12, m02 = this.n13, m03 = this.n14;
        const m10 = this.n21, m11 = this.n22, m12 = this.n23, m13 = this.n24;
        const m20 = this.n31, m21 = this.n32, m22 = this.n33, m23 = this.n34;
        const m30 = this.n41, m31 = this.n42, m32 = this.n43, m33 = this.n44;
        return m03 * m12 * m21 * m30 - m02 * m13 * m21 * m30 - m03 * m11 * m22 * m30 + m01 * m13 * m22 * m30 +
            m02 * m11 * m23 * m30 - m01 * m12 * m23 * m30 - m03 * m12 * m20 * m31 + m02 * m13 * m20 * m31 +
            m03 * m10 * m22 * m31 - m00 * m13 * m22 * m31 - m02 * m10 * m23 * m31 + m00 * m12 * m23 * m31 +
            m03 * m11 * m20 * m32 - m01 * m13 * m20 * m32 - m03 * m10 * m21 * m32 + m00 * m13 * m21 * m32 +
            m01 * m10 * m23 * m32 - m00 * m11 * m23 * m32 - m02 * m11 * m20 * m33 + m01 * m12 * m20 * m33 +
            m02 * m10 * m21 * m33 - m00 * m12 * m21 * m33 - m01 * m10 * m22 * m33 + m00 * m11 * m22 * m33;
    }
    get array(): number[] {
        return [this.n11, this.n12, this.n13, this.n14, this.n21, this.n22, this.n23, this.n24, this.n31, this.n32, this.n33, this.n34, this.n41, this.n42, this.n43, this.n44,];
    }
    get typed_array_f64(): Float64Array { return new Float64Array(this.array); }
    get typed_array_f32(): Float32Array { return new Float32Array(this.array); }
    get transposed_array(): number[] {
        const arr = new Array(16);
        arr[0] = this.n11;
        arr[1] = this.n21;
        arr[2] = this.n31;
        arr[3] = this.n41;
        arr[4] = this.n12;
        arr[5] = this.n22;
        arr[6] = this.n32;
        arr[7] = this.n42;
        arr[8] = this.n13;
        arr[9] = this.n23;
        arr[10] = this.n33;
        arr[11] = this.n43;
        arr[12] = this.n14;
        arr[13] = this.n24;
        arr[14] = this.n34;
        arr[15] = this.n44;
        return arr;
    }
    get typed_transposed_array_f64(): Float64Array { return new Float64Array(this.transposed_array); }
    get typed_transposed_array_f32(): Float32Array { return new Float32Array(this.transposed_array); }

    public get basis() {
        return new Matrix3(
            this.n11, this.n12, this.n13,
            this.n21, this.n22, this.n23,
            this.n31, this.n32, this.n33,
        );
    }

    public get position() {
        return new Vector3(
            this.n14,
            this.n24,
            this.n34,
        );
    }

    constructor(n11: number, n12: number, n13: number, n14: number,
        n21: number, n22: number, n23: number, n24: number,
        n31: number, n32: number, n33: number, n34: number,
        n41: number, n42: number, n43: number, n44: number,
    ) {
        this.n11 = n11;
        this.n12 = n12;
        this.n13 = n13;
        this.n14 = n14;
        this.n21 = n21;
        this.n22 = n22;
        this.n23 = n23;
        this.n24 = n24;
        this.n31 = n31;
        this.n32 = n32;
        this.n33 = n33;
        this.n34 = n34;
        this.n41 = n41;
        this.n42 = n42;
        this.n43 = n43;
        this.n44 = n44;
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
        return this.array[row * 4 + col];
    }

    add(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.n11 + b.n11, this.n12 + b.n12, this.n13 + b.n13, this.n14 + b.n14,
            this.n21 + b.n21, this.n22 + b.n22, this.n23 + b.n23, this.n24 + b.n24,
            this.n31 + b.n31, this.n32 + b.n32, this.n33 + b.n33, this.n34 + b.n34,
            this.n41 + b.n41, this.n42 + b.n42, this.n43 + b.n43, this.n44 + b.n44,
        );
    }
    add_Number(b: number): Matrix4 {
        return new Matrix4(
            this.n11 + b, this.n12 + b, this.n13 + b, this.n14 + b,
            this.n21 + b, this.n22 + b, this.n23 + b, this.n24 + b,
            this.n31 + b, this.n32 + b, this.n33 + b, this.n34 + b,
            this.n41 + b, this.n42 + b, this.n43 + b, this.n44 + b,
        );
    }
    minus(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.n11 - b.n11, this.n12 - b.n12, this.n13 - b.n13, this.n14 - b.n14,
            this.n21 - b.n21, this.n22 - b.n22, this.n23 - b.n23, this.n24 - b.n24,
            this.n31 - b.n31, this.n32 - b.n32, this.n33 - b.n33, this.n34 - b.n34,
            this.n41 - b.n41, this.n42 - b.n42, this.n43 - b.n43, this.n44 - b.n44,
        );
    }
    minus_Number(b: number): Matrix4 {
        return new Matrix4(
            this.n11 - b, this.n12 - b, this.n13 - b, this.n14 - b,
            this.n21 - b, this.n22 - b, this.n23 - b, this.n24 - b,
            this.n31 - b, this.n32 - b, this.n33 - b, this.n34 - b,
            this.n41 - b, this.n42 - b, this.n43 - b, this.n44 - b,
        );
    }
    mult(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.n11 * b.n11, this.n12 * b.n12, this.n13 * b.n13, this.n14 * b.n14,
            this.n21 * b.n21, this.n22 * b.n22, this.n23 * b.n23, this.n24 * b.n24,
            this.n31 * b.n31, this.n32 * b.n32, this.n33 * b.n33, this.n34 * b.n34,
            this.n41 * b.n41, this.n42 * b.n42, this.n43 * b.n43, this.n44 * b.n44,
        );
    }
    mult_Number(b: number): Matrix4 {
        return new Matrix4(
            this.n11 * b, this.n12 * b, this.n13 * b, this.n14 * b,
            this.n21 * b, this.n22 * b, this.n23 * b, this.n24 * b,
            this.n31 * b, this.n32 * b, this.n33 * b, this.n34 * b,
            this.n41 * b, this.n42 * b, this.n43 * b, this.n44 * b,
        );
    }
    div(b: Matrix4): Matrix4 {
        return new Matrix4(
            this.n11 / b.n11, this.n12 / b.n12, this.n13 / b.n13, this.n14 / b.n14,
            this.n21 / b.n21, this.n22 / b.n22, this.n23 / b.n23, this.n24 / b.n24,
            this.n31 / b.n31, this.n32 / b.n32, this.n33 / b.n33, this.n34 / b.n34,
            this.n41 / b.n41, this.n42 / b.n42, this.n43 / b.n43, this.n44 / b.n44,
        );
    }
    div_Number(b: number): Matrix4 {
        return new Matrix4(
            this.n11 / b, this.n12 / b, this.n13 / b, this.n14 / b,
            this.n21 / b, this.n22 / b, this.n23 / b, this.n24 / b,
            this.n31 / b, this.n32 / b, this.n33 / b, this.n34 / b,
            this.n41 / b, this.n42 / b, this.n43 / b, this.n44 / b,
        );
    }
    addScaled(num: number, b: Matrix4): Matrix4 {
        return new Matrix4(
            this.n11 + b.n11 * num, this.n12 + b.n12 * num, this.n13 + b.n13 * num, this.n14 + b.n14 * num,
            this.n21 + b.n21 * num, this.n22 + b.n22 * num, this.n23 + b.n23 * num, this.n24 + b.n24 * num,
            this.n31 + b.n31 * num, this.n32 + b.n32 * num, this.n33 + b.n33 * num, this.n34 + b.n34 * num,
            this.n41 + b.n41 * num, this.n42 + b.n42 * num, this.n43 + b.n43 * num, this.n44 + b.n44 * num,
        );
    }
    transpose(): Matrix4 {
        return new Matrix4(
            this.n11, this.n21, this.n31, this.n41,
            this.n12, this.n22, this.n32, this.n42,
            this.n13, this.n23, this.n33, this.n43,
            this.n14, this.n24, this.n34, this.n44,
        );
    }
    inverse(): Matrix4 {
        const det = this.determinant;
        if (det === 0) return new Matrix4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        const m00 = this.n11, m01 = this.n12, m02 = this.n13, m03 = this.n14;
        const m10 = this.n21, m11 = this.n22, m12 = this.n23, m13 = this.n24;
        const m20 = this.n31, m21 = this.n32, m22 = this.n33, m23 = this.n34;
        const m30 = this.n41, m31 = this.n42, m32 = this.n43, m33 = this.n44;
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
        const n11 = this.n11, n12 = this.n12, n13 = this.n13, n14 = this.n14;
        const n21 = this.n21, n22 = this.n22, n23 = this.n23, n24 = this.n24;
        const n31 = this.n31, n32 = this.n32, n33 = this.n33, n34 = this.n34;
        const n41 = this.n41, n42 = this.n42, n43 = this.n43, n44 = this.n44;
        const b11 = b.n11, b12 = b.n12, b13 = b.n13, b14 = b.n14;
        const b21 = b.n21, b22 = b.n22, b23 = b.n23, b24 = b.n24;
        const b31 = b.n31, b32 = b.n32, b33 = b.n33, b34 = b.n34;
        const b41 = b.n41, b42 = b.n42, b43 = b.n43, b44 = b.n44;
        return new Matrix4(
            b11 * n11 + b12 * n21 + b13 * n31 + b14 * n41, b11 * n12 + b12 * n22 + b13 * n32 + b14 * n42, b11 * n13 + b12 * n23 + b13 * n33 + b14 * n43, b11 * n14 + b12 * n24 + b13 * n34 + b14 * n44,
            b21 * n11 + b22 * n21 + b23 * n31 + b24 * n41, b21 * n12 + b22 * n22 + b23 * n32 + b24 * n42, b21 * n13 + b22 * n23 + b23 * n33 + b24 * n43, b21 * n14 + b22 * n24 + b23 * n34 + b24 * n44,
            b31 * n11 + b32 * n21 + b33 * n31 + b34 * n41, b31 * n12 + b32 * n22 + b33 * n32 + b34 * n42, b31 * n13 + b32 * n23 + b33 * n33 + b34 * n43, b31 * n14 + b32 * n24 + b33 * n34 + b34 * n44,
            b41 * n11 + b42 * n21 + b43 * n31 + b44 * n41, b41 * n12 + b42 * n22 + b43 * n32 + b44 * n42, b41 * n13 + b42 * n23 + b43 * n33 + b44 * n43, b41 * n14 + b42 * n24 + b43 * n34 + b44 * n44,
        );
    }

    equal(b: Matrix4): boolean {
        if (this.n11 !== b.n11) return false;
        if (this.n12 !== b.n12) return false;
        if (this.n13 !== b.n13) return false;
        if (this.n14 !== b.n14) return false;
        if (this.n21 !== b.n21) return false;
        if (this.n22 !== b.n22) return false;
        if (this.n23 !== b.n23) return false;
        if (this.n24 !== b.n24) return false;
        if (this.n31 !== b.n31) return false;
        if (this.n32 !== b.n32) return false;
        if (this.n33 !== b.n33) return false;
        if (this.n34 !== b.n34) return false;
        if (this.n41 !== b.n41) return false;
        if (this.n42 !== b.n42) return false;
        if (this.n43 !== b.n43) return false;
        if (this.n44 !== b.n44) return false;
        return true;
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