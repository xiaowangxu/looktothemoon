import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";

export interface RaycastResult {
    position: Vector3;
    normal: Vector3;
}

export class PhysicsWorld3D {
    public dispose() {
    }
}