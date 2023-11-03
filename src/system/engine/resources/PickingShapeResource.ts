import { BackSide, DoubleSide, FrontSide, Ray, Vector2, Vector3 } from "three";
import { Resource } from "../Resource";
import type { Camera3D } from "../SceneTree";
import { PickingSide, type PickingShape3D, type RaycastResult } from "../World";
import { EPSILON } from '../MathF';
import { MeshBVH } from 'three-mesh-bvh';
import type { GeometryResource } from "./GeometryResource";

export class PickingShape3DResource extends Resource implements PickingShape3D {
    public static readonly class_name: string = "PickingShape3DResource";

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
        throw new Error("abstract method");
    }
}

export class PickingBoxResource extends Resource {
    public static readonly class_name: string = "PickingBoxResource";

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

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
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

        const rel = to.clone().sub(from);

        const normal = new Vector3();
        switch (axis) {
            case 0: normal.x = sign; break;
            case 1: normal.y = sign; break;
            case 2: normal.z = sign; break;
        }

        const result = from.clone().addScaledVector(rel, min);

        return { position: result, normal: normal };
    }
}

export class PickingSphereResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingSphereResource";

    private _radius: number = 0.5;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.trigger_Changed();
        }
    }

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
        if (this.radius < EPSILON) return undefined;

        const sphere_pos = from.clone().negate();
        const rel = to.clone().sub(from);
        const rel_l = rel.length();

        if (rel_l < EPSILON) {
            return undefined;
        }
        const normal = rel.divideScalar(rel_l);

        const sphere_d = sphere_pos.dot(normal);
        const ray_distance = sphere_pos.distanceTo(normal.clone().multiplyScalar(sphere_d));

        if (ray_distance >= this.radius) {
            return undefined;
        }

        const inters_d2 = this.radius * this.radius - ray_distance * ray_distance;
        let inters_d = sphere_d;

        if (inters_d2 >= EPSILON) {
            inters_d -= Math.sqrt(inters_d2);
        }

        // Check in segment.
        if (inters_d < 0 || inters_d > rel_l) {
            return undefined;
        }

        const result_position = from.clone().addScaledVector(normal, inters_d);
        const result_normal = result_position.normalize();

        return { position: result_position, normal: result_normal };
    }
}

export class PickingCylinderResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingCylinderResource";

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

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
        const rel = to.clone().sub(from);
        const rel_l = rel.length();
        if (rel_l < EPSILON) {
            return undefined;
        }

        const cylinder_axis = new Vector3(0, 1, 0);

        // First check if they are parallel.
        const normal = rel.clone().divideScalar(rel_l);
        const crs = normal.cross(cylinder_axis);
        const crs_l = crs.length();

        let axis_dir: Vector3;

        if (crs_l < EPSILON) {
            axis_dir = new Vector3(0, 0, 1); // Any side axis OK.
        } else {
            axis_dir = crs.clone().divideScalar(crs_l);
        }

        const dist = axis_dir.dot(from);

        if (dist >= this.radius) {
            return undefined; // Too far away.
        }

        // Convert to 2D.
        const w2 = this.radius * this.radius - dist * dist;
        if (w2 < EPSILON) {
            return undefined; // Avoid numerical error.
        }

        const size = new Vector2(Math.sqrt(w2), this.height / 2);

        const side_dir = axis_dir.clone().cross(cylinder_axis).normalize();

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
        const result = from.clone().addScaledVector(rel, min);
        const res_normal = result.clone();

        if (axis == 0) {
            res_normal.y = 0;
        } else {
            res_normal.x = 0;
            res_normal.z = 0;
        }

        res_normal.normalize();

        return { position: result, normal: res_normal };
    }
}

export class PickingBVHResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingBVHResource";

    private bvh: MeshBVH | undefined = undefined;

    public compute_BVH(geometry: GeometryResource) {
        this.bvh = new MeshBVH(geometry.get_BufferGeometry());
    }

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
        if (this.bvh === undefined) return undefined;
        const results = this.bvh.raycast(
            new Ray(from, to.sub(from).normalize()),
            side === PickingSide.Front ? FrontSide : (side === PickingSide.Back ? BackSide : DoubleSide)
        );
        if (results.length === 0) return undefined;
        const min: RaycastResult = {
            position: results[0].point,
            normal: results[0].normal!,
        }
        let min_distance = results[0].distance;
        for (let i = 1; i < results.length; i++) {
            const { point, normal, distance } = results[i];
            if (min_distance >= distance) {
                min_distance = distance;
                min.position = point;
                min.normal = normal!;
            }
        }
        return min;
    }
}