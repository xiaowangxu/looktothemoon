import { Euler, EulerOrder } from "./Euler";
import { Matrix2 } from "./Matrix2";
import type { MatrixLike } from "./MatrixLike";
import type { Quaternion } from "./Quaternion";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

export class Matrix3 implements MatrixLike<Matrix3> {
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
    get transposed_array(): number[] {
        const arr = new Array(9);
        arr[0] = this.elements[0];
        arr[1] = this.elements[3];
        arr[2] = this.elements[6];
        arr[3] = this.elements[1];
        arr[4] = this.elements[4];
        arr[5] = this.elements[7];
        arr[6] = this.elements[2];
        arr[7] = this.elements[5];
        arr[8] = this.elements[8];
        return arr;
    }
    get typed_transposed_array_f64(): Float64Array { return new Float64Array(this.transposed_array); }
    get typed_transposed_array_f32(): Float32Array { return new Float32Array(this.transposed_array); }

    public get basis() {
        return new Matrix2(
            this.elements[0], this.elements[1],
            this.elements[3], this.elements[4],
        );
    }

    public get position() {
        return new Vector2(
            this.elements[2],
            this.elements[5],
        );
    }

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

    public static from_Euler(euler: Euler) {
        const { x, y, z, order } = euler;
        const a = Math.cos(x), b = Math.sin(x);
        const c = Math.cos(y), d = Math.sin(y);
        const e = Math.cos(z), f = Math.sin(z);
        if (order === EulerOrder.XYZ) {
            const ae = a * e, af = a * f, be = b * e, bf = b * f;
            return new Matrix3(
                c * e, - c * f, d,
                af + be * d, ae - bf * d, - b * c,
                bf - ae * d, be + af * d, a * c,
            );
        } else if (order === EulerOrder.YXZ) {
            const ce = c * e, cf = c * f, de = d * e, df = d * f;
            return new Matrix3(
                ce + df * b, de * b - cf, a * d,
                a * f, a * e, - b,
                cf * b - de, df + ce * b, a * c,
            );
        } else if (order === EulerOrder.ZXY) {
            const ce = c * e, cf = c * f, de = d * e, df = d * f;
            return new Matrix3(
                ce - df * b, - a * f, de + cf * b,
                cf + de * b, a * e, df - ce * b,
                - a * d, b, a * c,
            );
        } else if (order === EulerOrder.ZYX) {
            const ae = a * e, af = a * f, be = b * e, bf = b * f;
            return new Matrix3(
                c * e, be * d - af, ae * d + bf,
                c * f, bf * d + ae, af * d - be,
                - d, b * c, a * c,
            );
        } else if (order === EulerOrder.YZX) {
            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
            return new Matrix3(
                c * e, bd - ac * f, bc * f + ad,
                f, a * e, - b * e,
                - d * e, ad * f + bc, ac - bd * f,
            );
        } else if (order === EulerOrder.XZY) {
            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
            return new Matrix3(
                c * e, - f, d * e,
                ac * f + bd, a * e, ad * f - bc,
                bc * f - ad, b * e, bd * f + ac,
            );
        } else {
            const n: never = order;
            return Matrix3.make_Identity();
        }
    }

    public static from_Quaternion(quat: Quaternion) {
        const { x, y, z, w } = quat;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        return new Matrix3(
            1 - yy - zz, xy - wz, xz + wy,
            xy + wz, 1 - xx - zz, yz - wx,
            xz - wy, yz + wx, 1 - xx - yy,
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

    public get_RotationScale(order: EulerOrder = EulerOrder.XYZ): [Euler, Vector3] {
        const [n11, n12, n13, n21, n22, n23, n31, n32, n33] = this.elements;
        const scale = new Vector3(
            new Vector3(n11, n21, n31).length,
            new Vector3(n12, n22, n32).length,
            new Vector3(n13, n23, n33).length,
        );
        const euler = Euler.from_RotateMatrix(
            new Matrix3(
                n11 / scale.x, n12 / scale.y, n13 / scale.z,
                n21 / scale.x, n22 / scale.y, n23 / scale.z,
                n31 / scale.x, n32 / scale.y, n33 / scale.z,
            ),
            order
        );
        return [euler, scale];
    }
}

export function mat3(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
    return new Matrix3(n11, n12, n13, n21, n22, n23, n31, n32, n33);
}