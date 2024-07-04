import type { Viewport } from "../../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import { Epsilon, lerp } from '../../../../fivepebble/Scalar';
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import { out } from "@/system/utils/Type";
import { Bvh3, Bvh3Strategy } from "@/system/fivepebble/bvh/Bvh3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShape3DResource";

export class PolyLinePickingShape3DResource extends PickingShape3DResource {

    public static readonly class_name: string = "PolyLinePickingShape3DResource";

    static #tmp_out_number_0 = out<number>();
    static #tmp_out_number_1 = out<number>();
    static #tmp_line3_0 = Line3.new;
    static #tmp_line3_1 = Line3.new;
    static #tmp_box3_0 = Box3.new;
    static #tmp_vector2_0 = Vector2.new;
    static #tmp_vector2_1 = Vector2.new;
    static #tmp_vector3_0 = Vector3.new;
    static #tmp_vector3_1 = Vector3.new;
    static #tmp_vector3_2 = Vector3.new;
    static #tmp_vector3_3 = Vector3.new;
    static #tmp_vector4_0 = Vector4.new;
    static #tmp_vector4_1 = Vector4.new;
    static #tmp_matrix4_0 = Matrix4.new;
    static #tmp_matrix4_1 = Matrix4.new;

    public readonly preserve_global_transform: boolean = true;

    private _line_width: number = 10;
    public get line_width() { return this._line_width; }
    public set line_width(line_width: number) {
        if (this._line_width !== line_width) {
            this._line_width = line_width;
            this.trigger_Changed();
        }
    }

    public distance_first: boolean = true;

    private _points: Vector3[] = [];
    public get points() { return this._points; }
    public set points(points: Vector3[]) {
        this._points = points;
        this.update_Bvh();
        this.trigger_Changed();
    }

    public readonly bvh = Bvh3.new;

    private update_Bvh() {
        const lines: Line3[] = [];
        for (let i = 1; i < this._points.length; i++) {
            const line = Line3.create(this._points[i - 1], this._points[i]);
            lines.push(line);
        }
        this.bvh.build(lines, 5, Bvh3Strategy.Average);
    }

