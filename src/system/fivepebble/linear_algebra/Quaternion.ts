import { Epsilon } from "../Scalar";
import { EulerOrder, type Euler } from "./Euler";
import type { Matrix3 } from "./Matrix3";
import { Vector3 } from "./Vector3";
import type { Vector4 } from "./Vector4";

export class Quaternion {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;
    public readonly w: number;

    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w; }
    public get axis() {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        if (Math.abs(w) > 1 - Epsilon) {
            return new Vector3(x, y, z);
        }
        const r = 1 / Math.sqrt(1 - w * w);
        return new Vector3(x * r, y * r, z * r);
    }
    public get angle() { return 2 * Math.acos(this.w); }

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public static from_Vector4(vec: Vector4) {
        return new Quaternion(vec.x, vec.y, vec.z, vec.w);
    }

    public static from_Euler(euler: Euler) {
        const { x, y, z, order } = euler;
        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        //	content/SpinCalc.m
        const cos = Math.cos, sin = Math.sin;
        const c1 = cos(x / 2), c2 = cos(y / 2), c3 = cos(z / 2);
        const s1 = sin(x / 2), s2 = sin(y / 2), s3 = sin(z / 2);
        switch (order) {
            case EulerOrder.XYZ:
                {
                    return new Quaternion(
                        s1 * c2 * c3 + c1 * s2 * s3,
                        c1 * s2 * c3 - s1 * c2 * s3,
                        c1 * c2 * s3 + s1 * s2 * c3,
                        c1 * c2 * c3 - s1 * s2 * s3,
                    );
                }
            case EulerOrder.YXZ:
                {
                    return new Quaternion(
                        s1 * c2 * c3 + c1 * s2 * s3,
                        c1 * s2 * c3 - s1 * c2 * s3,
                        c1 * c2 * s3 - s1 * s2 * c3,
                        c1 * c2 * c3 + s1 * s2 * s3,
                    );
                }
            case EulerOrder.ZXY:
                {
                    return new Quaternion(
                        s1 * c2 * c3 - c1 * s2 * s3,
                        c1 * s2 * c3 + s1 * c2 * s3,
                        c1 * c2 * s3 + s1 * s2 * c3,
                        c1 * c2 * c3 - s1 * s2 * s3,
                    );
                }
            case EulerOrder.ZYX:
                {
                    return new Quaternion(
                        s1 * c2 * c3 - c1 * s2 * s3,
                        c1 * s2 * c3 + s1 * c2 * s3,
                        c1 * c2 * s3 - s1 * s2 * c3,
                        c1 * c2 * c3 + s1 * s2 * s3,
                    );
                }
            case EulerOrder.YZX:
                {
                    return new Quaternion(
                        s1 * c2 * c3 + c1 * s2 * s3,
                        c1 * s2 * c3 + s1 * c2 * s3,
                        c1 * c2 * s3 - s1 * s2 * c3,
                        c1 * c2 * c3 - s1 * s2 * s3,
                    );
                }
            case EulerOrder.XZY:
                {
                    return new Quaternion(
                        s1 * c2 * c3 - c1 * s2 * s3,
                        c1 * s2 * c3 - s1 * c2 * s3,
                        c1 * c2 * s3 + s1 * s2 * c3,
                        c1 * c2 * c3 + s1 * s2 * s3,
                    );
                }
            default:
                const n: never = order;
                return new Quaternion();
        }
    }

    public static from_RotateMatrix(matrix: Matrix3) {
        const [m11, m12, m13, m21, m22, m23, m31, m32, m33] = matrix.elements;
        const trace = m11 + m22 + m33;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            return new Quaternion(
                (m32 - m23) * s,
                (m13 - m31) * s,
                (m21 - m12) * s,
                0.25 / s,
            );
        }
        else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            return new Quaternion(
                0.25 * s,
                (m12 + m21) / s,
                (m13 + m31) / s,
                (m32 - m23) / s,
            );
        } 
        else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            return new Quaternion(
                (m12 + m21) / s,
                0.25 * s,
                (m23 + m32) / s,
                (m13 - m31) / s,
            );
        }
        else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            return new Quaternion(
                (m13 + m31) / s,
                (m23 + m32) / s,
                0.25 * s,
                (m21 - m12) / s,
            );
        }
    }

    public static make_Rotate(v0: Vector3, v1: Vector3) {
        const c = v0.cross(v1);
        const d = v0.dot(v1);
        if (d < Epsilon - 1) {
            return new Quaternion(0, 1, 0, 0);
        }
        else {
            const s = Math.sqrt((1 + d) * 2);
            const rs = 1 / s;
            return new Quaternion(c.x * rs, c.y * rs, c.z * rs, s * 0.5);
        }
    }

    public dot(b: Quaternion) {
        return this.x * b.x + this.y * b.y + this.z * b.z + this.w * b.w;
    }

    public normalize() {
        const length = this.length;
        return new Quaternion(this.x / length, this.y / length, this.z / length, this.w / length);
    }

    public inverse() {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    public angle_To(b: Quaternion) {
        const dot = this.dot(b);
        return Math.acos(dot * dot * 2 - 1);
    }

    public slerp(b: Quaternion, weight: number) {
        let ax = this.x,
            ay = this.y,
            az = this.z,
            aw = this.w;
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

        return new Quaternion(
            scale0 * ax + scale1 * bx,
            scale0 * ay + scale1 * by,
            scale0 * az + scale1 * bz,
            scale0 * aw + scale1 * bw
        );
    }
}

export function quat(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    return new Quaternion(x, y, z, w);
}