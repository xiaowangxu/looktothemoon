import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { RenderServerGeometry } from "./RenderServerGeometry";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Box3 } from "@/system/fivepebble/geometries/Box3";

export class RenderServerGeometry3D extends RenderServerGeometry<Vector3, Matrix3, Box3> {
    protected _bbox: Box3 = Box3.new;
}