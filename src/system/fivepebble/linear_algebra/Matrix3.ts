import { lerp } from "../Scalar";
import { Euler, EulerOrder } from "./Euler";
import { Matrix2 } from "./Matrix2";
import type { MatrixLike } from "./MatrixLike";
import type { Quaternion } from "./Quaternion";
import { Vector2 } from "./Vector2";
import { Vector3 } from "./Vector3";

export class Matrix3 implements MatrixLike<Matrix3> {

    //#region init

    static get new() { return new Matrix3(1, 0, 0, 0, 1, 0, 0, 0, 1); }
    static create(n11: number = 0, n12: number = 0, n13: number = 0,
        n21: number = 0, n22: number = 0, n23: number = 0,
        n31: number = 0, n32: number = 0, n33: number = 0) {
        return new Matrix3(n11, n12, n13, n21, n22, n23, n31, n32, n33);
    }

    //#endregion

    // used in Euler set_* to overcome ref init error
    public static readonly $tmp_matrix3_for_euler_0: Matrix3 = new Matrix3();
    static readonly #tmp_vector3_0: Vector3 = new Vector3();
    static readonly #tmp_matrix3_1: Matrix3 = new Matrix3();
    static readonly #tmp_euler_0: Euler = new Euler();

    // [ n11 n12 n13 ]
    // [ n21 n22 n23 ]
    // [ n31 n32 n33 ]
    // n11 n12 n13 n21 n22 n23 n31 n32 n33 

    public n11: number;
    public n12: number;
    public n13: number;
    public n21: number;
    public n22: number;
    public n23: number;
    public n31: number;
    public n32: number;
    public n33: number;

    get row_dimension(): number { return 3; }
    get col_dimension(): number { return 3; }
    get determinant(): number {
        const a = this.n11, b = this.n12, c = this.n13, d = this.n21, e = this.n22, f = this.n23, g = this.n31, h = this.n32, i = this.n33;
        return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    }
    get array(): number[] {
        return [this.n11, this.n12, this.n13, this.n21, this.n22, this.n23, this.n31, this.n32, this.n33];
    }
    get transposed_array(): number[] {
        return [this.n11, this.n21, this.n31, this.n12, this.n22, this.n32, this.n13, this.n23, this.n33];
    }

    public get basis() {
        return new Matrix2(
            this.n11, this.n12,
            this.n21, this.n22,
        );
    }

    public get_Basis(target: Matrix2) {
        target.n11 = this.n11; target.n12 = this.n12;
        target.n21 = this.n21; target.n22 = this.n22;
        return target;
    }

    public get position() {
        return new Vector2(
            this.n13,
            this.n23,
        );
    }

    public get_Position(target: Vector2) {
        target.x = this.n13;
        target.y = this.n23;
        return target;
    }

    constructor(n11: number = 1, n12: number = 0, n13: number = 0,
        n21: number = 0, n22: number = 1, n23: number = 0,
        n31: number = 0, n32: number = 0, n33: number = 1) {
        this.n11 = n11; this.n12 = n12; this.n13 = n13;
        this.n21 = n21; this.n22 = n22; this.n23 = n23;
        this.n31 = n31; this.n32 = n32; this.n33 = n33;
    }

    public set_Identity() {
        this.n11 = 1; this.n12 = 0; this.n13 = 0;
        this.n21 = 0; this.n22 = 1; this.n23 = 0;
        this.n31 = 0; this.n32 = 0; this.n33 = 1;
        return this;
    }

    public set_Axis(x: Vector3, y: Vector3, z: Vector3) {
        this.n11 = x.x; this.n21 = y.x; this.n31 = z.x;
        this.n12 = x.y; this.n22 = y.y; this.n32 = z.y;
        this.n13 = x.z; this.n23 = y.z; this.n33 = z.z;
        return this;
    }

    public set_RotateX(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        this.n11 = 1; this.n12 = 0; this.n13 = 0;
        this.n21 = 0; this.n22 = cr; this.n23 = -sr;
        this.n31 = 0; this.n32 = sr; this.n33 = cr;
        return this;
    }

    public set_RotateY(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        this.n11 = cr; this.n12 = 0; this.n13 = sr;
        this.n21 = 0; this.n22 = 1; this.n23 = 0;
        this.n31 = -sr; this.n32 = 0; this.n33 = cr;
        return this;
    }

    public set_RotateZ(angle: number) {
        const cr = Math.cos(angle);
        const sr = Math.sin(angle);
        this.n11 = cr; this.n12 = -sr; this.n13 = 0;
        this.n21 = sr; this.n22 = cr; this.n23 = 0;
        this.n31 = 0; this.n32 = 0; this.n33 = 1;
        return this;
    }

