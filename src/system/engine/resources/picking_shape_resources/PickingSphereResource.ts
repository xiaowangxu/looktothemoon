import type { Viewport } from "../../nodes/Node";
import { RaycastSide } from "@/system/fivepebble/geometries/GeometryLike";
import { Epsilon } from '../../../fivepebble/Scalar';
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import { PickingShape3DResource, type RaycastResult3 } from "./PickingShapeResource";


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
