import type { Viewport } from "../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import { Bvh3 } from "@/system/fivepebble/bvh/Bvh3";
import type { Triangle3 } from "@/system/fivepebble/geometries/Triangle3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShapeResource";

export class PickingBvh3Resource extends PickingShape3DResource {

    static #tmp_line3_0 = Line3.new;
    static #tmp_vector3_0 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    public readonly bvh: Bvh3 = Bvh3.new;

    private bvh_traverse = (aabb: Box3) => {
        return aabb.touch_Line(PickingBvh3Resource.#tmp_line3_0);
    };

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        PickingBvh3Resource.#tmp_line3_0.set(from, to);
        const shapes = this.bvh.traverse(this.bvh_traverse) as Triangle3[];
        if (shapes.length === 0) return undefined;
        let min_distance = Infinity;
        const min_res: RaycastResult3 = {
            position: Vector3.new,
            normal: Vector3.new,
        };
        let has_result = false;
        for (const shape of shapes) {
            const pos = shape.intersect_Line(PickingBvh3Resource.#tmp_line3_0, PickingBvh3Resource.#tmp_vector3_0);
            if (pos === undefined) continue;
            const distance = from.distance_to(pos);
            if (distance < min_distance) {
                min_distance = distance;
                has_result = true;
                min_res.position.copy(pos);
                shape.get_Normal(min_res.normal);
            }
        }
        return has_result ? min_res : undefined;
    }

    protected dispose(): void { }
}
