import { Resource } from "../Resource";
import type { Viewport } from "../../nodes/Node";
import { RaycastSide, type RaycastResult } from "@/system/fivepebble/geometries/GeometryLike";
import { type PickingShape3D } from "../../worlds/world3ds/PickingWorld3D";
import { Epsilon, lerp } from '../../../fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Box3 } from "@/system/fivepebble/geometries/Box3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { Line3 } from "@/system/fivepebble/geometries/Line3";
import { out } from "@/system/utils/Type";
import { Frustum3 } from "@/system/fivepebble/graphics/Frustum3";
import { Bvh3, Bvh3Strategy } from "@/system/fivepebble/bvh/Bvh3";
import type { Triangle3 } from "@/system/fivepebble/geometries/Triangle3";

type RaycastResult3 = RaycastResult<Vector3, Matrix3>;

export abstract class PickingShape3DResource extends Resource implements PickingShape3D {
    public static readonly class_name: string = "PickingShape3DResource";

    public readonly preserve_global_transform: boolean = false;

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        throw new Error("abstract method");
    }
}

export class PickingBoxResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingBoxResource";

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    private _width: number = 1;
    public get width() { return this._width; }
    public set width(width: number) {
        if (this._width !== width) {
            this._width = width;
            this.trigger_Changed();
        }
    }

    private _height: number = 1;
    public get height() { return this._height; }
    public set height(height: number) {
        if (this._height !== height) {
            this._height = height;
            this.trigger_Changed();
        }
    }

    private _depth: number = 1;
    public get depth() { return this._depth; }
    public set depth(depth: number) {
        if (this._depth !== depth) {
            this._depth = depth;
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        let min = 0, max = 1;
        let axis = 0;
        let sign = 0;

        const position_start = PickingBoxResource.#tmp_vector3_0.set(-this.width / 2, -this.height / 2, -this.depth / 2);
        const position_end = PickingBoxResource.#tmp_vector3_1.set(this.width / 2, this.height / 2, this.depth / 2);

        for (let i = 0; i < 3; i++) {
            const seg_from = i === 0 ? from.x : (i === 1 ? from.y : from.z);
            const seg_to = i === 0 ? to.x : (i === 1 ? to.y : to.z);
            const box_begin = i === 0 ? position_start.x : (i === 1 ? position_start.y : position_start.z);
            const box_end = i === 0 ? position_end.x : (i === 1 ? position_end.y : position_end.z);
            let cmin, cmax;
            let csign;

            if (seg_from < seg_to) {
                if (seg_from > box_end || seg_to < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from < box_begin) ? ((box_begin - seg_from) / length) : 0;
                cmax = (seg_to > box_end) ? ((box_end - seg_from) / length) : 1;
                csign = -1.0;

            }
            else {
                if (seg_to > box_end || seg_from < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from > box_end) ? (box_end - seg_from) / length : 0;
                cmax = (seg_to < box_begin) ? (box_begin - seg_from) / length : 1;
                csign = 1.0;
            }

            if (cmin > min) {
                min = cmin;
                axis = i;
                sign = csign;
            }
            if (cmax < max) {
                max = cmax;
            }
            if (max < min) {
                return undefined;
            }
        }

        const rel = PickingBoxResource.#tmp_vector3_0.sub(to, from);

        const result = Vector3.new.add_Scaled(from, min, rel);
        const normal = Vector3.new;
        switch (axis) {
            case 0: normal.x = sign; break;
            case 1: normal.y = sign; break;
            case 2: normal.z = sign; break;
        }

        return { position: result, normal: normal };
    }

    protected dispose(): void { }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('width', this.width);
        writer.property('height', this.height);
        writer.property('depth', this.depth);
    }

    public load(reader: ClassReader): void {
        this.width = reader.get<number>('width') ?? 1;
        this.height = reader.get<number>('height') ?? 1;
        this.depth = reader.get<number>('depth') ?? 1;
    }
}

