import { MouseButtonInputEvent, MouseButton } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { MouseEnterLeaveInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import type { MouseInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseInputEvent";
import { MouseMotionInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseMotionInputEvent";
import { PickingSphereResource } from "@/system/engine/resources/picking_shape_resources/PickingShapeResource";
import { PickingArea3D } from "../../physics3ds/PickingArea3D";
import { PickingShape3D } from "../../physics3ds/PickingShape3D";
import { MeshInstance3D } from "../../visual_instance3ds/geometry3ds/MeshInstance3D";
import { GrabberElement3D, GrabberPlainColorMaterialResource } from "./Grabber3D";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Ref } from "@/system/utils/RefCounted";
import { Cacher } from "@/system/utils/Cacher";
import type { Config } from "@/system/engine/ConfiguredObject";
import { Color } from "@/system/fivepebble/graphics/Color";
import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { SphereGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import type { InputEvent } from "@/system/engine/inputs/InputEvent";
import { Plane3 } from "@/system/fivepebble/geometries/Plane3";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";

const PointGeometry = new Cacher((config: Config) => {
    const geometry = new SphereGeometryResource(config);
    geometry.radius = 1.0;
    geometry.build();
    return new Ref(geometry);
});

const PointPickingShape = new Cacher((config: Config) => {
    const picking_shape = new PickingSphereResource(config);
    picking_shape.radius = 1.5;
    return new Ref(picking_shape);
});

export class PointGrabber3D extends GrabberElement3D<Vector3> {

    static readonly #tmp_vector3_0 = Vector3.new;

    private readonly point: MeshInstance3D = new MeshInstance3D(this.config);
    private readonly area: PickingArea3D = new PickingArea3D(this.config);
    private readonly shape: PickingShape3D = new PickingShape3D(this.config);
    private readonly material: Ref<GrabberPlainColorMaterialResource> = new Ref(new GrabberPlainColorMaterialResource(this.config));

    private _radius: number = 0.085;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_Transform();
        }
    }

    private _is_grabbing: boolean = false;
    public get is_grabbing() { return this._is_grabbing; }
    public set is_grabbing(dragging: boolean) {
        if (this._is_grabbing !== dragging) {
            this._is_grabbing = dragging;
            this.update_Visual();
        }
    }

    private _is_hovering: boolean = false;
    public get is_hovering() { return this._is_hovering; }
    public set is_hovering(hovering: boolean) {
        if (this._is_hovering !== hovering) {
            this._is_hovering = hovering;
            this.update_Visual();
        }
    }

    private update_Transform() {
        this.point.local_scale = Vector3.create(this.radius, this.radius, this.radius);
    }

    private readonly _color: Color = new Vector4(0.5, 0.5, 0.5, 1.0);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.update_Visual();
    }

    private readonly _highlight_color: Color = Color.color8(0xff, 0xbb, 0x00).linear_rgb;
    public get highlight_color() { return this._highlight_color.clone(); }
    public set highlight_color(highlight_color: Color) {
        this._highlight_color.copy(highlight_color);
        this.update_Visual();
    }

    protected on_VisibleChanged(): void {
        this.on_EnabledChanged();
        this.point.local_visible = this.visible;
    }

    protected on_EnabledChanged(): void {
        if (this.is_grabbing) this.on_EndGrab();
        this.area.enabled = this.enabled && this.visual_enabled && this.visible;
    }

    protected on_LayerChanged(): void {
        this.point.layer = this._layer;
    }

    protected on_RenderQueueChanged(): void {
        this.point.render_queue = this._render_queue;
    }

    private _visual_enabled: boolean = true;
    public get visual_enabled() { return this._visual_enabled; }
    private set visual_enabled(enabled: boolean) {
        if (this._visual_enabled !== enabled) {
            this._visual_enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private readonly visual_color: Color = Color.color8(0xf8, 0x2d, 0x4e);

    private update_Visual() {
        if (this.is_hovering) {
            this.visual_color.copy(this._highlight_color);
        }
        else if (this.is_grabbing) {
            this.visual_color.copy(this._highlight_color);
        }
        else {
            this.visual_color.copy(this._color);
        }
        this.material.expect.color = this.visual_color;
    }

    constructor(config: Config) {
        super(config);

        this.on_RenderQueueChanged();

        this.point.geometry = PointGeometry.get(this.config).expect;
        this.point.material = this.material.expect;

        this.shape.shape = PointPickingShape.get(this.config).expect;

        this.area.signal_mouse_entered.connect((evt) => {
            this.is_hovering = true;
            this.set_ViewportCursorStyle(evt.viewport!, 'move');
        });
        this.area.signal_mouse_exited.connect((evt) => {
            this.is_hovering = false;
            this.set_ViewportCursorStyle(evt.viewport!, 'default');
        });

        this.area.signal_input.connect((evt, prop) => {
            if (!prop && this.area.is_mouse_hover) {
                if (!this.is_grabbing) {
                    if (evt instanceof MouseButtonInputEvent && evt.button === MouseButton.Left && evt.pressed) {
                        this.on_BeginGrab(evt);
                    }
                }
            }
        });
        this.area.priority = -Infinity;

        this.add_Child(this.point);
        this.point.add_Child(this.area);
        this.area.add_Child(this.shape);

        this.update_Transform();
        this.update_Visual();
    }

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && this.is_grabbing) {
            if (event instanceof MouseButtonInputEvent) {
                if (event.button === MouseButton.Left && event.pressed === false) {
                    this.on_EndGrab();
                    return;
                }
                event.mark_Cancelled();
            }
            // mouse exit
            else if (event instanceof MouseEnterLeaveInputEvent) {
                if (!event.inside) {
                    this.on_EndGrab();
                    return;
                }
            }
            else {
                event.mark_Cancelled();
                if (event instanceof MouseMotionInputEvent) {
                    this.on_Grabbing(event);
                }
            }
        }
    }

    private readonly drag_global_position: Vector3 = new Vector3();
    private readonly drag_offset_position: Vector3 = new Vector3();
    private drag_offset_scale: number = 1;

    private on_BeginGrab(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        this.drag_global_position.copy(this.global_position);
        this.drag_offset_position.copy(PointGrabber3D.#tmp_vector3_0.sub(this.global_position, position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Cancelled();
        this.signal_grab_start.trigger(this.global_position, this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        const scale = this.local_scale.y;
        const new_global_position = PointGrabber3D.#tmp_vector3_0.add_Scaled(position, scale / this.drag_offset_scale, this.drag_offset_position);
        this.global_position = new_global_position;
        evt.mark_Cancelled();
        this.signal_grabbing.trigger(this.global_position, this);
    }

    private on_EndGrab() {
        this.is_grabbing = false;
        this.signal_grab_end.trigger(this.global_position, this);
    }

    private get_MousePositionOnPlane(evt: MouseInputEvent) {
        const camera_3d = evt.viewport?.get_Camera3D();
        const camera = camera_3d?.get_Camera();
        if (camera_3d === undefined || camera === undefined) return undefined;
        const plane = Plane3.new.set_PointAndNormal(this.global_position, Vector3.new.normalize(PointGrabber3D.#tmp_vector3_0.sub(camera_3d.global_position, camera_3d.to_Global(Vector3.create(0, 0, -1), Vector3.new))));
        const ray = camera.project_Ray(evt.position_normalized, undefined, Ray3.new);
        const point = plane.intersect_Ray(ray, Vector3.new);
        if (point === undefined) return undefined;
        return point;
    }
}