    public set_Euler(euler: Euler) {
        const { x, y, z, order } = euler;
        const a = Math.cos(x), b = Math.sin(x);
        const c = Math.cos(y), d = Math.sin(y);
        const e = Math.cos(z), f = Math.sin(z);
        if (order === EulerOrder.XYZ) {
            const ae = a * e, af = a * f, be = b * e, bf = b * f;
            this.n11 = c * e;
            this.n12 = - c * f;
            this.n13 = d;
            this.n21 = af + be * d;
            this.n22 = ae - bf * d;
            this.n23 = - b * c;
            this.n31 = bf - ae * d;
            this.n32 = be + af * d;
            this.n33 = a * c;
        } else if (order === EulerOrder.YXZ) {
            const ce = c * e, cf = c * f, de = d * e, df = d * f;
            this.n11 = ce + df * b;
            this.n12 = de * b - cf;
            this.n13 = a * d;
            this.n21 = a * f;
            this.n22 = a * e;
            this.n23 = - b;
            this.n31 = cf * b - de;
            this.n32 = df + ce * b;
            this.n33 = a * c;
        } else if (order === EulerOrder.ZXY) {
            const ce = c * e, cf = c * f, de = d * e, df = d * f;
            this.n11 = ce - df * b;
            this.n12 = - a * f;
            this.n13 = de + cf * b;
            this.n21 = cf + de * b;
            this.n22 = a * e;
            this.n23 = df - ce * b;
            this.n31 = - a * d;
            this.n32 = b;
            this.n33 = a * c;
        } else if (order === EulerOrder.ZYX) {
            const ae = a * e, af = a * f, be = b * e, bf = b * f;
            this.n11 = c * e;
            this.n12 = be * d - af;
            this.n13 = ae * d + bf;
            this.n21 = c * f;
            this.n22 = bf * d + ae;
            this.n23 = af * d - be;
            this.n31 = - d;
            this.n32 = b * c;
            this.n33 = a * c;
        } else if (order === EulerOrder.YZX) {
            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
            this.n11 = c * e;
            this.n12 = bd - ac * f;
            this.n13 = bc * f + ad;
            this.n21 = f;
            this.n22 = a * e;
            this.n23 = - b * e;
            this.n31 = - d * e;
            this.n32 = ad * f + bc;
            this.n33 = ac - bd * f;
        } else if (order === EulerOrder.XZY) {
            const ac = a * c, ad = a * d, bc = b * c, bd = b * d;
            this.n11 = c * e;
            this.n12 = - f;
            this.n13 = d * e;
            this.n21 = ac * f + bd;
            this.n22 = a * e;
            this.n23 = ad * f - bc;
            this.n31 = bc * f - ad;
            this.n32 = b * e;
            this.n33 = bd * f + ac;
        } else {
            const n: never = order;
            return this.set_Identity();
        }
        return this;
    }

    public set_Quaternion(quat: Quaternion) {
        const { x, y, z, w } = quat;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        this.n11 = 1 - yy - zz; this.n12 = xy - wz; this.n13 = xz + wy;
        this.n21 = xy + wz; this.n22 = 1 - xx - zz; this.n23 = yz - wx;
        this.n31 = xz - wy; this.n32 = yz + wx; this.n33 = 1 - xx - yy;
        return this;
    }

    public set_Scale(x: number, y: number, z: number) {
        this.n11 = x; this.n12 = 0; this.n13 = 0;
        this.n21 = 0; this.n22 = y; this.n23 = 0;
        this.n31 = 0; this.n32 = 0; this.n33 = z;
        return this;
    }

    index(row: number, col: number): number {
        if (row < 0 || row > 2 || col < 0 || col > 2) return 0;
        return this.array[row * 3 + col];
    }