export class PickingSphereResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingSphereResource";

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_vector3_2 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    private _radius: number = 0.5;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (this.radius < Epsilon) return undefined;

        const sphere_pos = PickingSphereResource.#tmp_vector3_0.negate(from);
        const rel = PickingSphereResource.#tmp_vector3_1.sub(to, from);
        const rel_l = rel.length;

        if (rel_l < Epsilon) {
            return undefined;
        }
        const normal = rel.div_Number(rel, rel_l);

        const sphere_d = sphere_pos.dot(normal);
        const ray_distance = sphere_pos.distance_to(PickingSphereResource.#tmp_vector3_2.mult_Number(normal, sphere_d));

        if (ray_distance >= this.radius) {
            return undefined;
        }

        const inters_d2 = this.radius * this.radius - ray_distance * ray_distance;
        let inters_d = sphere_d;

        if (inters_d2 >= Epsilon) {
            inters_d -= Math.sqrt(inters_d2);
        }

        // Check in segment.
        if (inters_d < 0 || inters_d > rel_l) {
            return undefined;
        }

        const result_position = Vector3.new.add_Scaled(from, inters_d, normal);
        const result_normal = Vector3.new.normalize(result_position);

        return { position: result_position, normal: result_normal };
    }

    protected dispose(): void { }

    // save / load

    public dump(writer: ClassWriter): void {
        writer.property('radius', this.radius);
    }

    public load(reader: ClassReader): void {
        this.radius = reader.get<number>('radius') ?? 0.5;
    }
}

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
            const box_begin = - (i === 0 ? size_x : size_y);
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

