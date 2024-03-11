import { Camera3, OrthographicCamera3, PerspectiveCamera3 } from "@/system/fivepebble/graphics/Camera3";
import { Camera3D } from "./Camera3D";
import { NodeNotification } from "../../Node";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class PerspectiveCamera3D extends Camera3D {
    public static readonly class_name: string = "OrthographicCamera3D";

    private readonly camera_persp: PerspectiveCamera3 = new PerspectiveCamera3();

    private _fov: number = 1;
    public get fov() { return this._fov; }
    public set fov(zoom: number) {
        if (this._fov !== zoom) {
            this._fov = zoom;
            this.camera_persp.fov = this._fov;
        }
    }

    protected on_VisualMaskChanged(): void {
        this.camera_persp.mask = this.visual_mask;
    }

    public get_Camera(): Camera3 {
        return this.camera_persp;
    }

    public update_ViewportSize(size: Vector2) {
        let { x: width, y: height } = size;
        if (height === 0) width = height = 1;
        this.camera_persp.aspect = width / height;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.SetupCamera: {
                if (this.is_global_transform_changed) {
                    this.update_GlobalTransform()
                    this.camera_persp.global_transform = this._global_transform;
                    this.is_global_transform_changed = false;
                }
                break;
            }
        }
        super._notification(what);
    }
}
