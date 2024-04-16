import type { Viewport } from "../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import { Epsilon } from '../../../fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShapeResource";


export class PickingCylinderResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingCylinderResource";

    static readonly #tmp_line3_0 = Line3.new;
    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_vector3_2 = Vector3.new;
    static readonly #tmp_vector3_3 = Vector3.new;
    static readonly #tmp_vector2_0 = Vector2.new;
    static readonly #tmp_vector2_1 = Vector2.new;

    public readonly preserve_global_transform: boolean = false;

    protected readonly bbox: Box3 = Box3.new;

    private _radius: number = 0.5;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_BBox();
            this.trigger_Changed();
        }
    }

    private _height: number = 1;
    public get height() { return this._height; }
    public set height(height: number) {
        if (this._height !== height) {
            this._height = height;
            this.update_BBox();
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        const line = PickingCylinderResource.#tmp_line3_0.set(from, to);
        if (!this.bbox.touch_Line(line)) return undefined;

        const rel = PickingCylinderResource.#tmp_vector3_0.sub(to, from);
        const rel_l = rel.length;
        if (rel_l < Epsilon) return undefined;

        const cylinder_axis = PickingCylinderResource.#tmp_vector3_1.set(0, 1, 0);

        // First check if they are parallel.
        const normal = PickingCylinderResource.#tmp_vector3_2.div_Number(rel, rel_l);
        const crs = normal.cross(normal, cylinder_axis);
        const crs_l = crs.length;

        const axis_dir = PickingCylinderResource.#tmp_vector3_3;
        if (crs_l < Epsilon) {
            axis_dir.set(0, 0, 1); // Any side axis OK.
        }
        else {
            axis_dir.div_Number(crs, crs_l);
        }

        const dist = axis_dir.dot(from);

        if (dist >= this.radius) {
            return undefined; // Too far away.
        }

        // Convert to 2D.
        const w2 = this.radius * this.radius - dist * dist;
        if (w2 < Epsilon) {
            return undefined; // Avoid numerical error.
        }

        const size_x = Math.sqrt(w2), size_y = this.height / 2;

        const side_dir = Vector3.new.normalize(Vector3.new.cross(axis_dir, cylinder_axis));

        const from_2d = PickingCylinderResource.#tmp_vector2_0.set(side_dir.dot(from), from.y);
        const to_2d = PickingCylinderResource.#tmp_vector2_1.set(side_dir.dot(to), to.y);

        let min = 0, max = 1;
        let axis = -1;

        for (let i = 0; i < 2; i++) {
            const seg_from = i === 0 ? from_2d.x : from_2d.y;
            const seg_to = i === 0 ? to_2d.x : to_2d.y;
            const box_begin = -(i === 0 ? size_x : size_y);
            const box_end = -box_begin;
            let cmin, cmax;

            if (seg_from < seg_to) {
                if (seg_from > box_end || seg_to < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from < box_begin) ? ((box_begin - seg_from) / length) : 0;
                cmax = (seg_to > box_end) ? ((box_end - seg_from) / length) : 1;

            }
            else {
                if (seg_to > box_end || seg_from < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from > box_end) ? (box_end - seg_from) / length : 0;
                cmax = (seg_to < box_begin) ? (box_begin - seg_from) / length : 1;
            }

            if (cmin > min) {
                min = cmin;
                axis = i;
            }
            if (cmax < max) {
                max = cmax;
            }
            if (max < min) {
                return undefined;
            }
        }

        // Convert to 3D again.
        const result = Vector3.new.add_Scaled(from, min, rel);
        const res_normal = result.clone();

        if (axis == 0) {
            res_normal.y = 0;
        } else {
            res_normal.x = 0;
            res_normal.z = 0;
        }

        res_normal.normalize(res_normal);

        return { position: result, normal: res_normal };
    }

    protected update_BBox() {
        const half_height = this._height / 2;
        const radius = this._radius;
        this.bbox.min.set(-radius, -half_height, -radius);
        this.bbox.max.set(radius, half_height, radius);
    }

    protected dispose(): void { }

    // save / load
    public dump(writer: ClassWriter): void {
        writer.property('radius', this.radius);
        writer.property('height', this.height);
    }

    public load(reader: ClassReader): void {
        this.radius = reader.get<number>('radius') ?? 0.5;
        this.height = reader.get<number>('height') ?? 1;
    }
}
