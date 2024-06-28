import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { MeshInstance3D } from "../visual_instance3ds/geometry3ds/MeshInstance3D";
import { NodeNotification } from "../../Node";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class InfiniteGrid3D extends MeshInstance3D {

    private readonly _plane: Plane3 = Plane3.create(Vector3.create(0, 1, 0), 0);
    public get plane() { return this._plane.clone(); }
    public set plane(ray: Plane3) {
        this._plane.copy(ray);
    }

    constructor() {
        super();
        this.top_level = true;
        this.block_redundant_before_render_notification = false;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Visual();
                break;
            }
        }
        super._notification(what);
    }


    private update_Visual() {
        const camera = this.get_SceneTree()?.get_RenderingViewport()?.get_Camera3D();
        if (camera === undefined) {
            this.local_visible = false;
            return;
        }
        const ray = camera.get_Camera().project_Ray(Vector2.new, undefined, Ray3.new);
        const point = this.plane.intersect_UncappedRay(ray, Vector3.new);
        if (point === undefined) {
            this.local_visible = false;
            return;
        }
        else {
            this.local_visible = true;
            this.global_position = point.snap(point, Vector3.create(1, 1, 1));
        }
    }
}