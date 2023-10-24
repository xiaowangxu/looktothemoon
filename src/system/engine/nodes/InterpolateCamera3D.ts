import { Camera3D, NodeNotification } from '../SceneTree';
import { Camera, PerspectiveCamera, OrthographicCamera, Vector2, Matrix4, Vector3, Quaternion, Euler } from 'three';

export class InterpolateCamera3D extends Camera3D {
    private static MaxOffsetDistance = 1000;
    private static OrthographicMaxOffsetDistance = 2500;

    private readonly persp_camera: PerspectiveCamera = new PerspectiveCamera(90, 1, 0.1, 2500);
    private readonly orth_camera: OrthographicCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 2500);

    private _reference_distance: number = 5;
    public get reference_distance() { return this._reference_distance; }
    public set reference_distance(distance: number) {
        if (this._reference_distance !== distance) {
            if (!this.use_orth) {
                const ratio = (distance + this.offset_distance) / (this._reference_distance + this.offset_distance);
                const zoom = ratio * this._reference_zoom;
                this._reference_zoom = zoom;
                console.log(this._reference_zoom);
                const aspect = this.orth_camera.right / this.orth_camera.top;
                const h = this._reference_zoom;
                this.orth_camera.top = h / 2;
                this.orth_camera.bottom = -h / 2;
                const w = aspect * h;
                this.orth_camera.left = -w / 2;
                this.orth_camera.right = w / 2;
                this.orth_camera.updateProjectionMatrix();
            }
            this._reference_distance = distance;
            this.update_Camera();
        }
    }

    private _reference_zoom: number = 2;
    public get reference_zoom() { return this._reference_zoom; }
    public set reference_zoom(zoom: number) {
        if (this._reference_zoom !== zoom) {
            this._reference_zoom = zoom;
            this.update_Camera();
        }
    }

    private _fov: number = 90;
    public get fov() { return this._fov; }
    public set fov(fov: number) {
        if (this._fov !== fov) {
            this._fov = fov;
            this.update_Camera();
        }
    }

    private _near: number = 0.1;
    public get near() { return this._near; }
    public set near(near: number) {
        if (this._near !== near) {
            this._near = near;
            this.update_Camera();
        }
    }

    private _far: number = 1000;
    public get far() { return this._far; }
    public set far(far: number) {
        if (this._far !== far) {
            this._far = far;
            this.update_Camera();
        }
    }

    private _zoom: number = 1;
    public get zoom() { return this._zoom; }
    public set zoom(zoom: number) {
        if (this._zoom !== zoom) {
            this._zoom = zoom;
            this.update_Camera();
        }
    }

    private offset_distance: number = 0;
    private use_orth: boolean = false;

    constructor() {
        super();
        this.persp_camera.matrixAutoUpdate = false;
        this.persp_camera.matrixWorldAutoUpdate = false;
        this.orth_camera.matrixAutoUpdate = false;
        this.orth_camera.matrixWorldAutoUpdate = false;
        this.update_Camera();
    }

    private update_Camera() {
        const half_zoom = (this.reference_zoom / this.zoom) / 2;
        const half_fov = (this.fov / 180 * Math.PI) / 2;
        // offset
        this.offset_distance = half_fov === 0 ? InterpolateCamera3D.OrthographicMaxOffsetDistance : (half_zoom / Math.tan(half_fov)) - this.reference_distance;
        this.use_orth = this.offset_distance >= InterpolateCamera3D.MaxOffsetDistance;
        this.persp_camera.fov = this.fov;
        this.persp_camera.near = this.near;

        // far
        const persp_far_distance = this.far + this.offset_distance;
        this.persp_camera.far = persp_far_distance;
        this.orth_camera.far = this.far + InterpolateCamera3D.OrthographicMaxOffsetDistance;
        // near
        // const persp_near_distance = this.near + this.offset_distance;
        this.persp_camera.near = this.near;
        this.orth_camera.near = this.near; //Math.max(0, this.near + InterpolateCamera3D.OrthographicMaxOffsetDistance);

        // zoom
        this.orth_camera.zoom = this.zoom;
        //    this.persp_camera.zoom = this.zoom;

        this.persp_camera.updateProjectionMatrix();
        this.orth_camera.updateProjectionMatrix();
        this.update_CameraTransform();
    }

    private update_CameraTransform() {
        const offset_distance = this.use_orth ? InterpolateCamera3D.OrthographicMaxOffsetDistance : this.offset_distance;
        const _global_transform = (this.global_transform.multiply(new Matrix4().makeTranslation(0, 0, offset_distance)));
        this.persp_camera.matrixWorld.copy(_global_transform);
        this.persp_camera.matrixWorldInverse.copy(this.persp_camera.matrixWorld).invert();
        this.orth_camera.matrixWorld.copy(this.persp_camera.matrixWorld);
        this.orth_camera.matrixWorldInverse.copy(this.persp_camera.matrixWorldInverse);
    }

    public get_Camera(): Camera {
        return this.use_orth ? this.orth_camera : this.persp_camera;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                if (this.is_global_transform_changed) {
                    this.update_CameraTransform();
                }
                break;
            }
        }
        super._notification(what);
    }

    public update_ViewportSize(size: Vector2): void {
        const { x, y } = size;
        const aspect = x / y;
        this.persp_camera.aspect = aspect;
        this.persp_camera.updateProjectionMatrix();
        const h = this.reference_zoom;
        this.orth_camera.top = h / 2;
        this.orth_camera.bottom = -h / 2;
        const w = aspect * h;
        this.orth_camera.left = -w / 2;
        this.orth_camera.right = w / 2;
        this.orth_camera.updateProjectionMatrix();
    }
}