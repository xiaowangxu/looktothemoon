import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Vector3 } from "../linear_algebra/Vector3";
import type { SphereLike } from "./SphereLike";

export class Sphere3 implements SphereLike<Vector3, Matrix3> {
    public readonly center: Vector3;
    public readonly radius: number;

    constructor(center: Vector3, radius: number) {
        this.center = center;
        this.radius = radius;
    }
}

export function sphere3(center: Vector3, radius: number) {
    return new Sphere3(center, radius);
}