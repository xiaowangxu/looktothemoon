import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Vector3 } from "../linear_algebra/Vector3";
import type { RayLike } from "./RayLike";
import { Line3 } from "./Line3";
import { Epsilon } from "../Scalar";
import { Out } from "@/system/utils/Type";

export class Ray3 implements RayLike<Vector3, Matrix3> {

    //#region init

    static get new() { return new Ray3(Ray3.#const_vector3_zero, Ray3.#const_vector3_right); }
    static create(origin: Vector3, direction: Vector3) {
        return new Ray3(origin, direction);
    }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #const_vector3_right = new Vector3(1, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3();
    static readonly #tmp_vector3_1 = new Vector3();
    static readonly #tmp_vector3_2 = new Vector3();

    public readonly origin: Vector3;
    public readonly direction: Vector3;

    constructor(origin: Vector3, direction: Vector3) {
        this.origin = origin.clone();
        this.direction = direction.clone();
    }

    get_Point(distance: number, target: Vector3): Vector3 {
        return target.add_Scaled(this.origin, distance, this.direction);
    }

    get_Line(start: number, end: number, target: Line3): Line3 {
        this.get_Point(start, target.start);
        this.get_Point(end, target.end);
        return target;
    }

    equal(b: Ray3): boolean {
        return this.origin.equal(b.origin) && this.direction.equal(b.direction);
    }

    set(origin: Vector3, direction: Vector3): Ray3 {
        this.origin.copy(origin);
        this.direction.copy(direction);
        return this;
    }
    copy(b: Ray3): Ray3 {
        this.origin.copy(b.origin);
        this.direction.copy(b.direction);
        return this;
    }
    clone(): Ray3 {
        return new Ray3(this.origin, this.direction);
    }

    public get_UncappedClosestParameterToPoint(p: Vector3) {
        const _p = Ray3.#tmp_vector3_0.sub(p, this.origin);
        const n = this.direction;
        const l2 = n.squared_length;
        if (l2 < Epsilon) {
            return 0; // Both points are the same, just give any.
        }
        const d = n.dot(_p) / l2;
        return d;
    }

    public get_UncappedClosestParametersWithUncappedRay(l: Ray3, target_0: Out<number>, target_1: Out<number>) {
        const r1 = this.origin;
        const r2 = l.origin;
        const e1 = this.direction;
        const e2 = l.direction;

        const n = Ray3.#tmp_vector3_0.cross(e1, e2);

        if (n.length < Epsilon) {
            target_0.value = 0;
            target_1.value = l.get_UncappedClosestParameterToPoint(r1);
            return;
        }

        const n_length_sq = n.squared_length;
        const r = Ray3.#tmp_vector3_1.sub(r2, r1);

        const t1 = Ray3.#tmp_vector3_2.cross(e2, n).dot(r) / (n_length_sq);
        const t2 = Ray3.#tmp_vector3_2.cross(e1, n).dot(r) / (n_length_sq);

        target_0.value = t1;
        target_1.value = t2;
    }
}