    private get_WorldSpaceHalfWidth(camera: Camera3, distance: number, size: number, resolution: Vector2) {
        const clip_to_world = PolyLinePickingShape3DResource.#tmp_vector4_0.set(0, 0, -distance, 1);
        const projection = camera.get_Projection(PolyLinePickingShape3DResource.#tmp_matrix4_0);
        clip_to_world.transform(clip_to_world, projection);
        clip_to_world.mult_Number(clip_to_world, 1 / clip_to_world.w);
        clip_to_world.x = size / resolution.x;
        clip_to_world.y = size / resolution.y;
        clip_to_world.transform(clip_to_world, projection.inverse(projection));
        clip_to_world.mult_Number(clip_to_world, 1 / clip_to_world.w);
        return Math.abs(Math.max(clip_to_world.x, clip_to_world.y));
    }

    private raycast_LinesScreenSpace(line: Line3, to: Line3[], global_transform: Matrix4, camera: Camera3, resolution: Vector2): RaycastResult3 | undefined {
        const projection = camera.get_Projection(PolyLinePickingShape3DResource.#tmp_matrix4_0);
        const camera_view = camera.get_GlobalTransform(PolyLinePickingShape3DResource.#tmp_matrix4_1);
        camera_view.inverse(camera_view);
        const near = 0;

        const picking_point_screen = camera.project_Point(line.start, PolyLinePickingShape3DResource.#tmp_vector2_1);
        const picking_point_world = PolyLinePickingShape3DResource.#tmp_vector3_0.set(picking_point_screen.x * resolution.x / 2, picking_point_screen.y * resolution.y / 2, 0);

        let min_width = Infinity;
        let min_distance = Infinity;
        let min_point: RaycastResult3 | undefined = undefined;

        const start = PolyLinePickingShape3DResource.#tmp_vector3_1;
        const end = PolyLinePickingShape3DResource.#tmp_vector3_2;
        const start4 = PolyLinePickingShape3DResource.#tmp_vector4_0;
        const end4 = PolyLinePickingShape3DResource.#tmp_vector4_1;
        const _line = PolyLinePickingShape3DResource.#tmp_line3_0;
        const closest_point = PolyLinePickingShape3DResource.#tmp_vector3_3;
        const p0 = PolyLinePickingShape3DResource.#tmp_out_number_0;
        const p1 = PolyLinePickingShape3DResource.#tmp_out_number_1;

        for (const _l of to) {
            start.affine_transform(_l.start, global_transform);
            end.affine_transform(_l.end, global_transform);
            start4.set(start.x, start.y, start.z, 1);
            end4.set(end.x, end.y, end.z, 1);
            // camera space
            start4.transform(start4, camera_view);
            end4.transform(end4, camera_view);
            // skip the segment if it's entirely behind the camera
            if (start4.z > near && end4.z > near) continue;
            // trim the segment if it extends behind camera near
            if (start4.z > near) {
                const deltaDist = start4.z - end4.z;
                const t = start4.z / deltaDist;
                start4.lerp(start4, end4, t);

            }
            else if (end4.z > near) {
                const delta = end4.z - start4.z;
                const t = end4.z / delta;
                end4.lerp(end4, start4, t);
            }
            // clip space
            start4.transform(start4, projection);
            end4.transform(end4, projection);
            // ndc space [ - 1.0, 1.0 ]
            start4.mult_Number(start4, 1 / start4.w);
            end4.mult_Number(end4, 1 / end4.w);
            // screen space
            start4.x *= resolution.x / 2;
            start4.y *= resolution.y / 2;
            end4.x *= resolution.x / 2;
            end4.y *= resolution.y / 2;
            // create 2d segment
            _line.start.set(start4.x, start4.y, 0);
            _line.end.set(end4.x, end4.y, 0);
            if (_line.length < Epsilon) continue;
            // get closest point on ray to segment
            const param = _line.get_ClosestParameterToPoint(picking_point_world);
            _line.get_Point(param, closest_point);
            // check if the intersection point is within clip space
            const z_pos = lerp(start4.z, end4.z, param);
            const is_in_clip_space = z_pos >= -1 && z_pos <= 1;
            const width = picking_point_world.distance_to(closest_point);
            const inside = width < this.line_width * 0.5;
            if (is_in_clip_space && inside) {
                const l = _line.set(start, end);
                line.get_ClosestParametersWithLine(l, p0, p1);
                const point_on_line = l.get_Point(p1.value, closest_point);
                const distance = line.start.distance_to(point_on_line);
                if (this.distance_first) {
                    if (distance > min_distance + Epsilon) continue;
                }
                else if (width > min_width + Epsilon) continue;
                min_width = width;
                min_distance = distance;
                if (min_point === undefined) {
                    min_point = {
                        position: point_on_line.clone(),
                        normal: l.get_Direction(Vector3.new),
                    };
                }
                else {
                    min_point.position.copy(point_on_line);
                    l.get_Direction(min_point.normal);
                }
            }
        }

        return min_point;
    }

    private amount: number = 0;
    private bvh_traverse = (aabb: Box3) => {
        const box = PolyLinePickingShape3DResource.#tmp_box3_0.enlarge(aabb, this.amount);
        return box.touch_Line(PolyLinePickingShape3DResource.#tmp_line3_0);
    };

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (camera === undefined || viewport === undefined || this.points.length <= 0 || this.bvh.root === undefined) return undefined;

        const global_inverse = PolyLinePickingShape3DResource.#tmp_matrix4_0.inverse(global_transform);
        PolyLinePickingShape3DResource.#tmp_line3_0.set(PolyLinePickingShape3DResource.#tmp_vector3_0.affine_transform(from, global_inverse), PolyLinePickingShape3DResource.#tmp_vector3_1.affine_transform(to, global_inverse));
        const line_global = PolyLinePickingShape3DResource.#tmp_line3_1.set(from, to);
        const camera_position = camera.get_GlobalTransform(PolyLinePickingShape3DResource.#tmp_matrix4_0).get_Position(PolyLinePickingShape3DResource.#tmp_vector3_0);
        const resolution = viewport.get_Size(PolyLinePickingShape3DResource.#tmp_vector2_0);
        const root_aabb = this.bvh.root.aabb;
        const distance = root_aabb.get_FarestDistanceToPoint(camera_position);
        this.amount = this.get_WorldSpaceHalfWidth(camera, distance, this._line_width, resolution);

        const shapes = this.bvh.traverse(this.bvh_traverse) as Line3[];
        if (shapes.length === 0) return undefined;
        return this.raycast_LinesScreenSpace(line_global, shapes, global_transform, camera, resolution);
    }

    protected dispose(): void { }
}
