import { clamp, is_ApproxEqual } from "../Scalar";
import { Matrix3 } from "./Matrix3";
import type { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";

export enum EulerOrder {
    XYZ, YXZ, ZXY, ZYX, YZX, XZY
}

export class Euler extends Vector3 {
    public order: EulerOrder;

    constructor(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = EulerOrder.XYZ) {
        super(x, y, z);
        this.order = order;
    }

    public static from_Quaternion(quat: Quaternion, order: EulerOrder) {
        return Euler.from_RotateMatrix(Matrix3.from_Quaternion(quat), order);
    }

    public static from_RotateMatrix(matrix: Matrix3, order: EulerOrder) {
        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
        const m11 = matrix.n11, m12 = matrix.n12, m13 = matrix.n13;
        const m21 = matrix.n21, m22 = matrix.n22, m23 = matrix.n23;
        const m31 = matrix.n31, m32 = matrix.n32, m33 = matrix.n33;
        switch (order) {
            case EulerOrder.XYZ: {
                const _y = Math.asin(clamp(m13, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m13), 1)) {
                    return new Euler(
                        Math.atan2(- m23, m33),
                        _y,
                        Math.atan2(- m12, m11),
                        order,
                    );
                }
                else {
                    return new Euler(
                        Math.atan2(m32, m22),
                        _y,
                        0,
                        order,
                    );
                }
            }
            case EulerOrder.YXZ: {
                const _x = Math.asin(-clamp(m23, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m23), 1)) {
                    return new Euler(
                        _x,
                        Math.atan2(m13, m33),
                        Math.atan2(m21, m22),
                        order,
                    );
                }
                else {
                    return new Euler(
                        _x,
                        Math.atan2(- m31, m11),
                        0,
                        order,
                    );
                }
            }
            case EulerOrder.ZXY: {
                const _x = Math.asin(clamp(m32, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m32), 1)) {
                    return new Euler(
                        _x,
                        Math.atan2(- m31, m33),
                        Math.atan2(- m12, m22),
                        order,
                    );
                }
                else {
                    return new Euler(
                        _x,
                        0,
                        Math.atan2(m21, m11),
                        order,
                    );
                }
            }
            case EulerOrder.ZYX: {
                const _y = Math.asin(- clamp(m31, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m31), 1)) {
                    return new Euler(
                        Math.atan2(m32, m33),
                        _y,
                        Math.atan2(m21, m11),
                        order,
                    );
                }
                else {
                    return new Euler(
                        0,
                        _y,
                        Math.atan2(- m12, m22),
                        order,
                    );
                }
            }
            case EulerOrder.YZX: {
                const _z = Math.asin(clamp(m21, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m21), 1)) {
                    return new Euler(
                        Math.atan2(- m23, m22),
                        Math.atan2(- m31, m11),
                        _z,
                        order,
                    );
                }
                else {
                    return new Euler(
                        0,
                        Math.atan2(m13, m33),
                        _z,
                        order,
                    );
                }
            }
            case EulerOrder.XZY: {
                const _z = Math.asin(- clamp(m12, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m12), 1)) {
                    return new Euler(
                        Math.atan2(m32, m22),
                        Math.atan2(m13, m11),
                        _z,
                        order,
                    );
                }
                else {
                    return new Euler(
                        Math.atan2(- m23, m33),
                        0,
                        _z,
                        order,
                    );
                }
            }
            default: {
                const n: never = order;
                return new Euler();
            }
        }
    }

    public equal(b: Euler): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z && this.order === b.order;
    }
    public set(x: number, y: number, z: number, order: EulerOrder = EulerOrder.XYZ): void {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }
    public copy(b: Euler): void {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.order = b.order;
    }
}

export function euler(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = EulerOrder.XYZ) {
    return new Euler(x, y, z, order);
}