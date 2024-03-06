import type { Out } from "@/system/utils/Type";
import { Epsilon, clamp } from "../Scalar";
import type { Matrix3 } from "../linear_algebra/Matrix3";
import { Vector3 } from "../linear_algebra/Vector3";
import type { LineLike } from "./LineLike";
import type { BvhShape } from "../bvh/BvhLike";
import { Box3 } from "./Box3";

export class Line3 implements LineLike<Vector3, Matrix3>, BvhShape<Vector3, Matrix3> {

    //#region init

    static get new() { return new Line3(Line3.#const_vector3_zero, Line3.#const_vector3_zero); }
    static create(start: Vector3, end: Vector3) { return new Line3(start, end); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);
    static readonly #tmp_vector3_0 = new Vector3();
    static readonly #tmp_vector3_1 = new Vector3();
    static readonly #tmp_vector3_2 = new Vector3();

    public readonly start: Vector3;
    public readonly end: Vector3;

    get length() { return this.start.distance_to(this.end); }

    get direction() { return Vector3.new.direction_to(this.start, this.end); }
    get_Direction(target: Vector3): Vector3 { return target.direction_to(this.start, this.end); }

    get_Point(p: number, target: Vector3): Vector3 {
        target.sub(this.end, this.start);
        return target.add_Scaled(this.start, clamp(p, 0, 1), target);
    }

    constructor(start: Vector3, end: Vector3) {
        this.start = start.clone();
        this.end = end.clone();
    }

    equal(b: Line3): boolean {
        return this.start.equal(b.start) && this.end.equal(b.end);
    }

    set(start: Vector3, end: Vector3): Line3 {
        this.start.copy(start);
        this.end.copy(end);
        return this;
    }
    copy(b: Line3): Line3 {
        this.start.copy(b.start);
        this.end.copy(b.end);
        return this;
    }
    clone(): Line3 {
        return new Line3(this.start, this.end);
    }

    
    //#region Bvh

    get aabb(): Box3 {
        return new Box3(
            new Vector3(
                Math.min(this.start.x, this.end.x),
                Math.min(this.start.y, this.end.y),
                Math.min(this.start.z, this.end.z),
            ),
            new Vector3(
                Math.max(this.start.x, this.end.x),
                Math.max(this.start.y, this.end.y),
                Math.max(this.start.z, this.end.z),
            ),
        );
    }
    get_AABB(target: Box3): Box3 {
        target.min.set(
            Math.min(this.start.x, this.end.x),
            Math.min(this.start.y, this.end.y),
            Math.min(this.start.z, this.end.z),
        );
        target.max.set(
            Math.max(this.start.x, this.end.x),
            Math.max(this.start.y, this.end.y),
            Math.max(this.start.z, this.end.z),
        );
        return target;
    }

    //#endregion

    public get_ClosestParameterToPoint(p: Vector3) {
        const ab = Line3.#tmp_vector3_0.sub(this.end, this.start);
        const ac = Line3.#tmp_vector3_1.sub(p, this.start);
        // Project c onto ab
        // paramaterized position d(t) = a + t * (b - a)
        const t = ac.dot(ab) / ab.squared_length;
        return clamp(t, 0, 1);
    }

    public get_ClosestParametersWithLine(line: Line3, target_0: Out<number>, target_1: Out<number>) {
        // Based on David Eberly's Computation of Distance Between Line Segments algorithm.
        const p_p0 = this.start, p_p1 = this.end;
        const p_q0 = line.start, p_q1 = line.end;

        const p = Line3.#tmp_vector3_0.sub(p_p1, p_p0);
        const q = Line3.#tmp_vector3_1.sub(p_q1, p_q0);
        const r = Line3.#tmp_vector3_2.sub(p_p0, p_q0);

        const a = p.dot(p);
        const b = p.dot(q);
        const c = q.dot(q);
        const d = p.dot(r);
        const e = q.dot(r);

        let s = 0.0;
        let t = 0.0;

        const det = a * c - b * b;
        if (det > Epsilon) {
            // Non-parallel segments
            const bte = b * e;
            const ctd = c * d;

            if (bte <= ctd) {
                // s <= 0.0
                if (e <= 0.0) {
                    // t <= 0.0
                    s = (-d >= a ? 1 : (-d > 0.0 ? -d / a : 0.0));
                    t = 0.0;
                }
                else if (e < c) {
                    // 0.0 < t < 1
                    s = 0.0;
                    t = e / c;
                }
                else {
                    // t >= 1
                    s = (b - d >= a ? 1 : (b - d > 0.0 ? (b - d) / a : 0.0));
                    t = 1;
                }
            }
            else {
                // s > 0.0
                s = bte - ctd;
                if (s >= det) {
                    // s >= 1
                    if (b + e <= 0.0) {
                        // t <= 0.0
                        s = (-d <= 0.0 ? 0.0 : (-d < a ? -d / a : 1));
                        t = 0.0;
                    }
                    else if (b + e < c) {
                        // 0.0 < t < 1
                        s = 1;
                        t = (b + e) / c;
                    }
                    else {
                        // t >= 1
                        s = (b - d <= 0.0 ? 0.0 : (b - d < a ? (b - d) / a : 1));
                        t = 1;
                    }
                }
                else {
                    // 0.0 < s < 1
                    const ate = a * e;
                    const btd = b * d;

                    if (ate <= btd) {
                        // t <= 0.0
                        s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                        t = 0.0;
                    }
                    else {
                        // t > 0.0
                        t = ate - btd;
                        if (t >= det) {
                            // t >= 1
                            s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                            t = 1;
                        }
                        else {
                            // 0.0 < t < 1
                            s /= det;
                            t /= det;
                        }
                    }
                }
            }
        }
        else {
            // Parallel segments
            if (e <= 0.0) {
                s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                t = 0.0;
            }
            else if (e >= c) {
                s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                t = 1;
            }
            else {
                s = 0.0;
                t = e / c;
            }
        }

        target_0.value = s;
        target_1.value = t;
    }
}