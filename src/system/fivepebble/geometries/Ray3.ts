import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { Matrix4 } from "../linear_algebra/Matrix4";
import type { Vector3 } from "../linear_algebra/Vector3";
import type { RayLike } from "./RayLike";
import { Line3 } from "./Line3";

export class Ray3 implements RayLike<Vector3, Matrix3> {
    public readonly origin: Vector3;
    public readonly direction: Vector3;

    constructor(origin: Vector3, direction: Vector3) {
        this.origin = origin;
        this.direction = direction;
    }

    public get_Point(distance: number): Vector3 {
        return this.origin.add_Scaled(distance, this.direction);
    }

    public get_Line(start: number, end: number): Line3 {
        return new Line3(this.get_Point(start), this.get_Point(end));
    }

    public apply_Matrix4(mat: Matrix4, non_uniform_scale: boolean = false) {
        return new Ray3(
            this.origin.apply_Matrix4(mat),
            non_uniform_scale ?
                this.direction.transform(mat.basis).normalize() :
                this.direction.transform(mat.basis.inverse().transpose()).normalize()
        );
    }
}

export function ray3(origin: Vector3, direction: Vector3) {
    return new Ray3(origin, direction);
}