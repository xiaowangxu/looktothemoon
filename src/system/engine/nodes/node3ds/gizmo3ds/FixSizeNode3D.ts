import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { vec2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";

export class FixSizeNode3D extends Node3D {
    public static readonly class_name: string = "FixSizeNode3D";

    public unit_pixel_count: number = 50;
    public use_active_viewport: boolean = true;
    public consider_pixel_ratio: boolean = false;

    static #plane: Plane3 = new Plane3(vec3(0, 0, 0), 0);

    protected update_Size() {
        const viewport = this.use_active_viewport ? this.get_SceneTree()?.get_ActiveViewports()[0] : this.get_Viewport();
        const camera = viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return;
        let { y: height } = viewport!.size;
        if (height === 0) return;
        if (this.consider_pixel_ratio) height *= this.config.render_server.pixel_ratio;
        const center_ray = camera.project_Ray(vec2(0, 0), 0);
        const top_ray = camera.project_Ray(vec2(0, 1));
        const center = center_ray.get_Point(1);
        const plane = FixSizeNode3D.#plane.set_PointAndNormal(center, center_ray.direction);
        const top = plane.intersect_UncappedRay(top_ray);
        if (top === undefined) return;
        const distance = center.distance_to(top);
        const is_persp = !camera.is_orthogonal;
        if (is_persp) {
            const self_distance = this.global_position.distance_to(center_ray.origin);
            const h = self_distance * distance;
            this.local_scale = vec3(h, h, h).mult_Number(this.unit_pixel_count / (height / 2));
        }
        else {
            this.local_scale = vec3(distance, distance, distance).mult_Number(this.unit_pixel_count / (height / 2));
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Size();
                break;
            }
        }
        super._notification(what);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('unit_pixel_count', this.unit_pixel_count);
        writer.property('use_active_viewport', this.use_active_viewport);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.unit_pixel_count = reader.get<number>('unit_pixel_count') ?? 50;
        this.use_active_viewport = reader.get<boolean>('use_active_viewport') ?? true;
    }
}