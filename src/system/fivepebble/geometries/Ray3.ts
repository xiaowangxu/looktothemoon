import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import { Vector3 } from "../linear_algebra/Vector3";
import type { RayLike } from "./RayLike";
import { Line3 } from "./Line3";
import { Epsilon } from "../Scalar";
import type { LineLike } from "./LineLike";

export class Ray3 implements RayLike<Vector3, Matrix3> {

    //#region init

    static get new() { return new Ray3(new Vector3(), new Vector3(1, 0, 0)); }
    static create(origin: Vector3, direction: Vector3) {
        return new Ray3(origin, direction);
    }

    //#endregion

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_vector3_2 = Vector3.new;

    public readonly origin: Vector3;
    public readonly direction: Vector3;

    constructor(origin: Vector3, direction: Vector3) {
        this.origin = origin.clone();
        this.direction = direction.clone();
    }

    get_Point(distance: number): Vector3 {
        return Vector3.new.add_Scaled(this.origin, distance, this.direction);
    }
    gets_Point(distance: number, target: Vector3): Vector3 {
        return target.add_Scaled(this.origin, distance, this.direction);
    }

    get_Line(start: number, end: number): Line3 {
        return new Line3(this.get_Point(start), this.get_Point(end));
    }
    gets_Line(start: number, end: number, target: LineLike<Vector3, Matrix3>): LineLike<Vector3, Matrix3> {
        this.gets_Point(start, target.start);
        this.gets_Point(end, target.end);
        return target;
    }

    public apply_Matrix4(mat: Matrix4, non_uniform_scale: boolean = false) {
        return new Ray3(
            Vector3.new.apply_Matrix4(this.origin, mat),
            non_uniform_scale ?
                Vector3.new.normalize(Ray3.#tmp_vector3_0.transform(this.direction, mat.basis)) :
                Vector3.new.normalize(Ray3.#tmp_vector3_0.transform(this.direction, mat.basis.inverse().transpose()))
        );
    }

    public get_ClosestPointUncapped(p: Vector3): Vector3 {
        const _p = Vector3.new.sub(p, this.origin);
        const n = this.direction;
        const l2 = n.squared_length;
        if (l2 < Epsilon) {
            return this.origin.clone(); // Both points are the same, just give any.
        }
        const d = n.dot(_p) / l2;
        return Vector3.new.add_Scaled(this.origin, d, n); // Inside.
    }

    public get_ClosestPointsUncapped(l1: Ray3): [p0: Vector3, p1: Vector3] {
        const r1 = this.origin.clone();
        const r2 = l1.origin.clone();
        const e1 = this.direction.clone();
        const e2 = l1.direction.clone();

        const n = Ray3.#tmp_vector3_0.cross(e1, e2);

        if (n.length < Epsilon) {
            return [r1, l1.get_ClosestPointUncapped(r1)];
        }

        const n_length_sq = n.squared_length;
        const r = Ray3.#tmp_vector3_1.sub(r2, r1);

        const t1 = Ray3.#tmp_vector3_2.cross(e2, n).dot(r) / (n_length_sq);
        const t2 = Ray3.#tmp_vector3_2.cross(e1, n).dot(r) / (n_length_sq);

        return [Vector3.new.add_Scaled(r1, t1, e1), Vector3.new.add_Scaled(r2, t2, e2)];
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
        return new Ray3(this.origin.clone(), this.direction.clone());
    }
}

export function ray3(origin: Vector3, direction: Vector3) {
    return new Ray3(origin, direction);
}