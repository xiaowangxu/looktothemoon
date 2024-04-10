import { Node3D } from "../Node3D";
import { InterpolateCamera3D } from '@/system/engine/nodes/node3ds/camera3ds/InterpolateCamera3D';
import { Tau, clamp } from '@/system/fivepebble/Scalar';
import { ActionInputEvent } from "../../../inputs/events/ActionInputEvent";
import { MouseButtonInputEvent, MouseButton } from "../../../inputs/events/mouse_events/MouseButtonInputEvent";
import { MouseMotionInputEvent } from "../../../inputs/events/mouse_events/MouseMotionInputEvent";
import { MouseEnterLeaveInputEvent } from "../../../inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { type InputEvent } from "../../../inputs/InputEvent";
import { TweenEasingType, MethodTween, PropertyTween, TweenTransitionType, TweenBase, TweenParallel } from '@/system/engine/Tween';
import { Vector3 } from '@/system/fivepebble/linear_algebra/Vector3';
import { Vector2 } from '@/system/fivepebble/linear_algebra/Vector2';
import { Euler } from '@/system/fivepebble/linear_algebra/Euler';
import { Plane3 } from '@/system/fivepebble/geometries/Plane3';
import type { Config } from "../../../ConfiguredObject";
import { GrabbingSingleton } from "@/system/engine/singletions/GrabbingSingletion";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Camera3 } from "@/system/fivepebble/graphics/Camera3";
import type { MouseInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseInputEvent";

export class OrbitCamera3D extends Node3D {
    public static readonly class_name: string = "OrbitCamera3D";

    static readonly #tmp_vector2_0 = Vector2.new;
    static readonly #tmp_vector2_1 = Vector2.new;
    static readonly #tmp_plane3_0 = Plane3.new;
    static readonly #tmp_ray3_0 = Ray3.new;
    static readonly #tmp_vector3_0 = Vector3.new;
    static readonly #tmp_vector3_1 = Vector3.new;

    private readonly camera_arm: Node3D = new Node3D(this.config);
    private readonly camera: InterpolateCamera3D = new InterpolateCamera3D(this.config);

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

    private _perspective_fov: number = 40;
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

    private _direction: number = 0;
    public get direction() { return this._direction; }
    public set direction(direction: number) {
        if (this._direction !== direction) {
            this._direction = direction % Tau;
            this.local_rotation = Euler.create(0, this._direction, 0);
        }
    }

    private _yaw: number = 0;
    public get yaw() { return this._yaw; }
    public set yaw(yaw: number) {
        if (this._yaw !== yaw) {
            this._yaw = yaw % Tau;
            this.camera_arm.local_rotation = Euler.create(this._yaw, 0, 0);
        }
    }

    public get visual_mask() { return this.camera.mask; }
    public set visual_mask(mask: number) { this.camera.mask = mask; }

    constructor(config: Config) {
        super(config);
        this.add_Child(this.camera_arm);
        this.camera_arm.add_Child(this.camera);
        this.camera.fov = this.perspective_fov;
        this.focus_distance = 1;
    }

    // drag
    private _is_grabbing_rotate: boolean = false;
    private _is_grabbing: boolean = false;
    private set is_grabbing(is_grabbing: boolean) {
        if (this._is_grabbing !== is_grabbing) {
            this._is_grabbing = is_grabbing;
            if (this._is_grabbing) {
                this.get_SceneTree()?.get_Singleton(GrabbingSingleton)?.on_GrabStart();
            }
            else {
                this.get_SceneTree()?.get_Singleton(GrabbingSingleton)?.on_GrabEnd();
            }
        }
    }
    public get is_grabbing() { return this._is_grabbing; }
    private drag_start_camera!: Camera3;
    private drag_start_global_position: Vector3 = Vector3.new;
    private drag_start_mouse_position_normalized: Vector2 = Vector2.new;

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && event instanceof MouseButtonInputEvent) {
            // drag
            if (event.button === MouseButton.Middle) {
                if (!this._is_grabbing) {
                    if (event.pressed) {
                        this.is_grabbing = true;
                        this.update_GrabStart(event);
                        event.mark_Cancelled();
                    }
                }
                else if (event.pressed === false) {
                    this.is_grabbing = false;
                }
            }
        }
        // mouse exit
        if (!propagate && event instanceof MouseEnterLeaveInputEvent) {
            if (this.is_grabbing && !event.inside) {
                this.is_grabbing = false;
            }
        }
        // drag
        if (!propagate && event instanceof MouseMotionInputEvent) {
            if (this._is_grabbing) {
                if (event.ctrl) {
                    if (this._is_grabbing_rotate) {
                        this.update_GrabStart(event);
                    }
                    this._is_grabbing_rotate = false;
                    this.pan(event.get_PositionNormalized(OrbitCamera3D.#tmp_vector2_0));
                }
                else {
                    this._is_grabbing_rotate = true;
                    this.rotate((event.get_Relative(OrbitCamera3D.#tmp_vector2_0)));
                }
                event.mark_Cancelled();
            }
        }
        if (!propagate && event instanceof ActionInputEvent && event.pressed) {
            // zoom
            if (event.action === 'zoomIn') {
                this.zoom(true, this.get_Viewport()?.get_Input().is_KeyPressed('Control') ?? false);
                event.mark_Cancelled();
            }
            else if (event.action === 'zoomOut') {
                this.zoom(false, this.get_Viewport()?.get_Input().is_KeyPressed('Control') ?? false);
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_TopView') {
                this.set_Rotation(0, -Math.PI / 2, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_BottomView') {
                this.set_Rotation(0, Math.PI / 2, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_LeftView') {
                this.set_Rotation(-Math.PI / 2, 0, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_RightView') {
                this.set_Rotation(Math.PI / 2, 0, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_FrontView') {
                this.set_Rotation(0, 0, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_BackView') {
                this.set_Rotation(Math.PI, 0, true);
                this.set_Fov(0, true);
                this.is_grabbing = false;
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_CameraType') {
                if (this.is_fov_tween_finished) {
                    this.set_Fov(this.is_orthographic ? this.perspective_fov : 0, true);
                    event.mark_Cancelled();
                }
            }
            else if (event.action === 'switch_CameraTypeOrth') {
                this.set_Fov(0, true);
                event.mark_Cancelled();
            }
            else if (event.action === 'switch_CameraTypePersp') {
                this.set_Fov(this.perspective_fov, true);
                event.mark_Cancelled();
            }
        }
    }

    private update_GrabStart(evt: MouseInputEvent) {
        this.drag_start_camera = this.camera.get_Camera().clone();
        this.get_GlobalPosition(this.drag_start_global_position);
        evt.get_PositionNormalized(this.drag_start_mouse_position_normalized);
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

    private zoom(zoom_in: boolean, zoom_to_cursor: boolean) {
        if (!this.zoom_enable) return;

        if (this.zoom_tween !== undefined) {
            this.get_SceneTree()?.stop_Tween(this.zoom_tween);
            this.camera.zoom = this.target_zoom;
        }

        const target = this.target_zoom;
        const zoom_delta = clamp(this.zoom_delta * target, this.min_zoom_delta, this.max_zoom_delta);
        const new_target = zoom_in ? clamp(target + zoom_delta, this.min_zoom, this.max_zoom) : clamp(target - zoom_delta, this.min_zoom, this.max_zoom);
        this.target_zoom = new_target;

        const current_zoom = this.camera.zoom;

        const zoom_tween = false && zoom_to_cursor && this.zoom_to_cursor ?
            new MethodTween(v => {
                const zoom = current_zoom + (new_target - current_zoom) * v;
                const mouse_inside = this.get_Viewport()?.get_Input().is_mouse_inside ?? false;
                const mouse_position_normalized = this.get_Viewport()?.get_Input().mouse_position_normalized;
                if (mouse_inside && mouse_position_normalized !== undefined) {
                    const camera = this.get_Viewport()?.get_Camera3D();
                    if (camera !== undefined) {
                        const cam = camera.get_Camera();
                        const dir = this.camera_arm.to_Global(Vector3.create(0, 0, 1), Vector3.new);
                        dir.sub(dir, this.global_position);
                        dir.normalize(dir);
                        const plane = Plane3.new.set_PointAndNormal(this.global_position, dir);
                        const ray = cam.project_Ray(Vector2.create(0, 0), undefined, Ray3.new);
                        const center = plane.intersect_UncappedRay(ray, Vector3.new);
                        const ray_mouse = cam.project_Ray(mouse_position_normalized, undefined, Ray3.new);
                        const mouse = plane.intersect_UncappedRay(ray_mouse, Vector3.new);
                        if (center !== undefined && mouse !== undefined) {
                            const delta = Vector3.new.sub(mouse, center)
                            delta.mult_Number(delta, 1 - this.camera.zoom / zoom);
                            this.set_Position(OrbitCamera3D.#tmp_vector3_0.add(this.local_position, OrbitCamera3D.#tmp_vector3_1.set(delta.x, delta.y, delta.z)), false);
                        }
                    }
                }
                this.camera.zoom = zoom;
            }, this.zoom_duration, TweenTransitionType.Quad, TweenEasingType.Out) :
            new PropertyTween(this.camera, 'zoom', new_target, this.zoom_duration, TweenTransitionType.Quad, TweenEasingType.Out);

        this.zoom_tween = zoom_tween;
        this.get_SceneTree()?.start_Tween(this.zoom_tween);
    }

    public set_Zoom(zoom: number, animate: boolean = false) {
        if (!this.zoom_enable) return;

        if (this.zoom_tween !== undefined) {
            this.get_SceneTree()?.stop_Tween(this.zoom_tween);
            this.camera.zoom = this.target_zoom;
        }

        this.target_zoom = zoom;
        if (animate) {
            const zoom_tween = new PropertyTween(this.camera, 'zoom', this.target_zoom, this.zoom_duration, TweenTransitionType.Quad, TweenEasingType.Out);
            this.zoom_tween = zoom_tween;
            this.get_SceneTree()?.start_Tween(this.zoom_tween);
        }
        else {
            this.camera.zoom = this.target_zoom;
        }
    }

    // rotate
    public rotate_strength: number = 0.0075;

    private rotate(relative: Vector2) {
        if (!this.rotate_enable) return;
        const { x, y } = relative;
        this.set_Rotation(this.direction - x * this.rotate_strength, this.yaw - y * this.rotate_strength);
    }

    private pan(position_normalized: Vector2) {
        if (!this.pan_enable) return;

        const dir = this.drag_start_camera.unproject_Normal(OrbitCamera3D.#tmp_vector2_1.set(0, 0), OrbitCamera3D.#tmp_vector3_0);
        const plane = OrbitCamera3D.#tmp_plane3_0.set_PointAndNormal(this.drag_start_global_position, dir);
        const ray = this.drag_start_camera.project_Ray(this.drag_start_mouse_position_normalized, undefined, OrbitCamera3D.#tmp_ray3_0);
        const result = plane.intersect_UncappedRay(ray, OrbitCamera3D.#tmp_vector3_0);
        const ray2 = this.drag_start_camera.project_Ray(position_normalized, undefined, OrbitCamera3D.#tmp_ray3_0);
        const result2 = plane.intersect_UncappedRay(ray2, OrbitCamera3D.#tmp_vector3_1);
        if (result === undefined || result2 === undefined) return;

        const shift = result2.sub(result2, result);
        this.set_Position(OrbitCamera3D.#tmp_vector3_0.sub(this.drag_start_global_position, shift));
    }

    // transform
    private rotate_tween: TweenParallel | undefined = undefined;
    private get is_rotate_tween_finished() { return this.rotate_tween === undefined || this.rotate_tween.finished; }
    public transform_duration = 0.15;

    public set_Rotation(direction: number, yaw: number, animate: boolean = false) {
        direction = direction;
        yaw = clamp(yaw % Tau, -Math.PI / 2, Math.PI / 2);
        if (!animate) {
            this.direction = direction;
            this.yaw = yaw;
        }
        else {
            if (this.rotate_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.rotate_tween);
            }
            this.rotate_tween = new TweenParallel([
                new PropertyTween(this, 'direction', direction, this.transform_duration, TweenTransitionType.Quad, TweenEasingType.Out),
                new PropertyTween(this, 'yaw', yaw, this.transform_duration, TweenTransitionType.Quad, TweenEasingType.Out),
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
            this.fov_tween = new PropertyTween(this.camera, 'fov', fov, this.transform_duration, TweenTransitionType.Quad, TweenEasingType.Out);
            this.get_SceneTree()?.start_Tween(this.fov_tween);
        }
    }

    private position_tween: PropertyTween<OrbitCamera3D, 'local_position', Vector3> | undefined = undefined;
    private get is_position_tween_finished() { return this.position_tween === undefined || this.position_tween.finished; }

    public set_Position(position: Vector3, animate: boolean = false) {
        if (!animate) {
            this.local_position = position;
        }
        else {
            if (this.position_tween !== undefined) {
                this.get_SceneTree()?.stop_Tween(this.position_tween);
            }
            this.position_tween = new PropertyTween(this, 'local_position', position.clone(), this.transform_duration, TweenTransitionType.Quad, TweenEasingType.Out);
            this.get_SceneTree()?.start_Tween(this.position_tween);
        }
    }
}