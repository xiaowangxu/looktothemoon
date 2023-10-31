import { BackSide, DoubleSide, FrontSide, Ray, Vector3 } from "three";
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

        const ray_distance = sphere_pos.distanceTo(normal.multiplyScalar(sphere_d));

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

export class PickingBoxResource extends PickingShape3DResource {
    public static readonly class_name: string = "PickingBoxResource";

    private _size: Vector3 = new Vector3(1, 1, 1);
    public get size() { return this._size; }
    public set size(size: Vector3) {
        this._size.copy(size);
        this.trigger_Changed();
    }

    perform_Raycast(from: Vector3, to: Vector3, side: PickingSide, camera: Camera3D | undefined): RaycastResult | undefined {
        return undefined;
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