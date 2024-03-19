import { Camera3, OrthographicCamera3 } from "@/system/fivepebble/graphics/Camera3";
import { Camera3D } from "./Camera3D";
import { NodeNotification } from "../../Node";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class OrthographicCamera3D extends Camera3D {
    public static readonly class_name: string = "OrthographicCamera3D";

    private readonly camera_orth: OrthographicCamera3 = new OrthographicCamera3();

    private _zoom: number = 1;
    public get zoom() { return this._zoom; }
    public set zoom(zoom: number) {
        if (this._zoom !== zoom) {
            this._zoom = zoom;
            this.camera_orth.zoom = this._zoom;
        }
    }

    protected on_MaskChanged(): void {
        this.camera_orth.mask = this.mask;
    }

    public get_Camera(): Camera3 {
        return this.camera_orth;
    }

    public update_ViewportSize(size: Vector2) {
        let { x: width, y: height } = size;
        if (height === 0) width = height = 1;
        this.camera_orth.aspect = width / height;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.SetupCamera: {
                if (this.is_global_transform_changed) {
                    this.update_GlobalTransform();
                    this.camera_orth.global_transform = this._global_transform;
                    this.is_global_transform_changed = false;
                }
                break;
            }
        }
        super._notification(what);
    }
}
