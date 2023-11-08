import { EPSILON } from "../../MathF";
import { Node3D, NodeNotification } from "../../SceneTree";
import { Raycaster, Vector2, Plane, Line3, Vector3 } from "three";
import type { ClassReader, ClassWriter } from "../../classes/ClassWriterReader";

export class FixSizeNode3D extends Node3D {
    public static readonly class_name: string = "FixSizeNode3D";

    public unit_pixel_count: number = 50;
    public use_active_viewport: boolean = true;

    protected update_Size() {
        const viewport = this.use_active_viewport ? this.get_SceneTree()?.get_ActiveViewports()[0] : this.get_Viewport();
        const camera = viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return;
        const { y: height } = viewport!.size;
        if (height === 0) return;
        const center_ray = new Raycaster();
        center_ray.setFromCamera(new Vector2(0, 0), camera);
        const top_ray = new Raycaster();
        top_ray.setFromCamera(new Vector2(0, 1), camera);
        const center = center_ray.ray.origin.clone().addScaledVector(center_ray.ray.direction, 1);
        const plane = new Plane().setFromNormalAndCoplanarPoint(center_ray.ray.direction, center);
        const top = plane.intersectLine(new Line3(top_ray.ray.origin.clone(), top_ray.ray.origin.clone().addScaledVector(top_ray.ray.direction, 10000)), new Vector3());
        if (top === null) return;
        const distance = center.distanceTo(top);
        const is_persp = center_ray.ray.origin.distanceTo(top_ray.ray.origin) < EPSILON;
        if (is_persp) {
            const self_distance = this.global_position.distanceTo(center_ray.ray.origin);
            const h = self_distance * distance;
            this.local_scale = new Vector3(h, h, h).multiplyScalar(this.unit_pixel_count / (height / 2));
        }
        else {
            this.local_scale = new Vector3(distance, distance, distance).multiplyScalar(this.unit_pixel_count / (height / 2));
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