import type { Matrix3 } from "../linear_algebra/Matrix3";
import type { SphereLike } from "./SphereLike";
import { Vector3 } from "../linear_algebra/Vector3";
import { GeometryContainType } from "./GeometryLike";
import { Box3 } from "./Box3";

export class Sphere3 implements SphereLike<Vector3, Matrix3> {
    public readonly center: Vector3;
    public readonly radius: number;

    constructor(center: Vector3, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    // #region BvhShape

    get bbox(): Box3 {
        return new Box3(this.center.sub_Number(this.radius), this.center.add_Number(this.radius));
    }

    // #endregion BvhShape

    // #region Geometry Bounded

    signed_distance_to_Point(point: Vector3): number {
        return point.distance_to(this.center) - this.radius;
    }

    distance_to_Point(point: Vector3): number {
        return Math.abs(this.signed_distance_to_Point(point));
    }

    project_Point(point: Vector3): Vector3 {
        const normal = this.center.direction_to(point);
        if (normal.squared_length === 0) return this.center.add_Scaled(this.radius, new Vector3(1, 0, 0));
        return this.center.add_Scaled(this.radius, normal);
    }

    // #endregion

    // #region Geometry Contain Point

    contain_Point(point: Vector3, type: GeometryContainType): boolean {
        const sqr_distance = point.squared_distance_to(this.center);
        const sqr_radius = this.radius * this.radius;
        if ((type & GeometryContainType.Inside) && sqr_distance < sqr_radius) return true;
        if ((type & GeometryContainType.Touching) && sqr_distance === sqr_radius) return true;
        if ((type & GeometryContainType.Outside) && sqr_distance > sqr_radius) return true;
        return false;
    }

    // #endregion
}

export function sphere3(center: Vector3, radius: number) {
    return new Sphere3(center, radius);
}