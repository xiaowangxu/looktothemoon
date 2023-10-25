import { Vector3, Euler, Vector2, Ray, Raycaster, Plane, Line3 } from 'three';
import { Node3D } from '../../system/engine/SceneTree';
import { InterpolateCamera3D } from '@/system/engine/nodes/InterpolateCamera3D';
import { TAU, clamp } from '@/system/engine/MathF';
import { MouseButtonInputEvent, type InputEvent, MouseButton, ActionInputEvent, MouseMotionInputEvent, MouseEnterLeaveInputEvent } from '@/system/engine/InputEvent';
import { EasingType, PropertyTween, TransitionType, TweenParallel } from '@/system/engine/Tween';

export class OrbitCamera3D extends Node3D {
    private readonly camera_arm: Node3D = new Node3D();
    private readonly camera: InterpolateCamera3D = new InterpolateCamera3D();

    private _focus_distance: number = 1;
    public get focus_distance() { return this._focus_distance; }
    public set focus_distance(focus_distance: number) {
        focus_distance = clamp(focus_distance, 0, Infinity);
        if (!this.camera.is_orthographic) {
            this.camera.update_ReferenceDistance(focus_distance);
            this._focus_distance = this.camera.reference_distance;
        }
    }

    public get fov() { return this.camera.fov; }
    public set fov(fov: number) { this.camera.fov = fov; }

    public get is_orthographic() { return this.camera.is_orthographic; }
    public get direction() { return this.local_rotation.y; }
    public get yaw() { return this.camera_arm.local_rotation.x; }

    constructor() {
        super();
        this.add_Child(this.camera_arm);
        this.camera_arm.add_Child(this.camera);
        this.fov = 45;
        this.focus_distance = 1;
    }

    // zoom
    private zoom_tween: PropertyTween<InterpolateCamera3D, 'zoom', number> | undefined = undefined;
    public zoom_delta = 0.25;
    public min_zoom_delta = 0.05;
    public max_zoom_delta = 0.3;
    public min_zoom = 0.005;
    public max_zoom = 10;
    public zoom_duration = 0.1;

    // drag
    private _is_dragging: boolean = false;
    public get is_dragging() { return this._is_dragging; }