export class PickingPointResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingPointResource";

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
        const frustum = camera.get_Frustum(PickingPointResource.#tmp_frustum3_0);
        const point = global_transform.get_Position(PickingPointResource.#tmp_vector3_0);
        if (!frustum.contain_Point(point)) return undefined;
        const screen_size = viewport.get_Size(PickingPointResource.#tmp_vector2_0);
        const screen_point = camera.project_Point(point, PickingPointResource.#tmp_vector2_1);
        const screen_point_normalized = PickingPointResource.#tmp_vector2_3.copy(screen_point);
        screen_point.mult(screen_point, screen_size);
        screen_point.div_Number(screen_point, 2);
        const screen_mouse = camera.project_Point(from, PickingPointResource.#tmp_vector2_2);
        screen_mouse.mult(screen_mouse, screen_size);
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

// export class PickingRaycastableResource<T extends Raycastable<Vector3, Matrix3>> extends PickingShape3DResource {
//     public raycastable: T | undefined;

//     perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
//         if (this.raycastable === undefined) return undefined;
//         return this.raycastable.raycast(from, to, side);
//     }

//     protected dispose(): void { }
// }

// export class PickingBVHResource extends PickingShape3DResource {
//     public static readonly class_name: string = "PickingBVHResource";

//     public readonly preserve_global_transform: boolean = false;

//     private bvh: MeshBVH | undefined = undefined;

//     public compute_BVH(geometry: GeometryResource) {
//         this.bvh = new MeshBVH(geometry.get_BufferGeometry());
//     }

//     perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult | undefined {
//         if (this.bvh === undefined) return undefined;
//         const results = this.bvh.raycast(
//             new Ray(from, to.sub(from).normalize()),
//             side === RaycastSide.Front ? FrontSide : (side === RaycastSide.Back ? BackSide : DoubleSide)
//         );
//         if (results.length === 0) return undefined;
//         const min: RaycastResult = {
//             position: results[0].point,
//             normal: results[0].normal!,
//         }
//         let min_distance = results[0].distance;
//         for (let i = 1; i < results.length; i++) {
//             const { point, normal, distance } = results[i];
//             if (min_distance >= distance) {
//                 min_distance = distance;
//                 min.position = point;
//                 min.normal = normal!;
//             }
//         }
//         return min;
//     }

//     protected dispose(): void { }

// }

export class PickingBvh3Resource extends PickingShape3DResource {

    static #tmp_line3_0 = Line3.new;
    static #tmp_vector3_0 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    public readonly bvh: Bvh3 = Bvh3.new;

    private bvh_traverse = (aabb: Box3) => {
        return aabb.touch_Line(PickingBvh3Resource.#tmp_line3_0);
    }

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

export class PickingPolyLineResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingPolyLineResource";

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
        const clip_to_world = PickingPolyLineResource.#tmp_vector4_0.set(0, 0, - distance, 1.0);
        const projection = camera.get_Projection(PickingPolyLineResource.#tmp_matrix4_0);
        clip_to_world.transform(clip_to_world, projection);
        clip_to_world.mult_Number(clip_to_world, 1.0 / clip_to_world.w);
        clip_to_world.x = size / resolution.x;
        clip_to_world.y = size / resolution.y;
        clip_to_world.transform(clip_to_world, projection.inverse(projection));
        clip_to_world.mult_Number(clip_to_world, 1.0 / clip_to_world.w);
        return Math.abs(Math.max(clip_to_world.x, clip_to_world.y));
    }

    private raycast_LinesScreenSpace(line: Line3, to: Line3[], global_transform: Matrix4, camera: Camera3, resolution: Vector2): RaycastResult3 | undefined {
        const projection = camera.get_Projection(PickingPolyLineResource.#tmp_matrix4_0);
        const camera_view = camera.get_GlobalTransform(PickingPolyLineResource.#tmp_matrix4_1);
        camera_view.inverse(camera_view);
        const near = 0;

        const picking_point_screen = camera.project_Point(line.start, PickingPolyLineResource.#tmp_vector2_1);
        const picking_point_world = PickingPolyLineResource.#tmp_vector3_0.set(picking_point_screen.x * resolution.x / 2, picking_point_screen.y * resolution.y / 2, 0);

        let min_width = Infinity;
        let min_distance = Infinity;
        let min_point: RaycastResult3 | undefined = undefined;

        const start = PickingPolyLineResource.#tmp_vector3_1;
        const end = PickingPolyLineResource.#tmp_vector3_2;
        const start4 = PickingPolyLineResource.#tmp_vector4_0;
        const end4 = PickingPolyLineResource.#tmp_vector4_1;
        const _line = PickingPolyLineResource.#tmp_line3_0;
        const closest_point = PickingPolyLineResource.#tmp_vector3_3;
        const p0 = PickingPolyLineResource.#tmp_out_number_0;
        const p1 = PickingPolyLineResource.#tmp_out_number_1;

        for (const _l of to) {
            start.apply_Matrix4(_l.start, global_transform);
            end.apply_Matrix4(_l.end, global_transform);
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
            const is_in_clip_space = z_pos >= - 1 && z_pos <= 1;
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
        const box = PickingPolyLineResource.#tmp_box3_0.enlarge(aabb, this.amount);
        return box.touch_Line(PickingPolyLineResource.#tmp_line3_0);
    }

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3 | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (camera === undefined || viewport === undefined || this.points.length <= 0 || this.bvh.root === undefined) return undefined;

        const global_inverse = PickingPolyLineResource.#tmp_matrix4_0.inverse(global_transform);
        PickingPolyLineResource.#tmp_line3_0.set(PickingPolyLineResource.#tmp_vector3_0.apply_Matrix4(from, global_inverse), PickingPolyLineResource.#tmp_vector3_1.apply_Matrix4(to, global_inverse));
        const line_global = PickingPolyLineResource.#tmp_line3_1.set(from, to);
        const camera_position = camera.get_GlobalTransform(PickingPolyLineResource.#tmp_matrix4_0).get_Position(PickingPolyLineResource.#tmp_vector3_0);
        const resolution = viewport.get_Size(PickingPolyLineResource.#tmp_vector2_0);
        const root_aabb = this.bvh.root.aabb;
        const distance = root_aabb.get_FarestDistanceToPoint(camera_position);
        this.amount = this.get_WorldSpaceHalfWidth(camera, distance, this._line_width, resolution);

        const shapes = this.bvh.traverse(this.bvh_traverse) as Line3[];
        if (shapes.length === 0) return undefined;
        return this.raycast_LinesScreenSpace(line_global, shapes, global_transform, camera, resolution);
    }

    protected dispose(): void { }

    // save / load

    // public dump(writer: ClassWriter): void {
    //     writer.property('width', this.width);
    //     writer.property('points', new ValueObject(this.points));
    // }

    // public load(reader: ClassReader): void {
    //     this.width = reader.get<number>('width') ?? 5;
    //     const points = reader.get<ValueObject>('points')?.value;
    //     if (points !== undefined) this.points = points;
    // }
}