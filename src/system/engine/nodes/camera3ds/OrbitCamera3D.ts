import { Vector3 as THREEVec3, Euler, Vector2 as THREEVec2, Ray, Raycaster, Plane, Line3 } from 'three';
import { Node3D } from "../node3ds/Node3D";
import { InterpolateCamera3D } from '@/system/engine/nodes/camera3ds/InterpolateCamera3D';
import { Tau, clamp } from '@/system/math/Scalar';
import { ActionInputEvent } from "../../inputs/events/ActionInputEvent";
import { MouseButtonInputEvent, MouseButton } from "../../inputs/events/mouse_events/MouseButton";
import { MouseMotionInputEvent } from "../../inputs/events/mouse_events/MouseMotionInputEvent";
import { MouseEnterLeaveInputEvent } from "../../inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { type InputEvent } from "../../inputs/InputEvent";
import { EasingType, MethodTween, PropertyTween, TransitionType, TweenBase, TweenParallel } from '@/system/engine/Tween';
import { Vector3, vec3 } from '@/system/math/linear_algebra/Vector3';
import { Vector2, vec2 } from '@/system/math/linear_algebra/Vector2';
import { euler } from '@/system/math/linear_algebra/Euler';

export class OrbitCamera3D extends Node3D {
    public static readonly class_name: string = "OrbitCamera3D";

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

    public zoom_to_cursor: boolean = true;
    public zoom_enable: boolean = true;
    public rotate_enable: boolean = true;
    public pan_enable: boolean = true;

    private _perspective_fov: number = 60;
    public get perspective_fov() { return this._perspective_fov; }
    public set perspective_fov(fov: number) {
        fov = clamp(fov, 0, 179);
        if (this._perspective_fov !== fov) {
            this._perspective_fov = fov;
            if (!this.is_orthographic) {
                this.set_Fov(this._perspective_fov, false);
            }
        }
    }

    public get is_orthographic() { return this.camera.is_orthographic; }
    public get direction() { return this.local_rotation.y; }
    public get yaw() { return this.camera_arm.local_rotation.x; }

    public get visual_mask() { return this.camera.visual_mask; }
    public set visual_mask(mask: number) { this.camera.visual_mask = mask; }

    constructor() {
        super();
        this.add_Child(this.camera_arm);
        this.camera_arm.add_Child(this.camera);
        this.camera.fov = this.perspective_fov;
        this.focus_distance = 1;
    }