    // rotate
    public rotate_strength: number = 0.0075;

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && event instanceof MouseButtonInputEvent) {
            // drag
            if (event.button === MouseButton.Middle) {
                if (!this._is_dragging) {
                    if (event.pressed) {
                        this._is_dragging = true;
                        event.mark_Canceled();
                    }
                }
                else if (event.pressed === false) {
                    this._is_dragging = false;
                    event.mark_Canceled();
                }
            }
        }
        // mouse exit
        if (!propagate && event instanceof MouseEnterLeaveInputEvent) {
            if (this.is_dragging && !event.inside) {
                this._is_dragging = false;
            }
        }
        // drag
        if (!propagate && event instanceof MouseMotionInputEvent) {
            if (this._is_dragging) {
                if (event.ctrl) {
                    this.pan(event.relative_normalized);
                }
                else {
                    // roatate
                    this.rotate(event.relative);
                }
                event.mark_Canceled();
            }
        }
        if (!propagate && event instanceof ActionInputEvent) {
            // zoom
            if (event.action === 'zoomIn') {
                let target = this.camera.zoom;
                if (this.zoom_tween !== undefined) {
                    target = this.zoom_tween.target;
                    this.get_SceneTree()?.stop_Tween(this.zoom_tween);
                }
                const zoom_delta = clamp(this.zoom_delta * target, this.min_zoom_delta, this.max_zoom_delta);
                this.zoom_tween = new PropertyTween(this.camera, 'zoom', clamp(target + zoom_delta, this.min_zoom, this.max_zoom), this.zoom_duration, TransitionType.Quad, EasingType.Out);
                this.get_SceneTree()?.start_Tween(this.zoom_tween);
                event.mark_Canceled();
            }
            else if (event.action === 'zoomOut') {
                let target = this.camera.zoom;
                if (this.zoom_tween !== undefined) {
                    target = this.zoom_tween.target;
                    this.get_SceneTree()?.stop_Tween(this.zoom_tween);
                }
                const zoom_delta = clamp(this.zoom_delta * target, this.min_zoom_delta, this.max_zoom_delta);
                this.zoom_tween = new PropertyTween(this.camera, 'zoom', clamp(target - zoom_delta, this.min_zoom, this.max_zoom), this.zoom_duration, TransitionType.Quad, EasingType.Out);
                this.get_SceneTree()?.start_Tween(this.zoom_tween);
                event.mark_Canceled();
            }
            else if (event.action === 'switch_TopView') {
                this.set_Rotation(0, -Math.PI / 2, true);
                this.set_Fov(0, true);
                this._is_dragging = false;
                event.mark_Canceled();
            }
            else if (event.action === 'switch_LeftView') {
                this.set_Rotation(-Math.PI / 2, 0, true);
                this.set_Fov(0, true);
                this._is_dragging = false;
                event.mark_Canceled();
            }
            else if (event.action === 'switch_FrontView') {
                this.set_Rotation(0, 0, true);
                this.set_Fov(0, true);
                this._is_dragging = false;
                event.mark_Canceled();
            }
        }
    }

    private rotate(relative: Vector2) {
        const { x, y } = relative;
        this.set_Rotation(this.direction - x * this.rotate_strength, this.yaw - y * this.rotate_strength);
    }

    private pan(relative_normalized: Vector2) {
        const viewport = this.get_Viewport();
        if (viewport === undefined) return;
        const camera = viewport.get_Camera3D();
        if (camera === undefined) return;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(relative_normalized.multiplyScalar(-1), camera.get_Camera());
        const ray = raycaster.ray;

        const dir = this.camera_arm.to_Global(new Vector3(0, 0, 1)).sub(this.global_position).normalize();
        const plane = new Plane().setFromNormalAndCoplanarPoint(dir, this.global_position);

        const point = new Vector3();
        const result = plane.intersectLine(new Line3(ray.origin, ray.origin.clone().addScaledVector(ray.direction, 100000)), point);

        if (result !== null) {
            this.local_position = point;
        }
    }

    // transform
    private transform_tween: TweenParallel | undefined = undefined;
    public transform_duration = 0.15;
    private fov_tween: PropertyTween<OrbitCamera3D, 'fov', number> | undefined = undefined;

    public set_Rotation(direction: number, yaw: number, animate: boolean = false) {
        direction = direction % TAU;
        yaw = clamp(yaw % TAU, -Math.PI / 2, Math.PI / 2);
        if (!animate) {
            this.local_rotation = new Euler(0, direction, 0);
            this.camera_arm.local_rotation = new Euler(yaw, 0, 0);
        }
        else {
            if (this.transform_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.transform_tween);
            }
            this.transform_tween = new TweenParallel([
                new PropertyTween(this, 'local_rotation', new Euler(0, direction, 0), this.transform_duration, TransitionType.Quad, EasingType.Out),
                new PropertyTween(this.camera_arm, 'local_rotation', new Euler(yaw, 0, 0), this.transform_duration, TransitionType.Quad, EasingType.Out),
            ]);
            this.get_SceneTree()?.start_Tween(this.transform_tween);
        }
    }

    public set_Fov(fov: number, animate: boolean = false) {
        fov = clamp(fov, 0, 179);
        if (!animate) {
            this.fov = fov;
        }
        else {
            if (this.fov_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.fov_tween);
            }
            this.fov_tween = new PropertyTween(this, 'fov', fov, this.transform_duration, TransitionType.Quad, EasingType.Out);
            this.get_SceneTree()?.start_Tween(this.fov_tween);
        }
    }
}