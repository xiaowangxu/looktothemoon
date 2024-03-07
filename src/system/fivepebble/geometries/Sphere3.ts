import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { SphereLike } from "./SphereLike";
import { Vector3 } from "../linear_algebra/Vector3";

export class Sphere3 implements SphereLike<Vector3, Matrix3> {

    //#region init

    static get new() { return new Sphere3(Sphere3.#const_vector3_zero, 0); }
    static create(center: Vector3, radius: number) { return new Sphere3(center, radius); }

    //#endregion

    static readonly #const_vector3_zero = new Vector3(0, 0, 0);

    public readonly center: Vector3;
    public radius: number;

    constructor(center: Vector3, radius: number) {
        this.center = center.clone();
        this.radius = radius;
    }

    // #region Geometry Bounded

    signed_distance_to_Point(point: Vector3): number {
        return point.distance_to(this.center) - this.radius;
    }

    distance_to_Point(point: Vector3): number {
        return Math.abs(this.signed_distance_to_Point(point));
    }

    project_Point(point: Vector3, target: Vector3): Vector3 {
        const normal = target.direction_to(this.center, point);
        if (normal.squared_length === 0) return target.add_Scaled(this.center, this.radius, new Vector3(1, 0, 0));
        return target.add_Scaled(this.center, this.radius, normal);
    }

    // #endregion

    equal(b: Sphere3): boolean {
        return this.radius === b.radius && this.center.equal(b.center);
    }

    set(center: Vector3, radius: number): Sphere3 {
        this.center.copy(center);
        this.radius = radius;
        return this;
    }
    copy(b: Sphere3): Sphere3 {
        this.center.copy(b.center);
        this.radius = b.radius;
        return this;
    }
    clone(): Sphere3 {
        return new Sphere3(this.center, this.radius);
    }
}