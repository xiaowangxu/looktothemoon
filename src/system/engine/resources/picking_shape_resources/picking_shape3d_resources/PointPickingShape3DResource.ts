import type { Viewport } from "../../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShape3DResource";

export class PointPickingShape3DResource extends PickingShape3DResource {
    
    public static readonly class_name: string = "PointPickingShape3DResource";

    static #tmp_frustum3_0 = Frustum3.new;
    static #tmp_vector3_0 = Vector3.new;
    static #tmp_vector2_0 = Vector2.new;
    static #tmp_vector2_1 = Vector2.new;
    static #tmp_vector2_2 = Vector2.new;
    static #tmp_vector2_3 = Vector2.new;

    public readonly preserve_global_transform: boolean = true;

    private _radius: number = 10;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (viewport === undefined || camera === undefined) return undefined;
        const frustum = camera.get_Frustum(PointPickingShape3DResource.#tmp_frustum3_0);
        const point = global_transform.get_Position(PointPickingShape3DResource.#tmp_vector3_0);
        if (!frustum.contain_Point(point)) return undefined;
        const SCREEN_SIZE = viewport.get_Size(PointPickingShape3DResource.#tmp_vector2_0);
        const screen_point = camera.project_Point(point, PointPickingShape3DResource.#tmp_vector2_1);
        const screen_point_normalized = PointPickingShape3DResource.#tmp_vector2_3.copy(screen_point);
        screen_point.mult(screen_point, SCREEN_SIZE);
        screen_point.div_Number(screen_point, 2);
        const screen_mouse = camera.project_Point(from, PointPickingShape3DResource.#tmp_vector2_2);
        screen_mouse.mult(screen_mouse, SCREEN_SIZE);
        screen_mouse.div_Number(screen_mouse, 2);
        const distance = screen_point.distance_to(screen_mouse);
        if (distance > this._radius) return undefined;
        const position = point.clone();
        const normal = camera.unproject_Normal(screen_point_normalized, Vector3.new);
        normal.negate(normal);
        return {
            position,
            normal,
        };
    }

    protected dispose(): void { }

    // save / load
    
    public dump(writer: ClassWriter): void {
        writer.property('radius', this.radius);
    }

    public load(reader: ClassReader): void {
        this.radius = reader.get<number>('radius') ?? 10;
    }
}
