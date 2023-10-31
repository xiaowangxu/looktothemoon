import { type Camera, OrthographicCamera, Vector2 } from "three";
import { Camera3D, NodeNotification } from "../../SceneTree";

export class OrthographicCamera3D extends Camera3D {
    public static readonly class_name: string = "OrthographicCamera3D";

    private readonly camera_orth: OrthographicCamera = new OrthographicCamera();
    private aspect: number = 1;

    private _zoom: number = 1;
    public get zoom() { return this._zoom; }
    public set zoom(zoom: number) {
        if (this._zoom !== zoom) {
            this._zoom = zoom;
            this.camera_orth.left = this._zoom / -2;
            this.camera_orth.right = this._zoom / 2;
            const height = 1 / this.aspect * this._zoom;
            this.camera_orth.top = height / 2;
            this.camera_orth.bottom = height / -2;
            this.camera_orth.updateProjectionMatrix();
        }
    }

    constructor() {
        super();
        this.camera_orth.matrixAutoUpdate = false;
        this.camera_orth.matrixWorldAutoUpdate = false;
    }

    protected on_VisualMaskChanged(): void {
        this.camera_orth.layers.mask = this.visual_mask;
    }

    public get_Camera(): Camera {
        return this.camera_orth;
    }

    public update_ViewportSize(size: Vector2) {
        let { x: width, y: height } = size;
        if (height === 0) {
            width = height = 1;
        }
        this.aspect = width / height;
        this.camera_orth.left = this._zoom / -2;
        this.camera_orth.right = this._zoom / 2;
        const _height = 1 / this.aspect * this._zoom;
        this.camera_orth.top = _height / 2;
        this.camera_orth.bottom = _height / -2;
        this.camera_orth.updateProjectionMatrix();
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.SetupCamera: {
                if (this.is_global_transform_changed) {
                    this.camera_orth.matrixWorld.copy(this.global_transform);
                    this.camera_orth.matrixWorldInverse.copy(this.camera_orth.matrixWorld).invert();
                    this.is_global_transform_changed = false;
                }
                break;
            }
        }
        super._notification(what);
    }
}