    add(a: Matrix3, b: Matrix3): Matrix3 {
        this.n11 = a.n11 + b.n11; this.n12 = a.n12 + b.n12; this.n13 = a.n13 + b.n13;
        this.n21 = a.n21 + b.n21; this.n22 = a.n22 + b.n22; this.n23 = a.n23 + b.n23;
        this.n31 = a.n31 + b.n31; this.n32 = a.n32 + b.n32; this.n33 = a.n33 + b.n33;
        return this;
    }
    add_Number(a: Matrix3, b: number): Matrix3 {
        this.n11 = a.n11 + b; this.n12 = a.n12 + b; this.n13 = a.n13 + b;
        this.n21 = a.n21 + b; this.n22 = a.n22 + b; this.n23 = a.n23 + b;
        this.n31 = a.n31 + b; this.n32 = a.n32 + b; this.n33 = a.n33 + b;
        return this;
    }
    sub(a: Matrix3, b: Matrix3): Matrix3 {
        this.n11 = a.n11 - b.n11; this.n12 = a.n12 - b.n12; this.n13 = a.n13 - b.n13;
        this.n21 = a.n21 - b.n21; this.n22 = a.n22 - b.n22; this.n23 = a.n23 - b.n23;
        this.n31 = a.n31 - b.n31; this.n32 = a.n32 - b.n32; this.n33 = a.n33 - b.n33;
        return this;
    }
    sub_Number(a: Matrix3, b: number): Matrix3 {
        this.n11 = a.n11 - b; this.n12 = a.n12 - b; this.n13 = a.n13 - b;
        this.n21 = a.n21 - b; this.n22 = a.n22 - b; this.n23 = a.n23 - b;
        this.n31 = a.n31 - b; this.n32 = a.n32 - b; this.n33 = a.n33 - b;
        return this;
    }
    mult(a: Matrix3, b: Matrix3): Matrix3 {
        this.n11 = a.n11 * b.n11; this.n12 = a.n12 * b.n12; this.n13 = a.n13 * b.n13;
        this.n21 = a.n21 * b.n21; this.n22 = a.n22 * b.n22; this.n23 = a.n23 * b.n23;
        this.n31 = a.n31 * b.n31; this.n32 = a.n32 * b.n32; this.n33 = a.n33 * b.n33;
        return this;
    }
    mult_Number(a: Matrix3, b: number): Matrix3 {
        this.n11 = a.n11 * b; this.n12 = a.n12 * b; this.n13 = a.n13 * b;
        this.n21 = a.n21 * b; this.n22 = a.n22 * b; this.n23 = a.n23 * b;
        this.n31 = a.n31 * b; this.n32 = a.n32 * b; this.n33 = a.n33 * b;
        return this;
    }
    div(a: Matrix3, b: Matrix3): Matrix3 {
        this.n11 = a.n11 / b.n11; this.n12 = a.n12 / b.n12; this.n13 = a.n13 / b.n13;
        this.n21 = a.n21 / b.n21; this.n22 = a.n22 / b.n22; this.n23 = a.n23 / b.n23;
        this.n31 = a.n31 / b.n31; this.n32 = a.n32 / b.n32; this.n33 = a.n33 / b.n33;
        return this;
    }
    div_Number(a: Matrix3, b: number): Matrix3 {
        this.n11 = a.n11 / b; this.n12 = a.n12 / b; this.n13 = a.n13 / b;
        this.n21 = a.n21 / b; this.n22 = a.n22 / b; this.n23 = a.n23 / b;
        this.n31 = a.n31 / b; this.n32 = a.n32 / b; this.n33 = a.n33 / b;
        return this;
    }
    add_Scaled(a: Matrix3, num: number, b: Matrix3): Matrix3 {
        this.n11 = a.n11 + b.n11 * num; this.n12 = a.n12 + b.n12 * num; this.n13 = a.n13 + b.n13 * num;
        this.n21 = a.n21 + b.n21 * num; this.n22 = a.n22 + b.n22 * num; this.n23 = a.n23 + b.n23 * num;
        this.n31 = a.n31 + b.n31 * num; this.n32 = a.n32 + b.n32 * num; this.n33 = a.n33 + b.n33 * num;
        return this;
    }
    lerp(a: Matrix3, b: Matrix3, weight: number): Matrix3 {
        this.n11 = lerp(a.n11, b.n11, weight); this.n12 = lerp(a.n12, b.n12, weight), this.n13 = lerp(a.n13, b.n13, weight);
        this.n21 = lerp(a.n21, b.n21, weight); this.n22 = lerp(a.n22, b.n22, weight), this.n23 = lerp(a.n23, b.n23, weight);
        this.n31 = lerp(a.n31, b.n31, weight); this.n32 = lerp(a.n32, b.n32, weight), this.n33 = lerp(a.n33, b.n33, weight);
        return this;
    }
    transpose(a: Matrix3): Matrix3 {
        this.n11 = a.n11; this.n12 = a.n21; this.n13 = a.n31;
        this.n21 = a.n12; this.n22 = a.n22; this.n23 = a.n32;
        this.n31 = a.n13; this.n32 = a.n23; this.n33 = a.n33;
        return this;
    }
    inverse(a: Matrix3): Matrix3 {
        const n11 = a.n11, n21 = a.n21, n31 = a.n31;
        const n12 = a.n12, n22 = a.n22, n32 = a.n32;
        const n13 = a.n13, n23 = a.n23, n33 = a.n33;
        const t11 = n33 * n22 - n32 * n23;
        const t12 = n32 * n13 - n33 * n12;
        const t13 = n23 * n12 - n22 * n13;
        const det = n11 * t11 + n21 * t12 + n31 * t13;
        if (det === 0) {
            this.n11 = 0;
            this.n21 = 0;
            this.n31 = 0;
            this.n12 = 0;
            this.n22 = 0;
            this.n32 = 0;
            this.n13 = 0;
            this.n23 = 0;
            this.n33 = 0;
            return this;
        }
        const det_inverse = 1 / det;
        this.n11 = t11 * det_inverse;
        this.n21 = (n31 * n23 - n33 * n21) * det_inverse;
        this.n31 = (n32 * n21 - n31 * n22) * det_inverse;
        this.n12 = t12 * det_inverse;
        this.n22 = (n33 * n11 - n31 * n13) * det_inverse;
        this.n32 = (n31 * n12 - n32 * n11) * det_inverse;
        this.n13 = t13 * det_inverse;
        this.n23 = (n21 * n13 - n23 * n11) * det_inverse;
        this.n33 = (n22 * n11 - n21 * n12) * det_inverse;
        return this;
    }
    /**
     * b * a
     */
    compose(a: Matrix3, b: Matrix3): Matrix3 {
        const n11 = a.n11, n21 = a.n21, n31 = a.n31;
        const n12 = a.n12, n22 = a.n22, n32 = a.n32;
        const n13 = a.n13, n23 = a.n23, n33 = a.n33;
        const b11 = b.n11, b21 = b.n21, b31 = b.n31;
        const b12 = b.n12, b22 = b.n22, b32 = b.n32;
        const b13 = b.n13, b23 = b.n23, b33 = b.n33;
        this.n11 = b11 * n11 + b12 * n21 + b13 * n31;
        this.n12 = b11 * n12 + b12 * n22 + b13 * n32;
        this.n13 = b11 * n13 + b12 * n23 + b13 * n33;
        this.n21 = b21 * n11 + b22 * n21 + b23 * n31;
        this.n22 = b21 * n12 + b22 * n22 + b23 * n32;
        this.n23 = b21 * n13 + b22 * n23 + b23 * n33;
        this.n31 = b31 * n11 + b32 * n21 + b33 * n31;
        this.n32 = b31 * n12 + b32 * n22 + b33 * n32;
        this.n33 = b31 * n13 + b32 * n23 + b33 * n33;
        return this;
    }

