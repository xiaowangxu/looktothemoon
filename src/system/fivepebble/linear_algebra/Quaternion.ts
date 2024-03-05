import { Epsilon } from "../Scalar";
import { EulerOrder, type Euler } from "./Euler";
import type { Matrix3 } from "./Matrix3";
import { Vector3 } from "./Vector3";
import type { Vector4 } from "./Vector4";

export class Quaternion {

    //#region init

    static get new() { return new Quaternion(0, 0, 0, 1); }
    static create(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        return new Quaternion(x, y, z, w);
    }

    //#endregion

    static readonly #tmp_vector3_0 = new Vector3();

    public x: number;
    public y: number;
    public z: number;
    public w: number;

    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w; }
   
    public get axis() { return this.get_Axis(new Vector3()); }
    public get_Axis(target: Vector3) {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        if (Math.abs(w) > 1 - Epsilon) {
            return target.set(x, y, z);
        }
        const r = 1 / Math.sqrt(1 - w * w);
        return target.set(x * r, y * r, z * r);
    }

    public get angle() { return 2 * Math.acos(this.w); }

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public set_Vector4(vec: Vector4) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
        this.w = vec.w;
        return this;
    }

    public set_Euler(euler: Euler) {
        const { x, y, z, order } = euler;
        const cos = Math.cos, sin = Math.sin;
        const c1 = cos(x / 2), c2 = cos(y / 2), c3 = cos(z / 2);
        const s1 = sin(x / 2), s2 = sin(y / 2), s3 = sin(z / 2);
        switch (order) {
            case EulerOrder.XYZ:
                {

                    this.x = s1 * c2 * c3 + c1 * s2 * s3;
                    this.y = c1 * s2 * c3 - s1 * c2 * s3;
                    this.z = c1 * c2 * s3 + s1 * s2 * c3;
                    this.w = c1 * c2 * c3 - s1 * s2 * s3;
                    break;
                }
            case EulerOrder.YXZ:
                {

                    this.x = s1 * c2 * c3 + c1 * s2 * s3;
                    this.y = c1 * s2 * c3 - s1 * c2 * s3;
                    this.z = c1 * c2 * s3 - s1 * s2 * c3;
                    this.w = c1 * c2 * c3 + s1 * s2 * s3;
                    break;
                }
            case EulerOrder.ZXY:
                {

                    this.x = s1 * c2 * c3 - c1 * s2 * s3;
                    this.y = c1 * s2 * c3 + s1 * c2 * s3;
                    this.z = c1 * c2 * s3 + s1 * s2 * c3;
                    this.w = c1 * c2 * c3 - s1 * s2 * s3;
                    break;
                }
            case EulerOrder.ZYX:
                {

                    this.x = s1 * c2 * c3 - c1 * s2 * s3;
                    this.y = c1 * s2 * c3 + s1 * c2 * s3;
                    this.z = c1 * c2 * s3 - s1 * s2 * c3;
                    this.w = c1 * c2 * c3 + s1 * s2 * s3;
                    break;
                }
            case EulerOrder.YZX:
                {

                    this.x = s1 * c2 * c3 + c1 * s2 * s3;
                    this.y = c1 * s2 * c3 + s1 * c2 * s3;
                    this.z = c1 * c2 * s3 - s1 * s2 * c3;
                    this.w = c1 * c2 * c3 - s1 * s2 * s3;
                    break;
                }
            case EulerOrder.XZY:
                {

                    this.x = s1 * c2 * c3 - c1 * s2 * s3;
                    this.y = c1 * s2 * c3 - s1 * c2 * s3;
                    this.z = c1 * c2 * s3 + s1 * s2 * c3;
                    this.w = c1 * c2 * c3 + s1 * s2 * s3;
                    break;
                }
            default:
                {
                    const n: never = order;
                    break;
                }
        }
        return this;
    }

    public set_RotateMatrix(matrix: Matrix3) {
        const m11 = matrix.n11, m12 = matrix.n12, m13 = matrix.n13;
        const m21 = matrix.n21, m22 = matrix.n22, m23 = matrix.n23;
        const m31 = matrix.n31, m32 = matrix.n32, m33 = matrix.n33;
        const trace = m11 + m22 + m33;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            this.x = (m32 - m23) * s;
            this.y = (m13 - m31) * s;
            this.z = (m21 - m12) * s;
            this.w = 0.25 / s;
        }
        else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            this.x = 0.25 * s;
            this.y = (m12 + m21) / s;
            this.z = (m13 + m31) / s;
            this.w = (m32 - m23) / s;
        }
        else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            this.x = (m12 + m21) / s;
            this.y = 0.25 * s;
            this.z = (m23 + m32) / s;
            this.w = (m13 - m31) / s;
        }
        else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            this.x = (m13 + m31) / s;
            this.y = (m23 + m32) / s;
            this.z = 0.25 * s;
            this.w = (m21 - m12) / s;
        }
        return this;
    }

    public set_Rotate(v0: Vector3, v1: Vector3) {
        const c = Quaternion.#tmp_vector3_0.cross(v0, v1);
        const d = v0.dot(v1);
        if (d < Epsilon - 1) {
            this.x = 0;
            this.y = 1;
            this.z = 0;
            this.w = 0;
        }
        else {
            const s = Math.sqrt((1 + d) * 2);
            const rs = 1 / s;
            this.x = c.x * rs;
            this.y = c.y * rs;
            this.z = c.z * rs;
            this.w = s * 0.5;
        }
        return this;
    }

    public dot(b: Quaternion) {
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    }

    public normalize(a: Quaternion): Quaternion {
        const length = a.length;
        this.x = a.x / length;
        this.y = a.y / length;
        this.z = a.z / length;
        this.w = a.w / length;
        return this;
    }

    public inverse(a: Quaternion): Quaternion {
        this.x = -a.x;
        this.y = -a.y;
        this.z = -a.z;
        this.w = a.w;
        return this;
    }

    public angle_to(b: Quaternion) {
        const dot = this.dot(b);
        return Math.acos(dot * dot * 2 - 1);
    }

    public slerp(a: Quaternion, b: Quaternion, weight: number): Quaternion {
        let ax = a.x,
            ay = a.y,
            az = a.z,
            aw = a.w;
        let bx = b.x,
            by = b.y,
            bz = b.z,
            bw = b.w;

        let scale0, scale1;

        // calc cosine
        let cosom = ax * bx + ay * by + az * bz + aw * bw;

        // adjust signs (if necessary)
        if (cosom < 0) {
            cosom = -cosom;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        // calculate coefficients
        if (1 - cosom > Epsilon) {
            // standard case (slerp)
            const omega = Math.acos(cosom);
            const sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - weight) * omega) / sinom;
            scale1 = Math.sin(weight * omega) / sinom;
        }
        else {
            // "from" and "to" quaternions are very close
            //  ... so we can do a linear interpolation
            scale0 = 1.0 - weight;
            scale1 = weight;
        }

        this.x = scale0 * ax + scale1 * bx;
        this.y = scale0 * ay + scale1 * by;
        this.z = scale0 * az + scale1 * bz;
        this.w = scale0 * aw + scale1 * bw;
        return this;
    }

    public equal(b: Quaternion): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z && this.w === b.w;
    }
    public set(x: number, y: number, z: number, w: number): Quaternion {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
    public copy(b: Quaternion | Vector4): Quaternion {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.w = b.w;
        return this;
    }
    public clone(): Quaternion {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }
}