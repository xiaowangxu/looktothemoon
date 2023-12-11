import { Deg2Rad, Epsilon } from '../../../fivepebble/Scalar';
import { NodeNotification } from "../Node";
import { Camera3D } from "./Camera3D";
import { Matrix4 } from '@/system/fivepebble/linear_algebra/Matrix4';
import { vec3 } from '@/system/fivepebble/linear_algebra/Vector3';
import { Camera3, OrthographicCamera3, PerspectiveCamera3 } from '@/system/fivepebble/graphics/Camera3';
import type { Vector2 } from '@/system/fivepebble/linear_algebra/Vector2';

export class InterpolateCamera3D extends Camera3D {
    public static readonly class_name: string = "InterpolateCamera3D";

    private static MaxOffsetDistance = 20;
    private static OrthographicMaxOffsetDistance = 1000;

    private readonly persp_camera: PerspectiveCamera3 = new PerspectiveCamera3();
    private readonly orth_camera: OrthographicCamera3 = new OrthographicCamera3();

    private _reference_distance: number = 1;
    public get reference_distance() { return this._reference_distance; }
    public set reference_distance(distance: number) {
        if (this._reference_distance !== distance) {
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

    private _far: number = 5000;
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

    public get is_orthographic() { return this.use_orth; }

    constructor() {
        super();
        this.update_Camera();
    }

    protected on_VisualMaskChanged(): void {
        this.persp_camera.mask = this.visual_mask;
        this.orth_camera.mask = this.visual_mask;
    }

    private update_Camera() {
        // check use orth
        const half_zoom_only = this.reference_zoom / 2;
        const half_fov = (this.fov / 180 * Math.PI) / 2;
        if (half_fov === 0) this.use_orth = true;
        else {
            const zoom_only_offset_distance = (half_zoom_only / Math.tan(half_fov)) - this.reference_distance;
            this.use_orth = zoom_only_offset_distance >= InterpolateCamera3D.MaxOffsetDistance;
        }

        // offset
        const half_zoom = (this.reference_zoom / this.zoom) / 2;
        this.offset_distance = half_fov === 0 ? InterpolateCamera3D.OrthographicMaxOffsetDistance : (half_zoom / Math.tan(half_fov)) - this.reference_distance;
        this.persp_camera.fov = this.fov * Deg2Rad;
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

        this.update_CameraTransform();
    }

    private update_CameraTransform() {
        const offset_distance = this.use_orth ? InterpolateCamera3D.OrthographicMaxOffsetDistance : this.offset_distance;
        const _global_transform = Matrix4.from_BasisPosition(undefined, vec3(0, 0, offset_distance)).compose(this.global_transform);
        this.persp_camera.global_transform = _global_transform;
        this.orth_camera.global_transform = _global_transform;
    }

    public get_Camera(): Camera3 {
        return this.use_orth ? this.orth_camera : this.persp_camera;
    }

    public update_ReferenceDistance(distance: number) {
        if (!this.use_orth) {

            const half_zoom = (this.reference_zoom / this.zoom) / 2;
            const half_fov = (this.fov / 180 * Math.PI) / 2;
            if (half_fov === 0) return;

            const _offset_distance = (half_zoom / Math.tan(half_fov)) - this._reference_distance;
            if (distance + _offset_distance <= Epsilon) return;

            const ratio = (distance + _offset_distance) / (this._reference_distance + _offset_distance);
            if (ratio <= Epsilon) return;

            const zoom = ratio * this._reference_zoom;
            this._reference_zoom = zoom;
            this._reference_distance = distance;

            const aspect = this.orth_camera.aspect;
            const h = this._reference_zoom;
            const w = aspect * h;
            this.orth_camera.width = w;
            this.orth_camera.height = h;

            this.update_Camera();
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.SetupCamera: {
                if (this.is_global_transform_changed) {
                    this.update_CameraTransform();
                    this.is_global_transform_changed = false;
                }
                break;
            }
        }
        super._notification(what);
    }

    public update_ViewportSize(size: Vector2): void {
        let { x, y } = size;
        if (y === 0) {
            x = y = 1;
        }
        const aspect = x / y;
        this.persp_camera.aspect = aspect;
        const h = this.reference_zoom;
        const w = aspect * h;
        this.orth_camera.width = w;
        this.orth_camera.height = h;
    }
}