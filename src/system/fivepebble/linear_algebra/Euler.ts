import type { Cloneable, Copyable, Equality } from "@/system/utils/Type";
import { clamp, is_ApproxEqual } from "../Scalar";
import { Matrix3 } from "./Matrix3";
import type { Quaternion } from "./Quaternion";

export enum EulerOrder {
    XYZ, YXZ, ZXY, ZYX, YZX, XZY
}

export class Euler implements Cloneable<Euler>, Copyable<Euler>, Equality<Euler> {

    //#region init

    static get new() { return new Euler(); }
    static create(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = EulerOrder.XYZ) {
        return new Euler(x, y, z, order);
    }
    static readonly #tmp = new Euler();
    public static tmp(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = EulerOrder.XYZ) { return Euler.#tmp.set(x, y, z, order); }

    //#endregion

    public x: number;
    public y: number;
    public z: number;
    public order: EulerOrder;

    constructor(x: number = 0, y: number = 0, z: number = 0, order: EulerOrder = EulerOrder.XYZ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }

    public set_Quaternion(quat: Quaternion, order: EulerOrder = EulerOrder.XYZ) {
        return this.set_RotateMatrix(Matrix3.$tmp_matrix3_for_euler_0.set_Quaternion(quat), order);
    }

    public set_RotateMatrix(matrix: Matrix3, order: EulerOrder) {
        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
        const m11 = matrix.n11, m12 = matrix.n12, m13 = matrix.n13;
        const m21 = matrix.n21, m22 = matrix.n22, m23 = matrix.n23;
        const m31 = matrix.n31, m32 = matrix.n32, m33 = matrix.n33;
        switch (order) {
            case EulerOrder.XYZ: {
                const _y = Math.asin(clamp(m13, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m13), 1)) {
                    this.x = Math.atan2(- m23, m33);
                    this.y = _y;
                    this.z = Math.atan2(- m12, m11);
                    this.order = order;
                    break;
                }
                else {
                    this.x = Math.atan2(m32, m22);
                    this.y = _y;
                    this.z = 0;
                    this.order = order;
                    break;
                }
            }
            case EulerOrder.YXZ: {
                const _x = Math.asin(-clamp(m23, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m23), 1)) {
                    this.x = _x;
                    this.y = Math.atan2(m13, m33);
                    this.z = Math.atan2(m21, m22);
                    this.order = order;
                    break;
                }
                else {
                    this.x = _x;
                    this.y = Math.atan2(- m31, m11);
                    this.z = 0;
                    this.order = order;
                    break;
                }
            }
            case EulerOrder.ZXY: {
                const _x = Math.asin(clamp(m32, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m32), 1)) {
                    this.x = _x;
                    this.y = Math.atan2(- m31, m33);
                    this.z = Math.atan2(- m12, m22);
                    this.order = order;
                    break;
                }
                else {
                    this.x = _x;
                    this.y = 0;
                    this.z = Math.atan2(m21, m11);
                    this.order = order;
                    break;
                }
            }
            case EulerOrder.ZYX: {
                const _y = Math.asin(- clamp(m31, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m31), 1)) {
                    this.x = Math.atan2(m32, m33);
                    this.y = _y;
                    this.z = Math.atan2(m21, m11);
                    this.order = order;
                    break;
                }
                else {
                    this.x = 0;
                    this.y = _y;
                    this.z = Math.atan2(- m12, m22);
                    this.order = order;
                    break;
                }
            }
            case EulerOrder.YZX: {
                const _z = Math.asin(clamp(m21, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m21), 1)) {
                    this.x = Math.atan2(- m23, m22);
                    this.y = Math.atan2(- m31, m11);
                    this.z = _z;
                    this.order = order;
                    break;
                }
                else {
                    this.x = 0;
                    this.y = Math.atan2(m13, m33);
                    this.z = _z;
                    this.order = order;
                    break;
                }
            }
            case EulerOrder.XZY: {
                const _z = Math.asin(- clamp(m12, - 1, 1));
                if (!is_ApproxEqual(Math.abs(m12), 1)) {
                    this.x = Math.atan2(m32, m22);
                    this.y = Math.atan2(m13, m11);
                    this.z = _z;
                    this.order = order;
                    break;
                }
                else {
                    this.x = Math.atan2(- m23, m33);
                    this.y = 0;
                    this.z = _z;
                    this.order = order;
                    break;
                }
            }
            default: {
                const n: never = order;
            }
        }
        return this;
    }

    equal(b: Euler): boolean {
        return this.x === b.x && this.y === b.y && this.z === b.z && this.order === b.order;
    }
    public set(x: number, y: number, z: number, order: EulerOrder = EulerOrder.XYZ) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
        return this;
    }
    copy(b: Euler) {
        this.x = b.x;
        this.y = b.y;
        this.z = b.z;
        this.order = b.order;
        return this;
    }
    clone(): Euler {
        return new Euler(this.x, this.y, this.z, this.order);
    }
}