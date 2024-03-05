import { Resource } from "../Resource";
import type { Viewport } from "../../nodes/Node";
import type { Camera3D } from "../../nodes/node3ds/camera3ds/Camera3D";
import { RaycastSide, type RaycastResult, type Raycastable } from "@/system/fivepebble/geometries/GeometryLike";
import { type PickingShape3D } from "../../worlds/world3ds/PickingWorld3D";
import { Epsilon } from '../../../fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import { Box3, box3 } from "@/system/fivepebble/geometries/Box3";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";

type RaycastResult3 = RaycastResult<Vector3, Matrix3>;

export abstract class PickingShape3DResource extends Resource implements PickingShape3D {
    public static readonly class_name: string = "PickingShape3DResource";

    public readonly preserve_global_transform: boolean = false;

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        throw new Error("abstract method");
    }
}

export class PickingBoxResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingBoxResource";

    static readonly #tmp_vector3_0 = Vector3.new;

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

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        let min = 0, max = 1;
        let axis = 0;
        let sign = 0;

        const position_start = new Vector3(-this.width / 2, -this.height / 2, -this.depth / 2);
        const position_end = new Vector3(this.width / 2, this.height / 2, this.depth / 2);

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

            } else {
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

        const normal = new Vector3();
        switch (axis) {
            case 0: normal.x = sign; break;
            case 1: normal.y = sign; break;
            case 2: normal.z = sign; break;
        }

        const result = from.clone();
        result.add_Scaled(result, min, rel);

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

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (this.radius < Epsilon) return undefined;

        const sphere_pos = PickingSphereResource.#tmp_vector3_0.negate(from);
        const rel =  PickingSphereResource.#tmp_vector3_1.sub(to, from);
        const rel_l = rel.length;

        if (rel_l < Epsilon) {
            return undefined;
        }
        const normal = rel.div_Number(rel, rel_l);

        const sphere_d = sphere_pos.dot(normal);
        const ray_distance = sphere_pos.distance_to( PickingSphereResource.#tmp_vector3_2.mult_Number(normal, sphere_d));

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

        const result_position = from.clone();
        result_position.add_Scaled(result_position, inters_d, normal);
        const result_normal = result_position.clone().normalize(result_position);

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

    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;
    static readonly #tmp_vector3_2 = Vector3.new;
    static readonly #tmp_vector3_3 = Vector3.new;

    public readonly preserve_global_transform: boolean = false;

    private _radius: number = 0.5;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
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

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        const rel = Vector3.new.sub(to, from);
        const rel_l = rel.length;
        if (rel_l < Epsilon) {
            return undefined;
        }

        const cylinder_axis = new Vector3(0, 1, 0);

        // First check if they are parallel.
        const normal = Vector3.new.div_Number(rel, rel_l);
        const crs = Vector3.new.cross(normal, cylinder_axis);
        const crs_l = crs.length;

        let axis_dir: Vector3;

        if (crs_l < Epsilon) {
            axis_dir = new Vector3(0, 0, 1); // Any side axis OK.
        } else {
            axis_dir = Vector3.new.div_Number(crs, crs_l);
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

        const size = new Vector2(Math.sqrt(w2), this.height / 2);

        const side_dir = Vector3.new.normalize(Vector3.new.cross(axis_dir, cylinder_axis));

        const from2D = new Vector2(side_dir.dot(from), from.y);
        const to2D = new Vector2(side_dir.dot(to), to.y);

        let min = 0, max = 1;

        let axis = -1;

        for (let i = 0; i < 2; i++) {
            const seg_from = i === 0 ? from2D.x : from2D.y;
            const seg_to = i === 0 ? to2D.x : to2D.y;
            const box_begin = - (i === 0 ? size.x : size.y);
            const box_end = -box_begin;
            let cmin, cmax;

            if (seg_from < seg_to) {
                if (seg_from > box_end || seg_to < box_begin) {
                    return undefined;
                }
                const length = seg_to - seg_from;
                cmin = (seg_from < box_begin) ? ((box_begin - seg_from) / length) : 0;
                cmax = (seg_to > box_end) ? ((box_end - seg_from) / length) : 1;

            } else {
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

export class PickingRaycastableResource<T extends Raycastable<Vector3, Matrix3>> extends PickingShape3DResource {
    public raycastable: T | undefined;

    perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult3 | undefined {
        if (this.raycastable === undefined) return undefined;
        return this.raycastable.raycast(from, to, side);
    }
  
    protected dispose(): void {  }  
}

// export class PickingBVHResource extends PickingShape3DResource {
//     public static readonly class_name: string = "PickingBVHResource";

//     public readonly preserve_global_transform: boolean = false;

//     private bvh: MeshBVH | undefined = undefined;

//     public compute_BVH(geometry: GeometryResource) {
//         this.bvh = new MeshBVH(geometry.get_BufferGeometry());
//     }

//     perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult | undefined {
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

// export class PickingPolyLineResource extends PickingShape3DResource {
//     public static readonly class_name: string = "PickingPolyLineResource";

//     public readonly preserve_global_transform: boolean = true;

//     private _width: number = 5;
//     public get width() { return this._width; }
//     public set width(width: number) {
//         if (this._width !== width) {
//             this._width = width;
//             this.trigger_Changed();
//         }
//     }

//     private bbox: Box3 = box3();

//     private _points: Vector3[] = [];
//     public get points() { return this._points.map(i => i); }
//     public set points(points: Vector3[]) {
//         this._points = points.map(i => i);
//         this.update_BBox();
//         this.trigger_Changed();
//     }

//     private update_BBox() {
//         const points = this.points;
//         const points_length = points.length;
//         if (points.length <= 0) return;
//         this.bbox.min.copy(points[0]);
//         this.bbox.max.copy(points[0]);
//         for (let i = 1; i < points_length; i++) {
//             this.bbox.expandByPoint(points[i]);
//         }
//     }

//     private get_WorldSpaceHalfWidth(camera: Camera3, distance: number, resolution: Vector2) {
//         // transform into clip space, adjust the x and y values by the pixel width offset, then
//         // transform back into world space to get world offset. Note clip space is [-1, 1] so full
//         // width does not need to be halved.
//         const _clipToWorldVector = new Vector4().set(0, 0, - distance, 1.0).transform(camera.projection);
//         _clipToWorldVector.mult_Number(1.0 / _clipToWorldVector.w);
//         _clipToWorldVector.x = this.width / resolution.x;
//         _clipToWorldVector.y = this.width / resolution.y;
//         _clipToWorldVector.transform(camera.projectionMatrixInverse);
//         _clipToWorldVector.mult_Number(1.0 / _clipToWorldVector.w);
//         return Math.abs(Math.max(_clipToWorldVector.x, _clipToWorldVector.y));
//     }

//     private raycast_ScreenSpace(ray: Ray3, global_transform: Matrix4, camera: Camera, resolution: Vector2): RaycastResult | undefined {

//         const projectionMatrix = camera.projectionMatrix;
//         const matrixWorldInverse = camera.matrixWorldInverse;
//         const near = 0;
//         // pick a point 1 unit out along the ray to avoid the ray origin
//         // sitting at the camera origin which will cause "w" to be 0 when
//         // applying the projection matrix.
//         const a = ray.at(1, new Vector3());

//         // ndc space [ - 1.0, 1.0 ]
//         const _ssOrigin = new Vector4(a.x, a.y, a.z, 1);
//         _ssOrigin.applyMatrix4(matrixWorldInverse);
//         _ssOrigin.applyMatrix4(projectionMatrix);
//         _ssOrigin.multiplyScalar(1 / _ssOrigin.w);

//         // screen space
//         _ssOrigin.x *= resolution.x / 2;
//         _ssOrigin.y *= resolution.y / 2;
//         _ssOrigin.z = 0;

//         const _ssOrigin3 = new Vector3().set(_ssOrigin.x, _ssOrigin.y, _ssOrigin.z);

//         let min_width = Infinity;
//         let min_distance = Infinity;
//         let min_point: RaycastResult | undefined = undefined;

//         const points = this._points;
//         const points_count = points.length - 1;
//         for (let i = 0; i < points_count; i++) {

//             const s = points[i].clone().applyMatrix4(global_transform);
//             const e = points[i + 1].clone().applyMatrix4(global_transform);

//             const _start4 = new Vector4(s.x, s.y, s.z, 1);
//             const _end4 = new Vector4(e.x, e.y, e.z, 1);

//             // camera space
//             _start4.applyMatrix4(matrixWorldInverse);
//             _end4.applyMatrix4(matrixWorldInverse);

//             // skip the segment if it's entirely behind the camera
//             if (_start4.z > near && _end4.z > near) continue;

//             // trim the segment if it extends behind camera near
//             if (_start4.z > near) {
//                 const deltaDist = _start4.z - _end4.z;
//                 const t = _start4.z / deltaDist;
//                 _start4.lerp(_end4, t);

//             } else if (_end4.z > near) {
//                 const deltaDist = _end4.z - _start4.z;
//                 const t = _end4.z / deltaDist;
//                 _end4.lerp(_start4, t);
//             }

//             // clip space
//             _start4.applyMatrix4(projectionMatrix);
//             _end4.applyMatrix4(projectionMatrix);

//             // ndc space [ - 1.0, 1.0 ]
//             _start4.multiplyScalar(1 / _start4.w);
//             _end4.multiplyScalar(1 / _end4.w);

//             // screen space
//             _start4.x *= resolution.x / 2;
//             _start4.y *= resolution.y / 2;

//             _end4.x *= resolution.x / 2;
//             _end4.y *= resolution.y / 2;

//             // create 2d segment
//             const _line = new Line3(new Vector3(_start4.x, _start4.y, 0), new Vector3(_end4.x, _end4.y, 0));

//             if (_line.distance() < Epsilon) continue;

//             // get closest point on ray to segment
//             const param = _line.closestPointToPointParameter(_ssOrigin3, true);
//             const _closestPoint = _line.at(param, new Vector3());

//             // check if the intersection point is within clip space
//             const zPos = lerp(_start4.z, _end4.z, param);
//             const isInClipSpace = zPos >= - 1 && zPos <= 1;

//             const width = _ssOrigin3.distanceTo(_closestPoint);
//             const isInside = width < this.width * 0.5;

//             if (isInClipSpace && isInside) {

//                 const pointOnLine = new Vector3();
//                 const point = new Vector3();
//                 ray.distanceSqToSegment(s, e, point, pointOnLine);

//                 const distance = ray.origin.distanceTo(pointOnLine);

//                 if (width < min_width || (width === min_width && distance < min_distance)) {
//                     min_width = width;
//                     min_distance = distance;
//                     min_point = {
//                         position: pointOnLine.clone(),
//                         normal: e.clone().sub(s).normalize(),
//                     };
//                 }
//             }
//         }

//         return min_point;
//     }

//     perform_Raycast(from: Vector3, to: Vector3, global_transform: Matrix4, side: RaycastSide, camera: Camera3D | undefined, viewport: Viewport | undefined): RaycastResult | undefined {
//         if (camera === undefined || viewport === undefined || this.points.length <= 0) return undefined;

//         const resolution = viewport.size;
//         const _camera = camera.get_Camera();
//         const ray = new Ray(from, to.sub(from).normalize());

//         // check bbox
//         const distanceToBox = Math.max(0, this.bbox.distanceToPoint(ray.origin));
//         const boxMargin = this.get_WorldSpaceHalfWidth(_camera, distanceToBox, resolution);
//         const box = this.bbox.clone().applyMatrix4(global_transform).expandByScalar(boxMargin);
//         if (ray.intersectsBox(box) === false) {
//             return undefined;
//         }

//         return this.raycast_ScreenSpace(ray, global_transform, _camera, resolution);
//     }
    
//     protected dispose(): void { }

//     // save / load

//     public dump(writer: ClassWriter): void {
//         writer.property('width', this.width);
//         writer.property('points', new ValueObject(this.points));
//     }

//     public load(reader: ClassReader): void {
//         this.width = reader.get<number>('width') ?? 5;
//         const points = reader.get<ValueObject>('points')?.value;
//         if (points !== undefined) this.points = points;
//     }
// }