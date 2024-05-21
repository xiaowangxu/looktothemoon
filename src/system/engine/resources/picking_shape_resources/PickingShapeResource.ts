import { Resource } from "../Resource";
import type { Viewport } from "../../nodes/Node";
import { RaycastSide, type RaycastResult } from "@/system/fivepebble/geometries/GeometryLike";
import { type PickingShape3D } from "../../worlds/world3ds/PickingWorld3D";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";

export type RaycastResult3 = RaycastResult<Vector3, Matrix3>;

export abstract class PickingShape3DResource extends Resource implements PickingShape3D {
    public static readonly class_name: string = "PickingShape3DResource";

    public readonly preserve_global_transform: boolean = false;

    abstract perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined;
}