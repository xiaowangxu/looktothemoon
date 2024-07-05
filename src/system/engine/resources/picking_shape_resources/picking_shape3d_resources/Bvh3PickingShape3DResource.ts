import type { Viewport } from "../../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import type { Triangle3 } from "@/system/fivepebble/geometries/Triangle3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShape3DResource";
import type { AABB, BvhLike, BvhShapes } from "@/system/fivepebble/bvh/BvhLike";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { BaseBvh3, BvhExtractBuild, BvhExtractShape } from "@/system/fivepebble/bvh/Bvh3";

export abstract class Bvh3PickingShape3DResource<Bvh extends BaseBvh3> extends PickingShape3DResource {

    static #tmp_line3_0 = Line3.new;
    static #tmp_box3_0 = Box3.new;
    static #tmp_vector3_0 = Vector3.new;
    static #tmp_vector3_1 = Vector3.new;
    static #tmp_vector2_0 = Vector2.new;

    public readonly preserve_global_transform: boolean = false;

    protected abstract bvh: BaseBvh3<BvhExtractShape<Bvh>, BvhExtractBuild<Bvh>>;

    private bvh_traverse = (aabb: AABB<Vector3, Matrix3>) => {
        const box = Bvh3PickingShape3DResource.#tmp_box3_0;
        box.set(aabb.min, aabb.max);
        return box.touch_Line(Bvh3PickingShape3DResource.#tmp_line3_0);
    };

    protected abstract interset_Line(shape: BvhExtractBuild<Bvh>, line: Line3, position: Vector3, normal: Vector3, uv: Vector2): boolean;

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (this.bvh.is_empty) return undefined;

        const line = Bvh3PickingShape3DResource.#tmp_line3_0.set(from, to);
        const shapes = this.bvh.traverse(this.bvh_traverse);
        if (shapes.length === 0) return undefined;

        const position = Bvh3PickingShape3DResource.#tmp_vector3_0;
        const normal = Bvh3PickingShape3DResource.#tmp_vector3_1;
        const uv = Bvh3PickingShape3DResource.#tmp_vector2_0;
        let min_distance = Infinity;
        const min_res: RaycastResult3 = {
            position: Vector3.new,
            normal: Vector3.new,
            uv: Vector2.new,
        };
        let has_result = false;
        for (const shape of shapes) {
            const intersect = this.interset_Line(shape, line, position, normal, uv);
            if (!intersect) continue;
            const distance = from.distance_to(Bvh3PickingShape3DResource.#tmp_vector3_0);
            if (distance < min_distance) {
                min_distance = distance;
                has_result = true;
                min_res.position.copy(position);
                min_res.normal.copy(normal);
                min_res.uv!.copy(uv);
            }
        }

        if (!has_result) return undefined;
        if (side === RaycastSide.Double) return min_res;

        const dot = line.direction.dot(min_res.normal);

        if (side === RaycastSide.Front && dot <= 0) return min_res;
        if (side === RaycastSide.Back && dot >= 0) return min_res;

        return undefined;
    }
}
