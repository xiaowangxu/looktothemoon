import { EPSILON } from "../Scalar";
import { Vector3 } from "./Vector3";
import type { Vector4 } from "./Vector4";

export class Quaternion {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    get length(): number { return Math.sqrt(this.squared_length); }
    get squared_length(): number { return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w; }
    public get axis() {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        if (Math.abs(w) > 1 - EPSILON) {
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

    public static from_Euler(euler: Vector3) {
        const half_a1 = euler.y * 0.5;
        const half_a2 = euler.x * 0.5;
        const half_a3 = euler.z * 0.5;
        // from godot-engine https://github.com/godotengine/godot/blob/fc99492d3066098e938449b10e02f8e01d07e2d1/core/math/quaternion.cpp#L320
        // R = Y(a1).X(a2).Z(a3) convention for Euler angles.
        // Conversion to quaternion as listed in https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/19770024290.pdf (page A-6)
        // a3 is the angle of the first rotation, following the notation in this reference.
        const cos_a1 = Math.cos(half_a1);
        const sin_a1 = Math.sin(half_a1);
        const cos_a2 = Math.cos(half_a2);
        const sin_a2 = Math.sin(half_a2);
        const cos_a3 = Math.cos(half_a3);
        const sin_a3 = Math.sin(half_a3);
        return new Quaternion(
            sin_a1 * cos_a2 * sin_a3 + cos_a1 * sin_a2 * cos_a3,
            sin_a1 * cos_a2 * cos_a3 - cos_a1 * sin_a2 * sin_a3,
            -sin_a1 * sin_a2 * cos_a3 + cos_a1 * cos_a2 * sin_a3,
            sin_a1 * sin_a2 * sin_a3 + cos_a1 * cos_a2 * cos_a3
        );
    }

    public static from_Rotation(v0: Vector3, v1: Vector3) {
        const c = v0.cross(v1);
        const d = v0.dot(v1);
        if (d < EPSILON - 1) {
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

    // public Matrix3 Basis() {
    //         Scalar d = this.SquaredLength;
    //         Scalar s = 2 / d;
    //         Scalar x = this.Vector.X, y = this.Vector.Y, z = this.Vector.Z, w = this.Vector.W;
    //         Scalar xs = x * s, ys = y * s, zs = z * s;
    //         Scalar wx = w * xs, wy = w * ys, wz = w * zs;
    //         Scalar xx = x * xs, xy = x * ys, xz = x * zs;
    //         Scalar yy = y * ys, yz = y * zs, zz = z * zs;
    //     return new Matrix3(
    //         new Vector3(1 - (yy + zz), xy - wz, xz + wy),
    //         new Vector3(xy + wz, 1 - (xx + zz), yz - wx),
    //         new Vector3(xz - wy, yz + wx, 1 - (xx + yy))
    //     );
    // }

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
        if (1 - cosom > EPSILON) {
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

    public set(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export function quar(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    return new Quaternion(x, y, z, w);
}