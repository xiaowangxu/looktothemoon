import { type Camera, PerspectiveCamera, Vector2 } from "three";
import { Camera3D, NodeNotification } from "../../SceneTree";

export class PerspectiveCamera3D extends Camera3D {
    private readonly camera_persp: PerspectiveCamera = new PerspectiveCamera();

    private _fov: number = 45;
    public get fov() { return this._fov; }
    public set fov(fov: number) {
        if (this._fov !== fov) {
            this._fov = fov;
            this.camera_persp.fov = this._fov;
            this.camera_persp.updateProjectionMatrix();
        }
    }

    constructor() {
        super();
        this.camera_persp.matrixAutoUpdate = false;
        this.camera_persp.matrixWorldAutoUpdate = false;
    }

    public get_Camera(): Camera {
        return this.camera_persp;
    }

    public update_ViewportSize(size: Vector2) {
        const aspect = size.x / size.y;
        this.camera_persp.aspect = aspect;
        this.camera_persp.updateProjectionMatrix();
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                if (this.is_global_transform_changed) {
                    this.camera_persp.matrixWorld.copy(this.global_transform);
                    this.camera_persp.matrixWorldInverse.copy(this.camera_persp.matrixWorld).invert();
                }
                break;
            }
        }
        super._notification(what);
    }
}