    equal(b: Matrix3): boolean {
        if (this.n11 !== b.n11) return false;
        if (this.n12 !== b.n12) return false;
        if (this.n13 !== b.n13) return false;
        if (this.n21 !== b.n21) return false;
        if (this.n22 !== b.n22) return false;
        if (this.n23 !== b.n23) return false;
        if (this.n31 !== b.n31) return false;
        if (this.n32 !== b.n32) return false;
        if (this.n33 !== b.n33) return false;
        return true;
    }
    set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        this.n11 = n11; this.n12 = n12; this.n13 = n13;
        this.n21 = n21; this.n22 = n22; this.n23 = n23;
        this.n31 = n31; this.n32 = n32; this.n33 = n33;
        return this;
    }
    copy(b: Matrix3) {
        this.n11 = b.n11; this.n12 = b.n12; this.n13 = b.n13;
        this.n21 = b.n21; this.n22 = b.n22; this.n23 = b.n23;
        this.n31 = b.n31; this.n32 = b.n32; this.n33 = b.n33;
        return this;
    }
    clone(): Matrix3 {
        return new Matrix3(
            this.n11,
            this.n21,
            this.n31,
            this.n12,
            this.n22,
            this.n32,
            this.n13,
            this.n23,
            this.n33,
        );
    }

    public decompose_RotationScale(target_rotation: Euler | undefined, target_scale: Vector3 | undefined) {
        const n11 = this.n11, n21 = this.n21, n31 = this.n31;
        const n12 = this.n12, n22 = this.n22, n32 = this.n32;
        const n13 = this.n13, n23 = this.n23, n33 = this.n33;
        const vec = Matrix3.#tmp_vector3_0;
        const scale_x = vec.set(n11, n21, n31).length;
        const scale_y = vec.set(n12, n22, n32).length;
        const scale_z = vec.set(n13, n23, n33).length;
        target_scale?.set(scale_x, scale_y, scale_z);
        target_rotation?.copy(
            Matrix3.#tmp_euler_0.set_RotateMatrix(
                Matrix3.#tmp_matrix3_1.set(
                    n11 / scale_x, n12 / scale_y, n13 / scale_z,
                    n21 / scale_x, n22 / scale_y, n23 / scale_z,
                    n31 / scale_x, n32 / scale_y, n33 / scale_z,
                ),
                target_rotation.order
            )
        );
    }
}