    // drag
    private _is_dragging: boolean = false;
    public get is_dragging() { return this._is_dragging; }

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
                    this.rotate(event.relative);
                }
                event.mark_Canceled();
            }
        }
        if (!propagate && event instanceof ActionInputEvent && event.pressed) {
            // zoom
            if (event.action === 'zoomIn') {
                this.zoom(true);
                event.mark_Canceled();
            }
            else if (event.action === 'zoomOut') {
                this.zoom(false);
                event.mark_Canceled();
            }
            else if (event.action === 'switch_TopView') {
                this.set_Rotation(0, -Math.PI / 2, true);
                this.set_Fov(0, true);
                this._is_dragging = false;
                event.mark_Canceled();
            }
            else if (event.action === 'switch_BottomView') {
                this.set_Rotation(0, Math.PI / 2, true);
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
            else if (event.action === 'switch_RightView') {
                this.set_Rotation(Math.PI / 2, 0, true);
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
            else if (event.action === 'switch_BackView') {
                this.set_Rotation(Math.PI, 0, true);
                this.set_Fov(0, true);
                this._is_dragging = false;
                event.mark_Canceled();
            }
            else if (event.action === 'switch_CameraType') {
                if (this.is_fov_tween_finished) {
                    this.set_Fov(this.is_orthographic ? this.perspective_fov : 0, true);
                    event.mark_Canceled();
                }
            }
        }
    }

    // zoom
    private zoom_tween: TweenBase | undefined = undefined;
    private get is_zoom_tween_finished() { return this.zoom_tween === undefined || this.zoom_tween.finished; }
    public zoom_delta = 0.25;
    public min_zoom_delta = 0.005;
    public max_zoom_delta = 0.5;
    public min_zoom = 0.005;
    public max_zoom = 10;
    public zoom_duration = 0.1;

    private target_zoom: number = 1;

    private zoom(zoom_in: boolean) {
        if (!this.zoom_enable) return;

        if (this.zoom_tween !== undefined) {
            this.get_SceneTree()?.stop_Tween(this.zoom_tween);
        }

        const target = this.target_zoom;
        const zoom_delta = clamp(this.zoom_delta * target, this.min_zoom_delta, this.max_zoom_delta);
        const new_target = zoom_in ? clamp(target + zoom_delta, this.min_zoom, this.max_zoom) : clamp(target - zoom_delta, this.min_zoom, this.max_zoom);
        this.target_zoom = new_target;

        const current_zoom = this.camera.zoom;

        const zoom_tween = this.zoom_to_cursor ?
            new MethodTween(v => {

                const zoom = current_zoom + (new_target - current_zoom) * v;

                const mouse_inside = this.get_Viewport()?.get_Input().is_mouse_inside ?? false;
                const mouse_position_normalized = this.get_Viewport()?.get_Input().mouse_position_normalized;
                if (mouse_inside && mouse_position_normalized !== undefined) {
                    const camera = this.get_Viewport()?.get_Camera3D();
                    if (camera !== undefined) {
                        const cam = camera.get_Camera();
                        const dir = this.camera_arm.to_Global(vec3(0, 0, 1)).minus(this.global_position).normalize();
                        const plane = new Plane().setFromNormalAndCoplanarPoint(new THREEVec3(dir.x, dir.y, dir.z), new THREEVec3().fromArray(this.global_position.array));

                        const raycaster = new Raycaster();
                        raycaster.setFromCamera(new THREEVec2(0, 0), cam);
                        const ray = raycaster.ray;
                        const center = plane.intersectLine(new Line3(ray.origin, ray.origin.clone().addScaledVector(ray.direction, 100000)), new THREEVec3());

                        const raycaster2 = new Raycaster();
                        raycaster2.setFromCamera(new THREEVec2().fromArray(mouse_position_normalized.array), cam);
                        const ray2 = raycaster2.ray;
                        const mouse = plane.intersectLine(new Line3(ray2.origin, ray2.origin.clone().addScaledVector(ray2.direction, 100000)), new THREEVec3());

                        if (center !== null && mouse !== null) {
                            const delta = mouse.sub(center).multiplyScalar(1 - this.camera.zoom / zoom);
                            this.set_Position(this.local_position.add(vec3(delta.x, delta.y, delta.z)), false);
                        }
                    }
                }

                this.camera.zoom = zoom;

            }, this.zoom_duration, TransitionType.Quad, EasingType.Out) :
            new PropertyTween(this.camera, 'zoom', new_target, this.zoom_duration, TransitionType.Quad, EasingType.Out);

        this.zoom_tween = zoom_tween;
        this.get_SceneTree()?.start_Tween(this.zoom_tween);

    }

    // rotate
    public rotate_strength: number = 0.0075;

    private rotate(relative: Vector2) {
        if (!this.rotate_enable) return;

        const { x, y } = relative;
        this.set_Rotation(this.direction - x * this.rotate_strength, this.yaw - y * this.rotate_strength);
    }

    private pan(relative_normalized: Vector2) {
        if (!this.pan_enable) return;

        const viewport = this.get_Viewport();
        if (viewport === undefined) return;
        const camera = viewport.get_Camera3D();
        if (camera === undefined) return;

        const raycaster = new Raycaster();
        raycaster.setFromCamera(new THREEVec2().fromArray(relative_normalized.negate().array), camera.get_Camera());
        const ray = raycaster.ray;

        const dir = this.camera_arm.to_Global(vec3(0, 0, 1)).minus(this.global_position).normalize();
        const plane = new Plane().setFromNormalAndCoplanarPoint(new THREEVec3(dir.x, dir.y, dir.z), new THREEVec3().fromArray(this.global_position.array));

        const result = plane.intersectLine(new Line3(ray.origin, ray.origin.clone().addScaledVector(ray.direction, 100000)), new THREEVec3());

        if (result !== null) {
            this.set_Position(vec3(result.x, result.y, result.z), false);
        }
    }

    // transform
    private rotate_tween: TweenParallel | undefined = undefined;
    private get is_rotate_tween_finished() { return this.rotate_tween === undefined || this.rotate_tween.finished; }
    public transform_duration = 0.15;

    public set_Rotation(direction: number, yaw: number, animate: boolean = false) {
        direction = direction % Tau;
        yaw = clamp(yaw % Tau, -Math.PI / 2, Math.PI / 2);
        if (!animate) {
            this.local_rotation = euler(0, direction, 0);
            this.camera_arm.local_rotation = euler(yaw, 0, 0);
        }
        else {
            if (this.rotate_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.rotate_tween);
            }
            this.rotate_tween = new TweenParallel([
                new PropertyTween(this, 'local_rotation', euler(0, direction, 0), this.transform_duration, TransitionType.Quad, EasingType.Out),
                new PropertyTween(this.camera_arm, 'local_rotation', euler(yaw, 0, 0), this.transform_duration, TransitionType.Quad, EasingType.Out),
            ]);
            this.get_SceneTree()?.start_Tween(this.rotate_tween);
        }
    }

    private fov_tween: PropertyTween<InterpolateCamera3D, 'fov', number> | undefined = undefined;
    private get is_fov_tween_finished() { return this.fov_tween === undefined || this.fov_tween.finished; }

    public set_Fov(fov: number, animate: boolean = false) {
        fov = clamp(fov, 0, 179);
        if (!animate) {
            this.camera.fov = fov;
        }
        else {
            if (this.fov_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.fov_tween);
            }
            this.fov_tween = new PropertyTween(this.camera, 'fov', fov, this.transform_duration, TransitionType.Quad, EasingType.Out);
            this.get_SceneTree()?.start_Tween(this.fov_tween);
        }
    }

    private position_tween: PropertyTween<OrbitCamera3D, 'local_position', Vector3> | undefined = undefined;
    private get is_position_tween_finished() { return this.position_tween === undefined || this.position_tween.finished; }

    public set_Position(position: Vector3, animate: boolean = false) {
        const pos = position.clone();
        if (!animate) {
            this.local_position = vec3(position.x, position.y, position.z);
        }
        else {
            if (this.position_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.position_tween);
            }
            this.position_tween = new PropertyTween(this, 'local_position', pos, this.transform_duration, TransitionType.Quad, EasingType.Out);
            this.get_SceneTree()?.start_Tween(this.position_tween);
        }
    }
}