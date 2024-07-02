import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { GrabberElement3D } from "./Grabber3D";
import { MeshInstance3D } from "../../visual_instance3ds/geometry3ds/MeshInstance3D";
import { Color } from "@/system/fivepebble/graphics/Color";
import { clamp, is_ApproxEqual } from "@/system/fivepebble/Scalar";
import { Cacher } from "@/system/utils/Cacher";
import { Ref, RefCacher } from "@/system/utils/RefCounted";
import type { InputEvent } from "@/system/engine/inputs/InputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButtonInputEvent";
import { MouseEnterLeaveInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { MouseMotionInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseMotionInputEvent";
import type { MouseInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseInputEvent";
import { NodeNotification } from "../../../Node";
import { PickingArea3D } from "../../physics3ds/PickingArea3D";
import { PickingShape3D } from "../../physics3ds/PickingShape3D";
import { PickingCylinderResource } from "@/system/engine/resources/picking_shape_resources/PickingCylinderResource";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { out } from "@/system/utils/Type";
import { CylinderGeometry3DResource } from "@/system/engine/resources/geometry_resources/geometry3d_resources/CylinderGeometry3DResource";
import { GrabberMaterial3DResource } from "./GrabberMaterial3DResource";

const ArrowTailGeometry = new RefCacher(() => {
    const geometry = new CylinderGeometry3DResource();
    geometry.option = {
        top_radius: 0.024,
        bottom_radius: 0.024,
        height: 1,
        segments: 16,
    };
    return geometry;
});

const ArrowHeadGeometry = new RefCacher(() => {
    const geometry = new CylinderGeometry3DResource();
    geometry.option = {
        top_radius: 0.01,
        bottom_radius: 0.1,
        height: 0.28,
        segments: 16,
    };
    return geometry;
});

const LineGrabberPickingShape = new RefCacher(() => {
    const picking_shape = new PickingCylinderResource();
    picking_shape.radius = 0.12;
    return picking_shape;
});

export class LineGrabber3D extends GrabberElement3D<Vector3> {

    static readonly #tmp_vector3_0 = Vector3.new;

    private readonly arrow_tail: MeshInstance3D = new MeshInstance3D();
    private readonly arrow_head: MeshInstance3D = new MeshInstance3D();
    private readonly arrow_material: Ref<GrabberMaterial3DResource> = new Ref(new GrabberMaterial3DResource());
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();

    private _length: number = 0.7;
    public get length() { return this._length; }
    public set length(length: number) {
        if (this._length !== length) {
            this._length = length;
            this.update_Transform();
        }
    }

    private _offset_length: number = 0.25;
    public get offset_length() { return this._offset_length; }
    public set offset_length(offset_length: number) {
        if (this._offset_length !== offset_length) {
            this._offset_length = offset_length;
            this.update_Transform();
        }
    }

    private _area_offset_length: number = 0.4;
    public get area_offset_length() { return this._area_offset_length; }
    public set area_offset_length(area_offset_length: number) {
        if (this._area_offset_length !== area_offset_length) {
            this._area_offset_length = area_offset_length;
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

    private readonly _color: Color = Color.color8(0xf8, 0x2d, 0x4e);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.update_Visual();
    }

    private readonly _highlight_color: Color = Color.color8code(0xFF8400FF);
    public get highlight_color() { return this._highlight_color.clone(); }
    public set highlight_color(highlight_color: Color) {
        this._highlight_color.copy(highlight_color);
        this.update_Visual();
    }

    protected on_VisibleChanged(): void {
        this.on_EnabledChanged();
        this.arrow_head.local_visible = this.arrow_tail.local_visible = this.visible;
    }

    protected on_EnabledChanged(): void {
        if (this.is_grabbing) this.on_EndGrab();
        this.area.enabled = this.enabled && this.visual_enabled && this.visible;
    }

    protected on_LayerChanged(): void {
        this.arrow_tail.layer = this._layer;
        this.arrow_head.layer = this._layer;
    }

    protected on_RenderQueueChanged(): void {
        this.arrow_tail.render_queue = this._render_queue;
        this.arrow_head.render_queue = this._render_queue;
    }

    private _visual_enabled: boolean = true;
    public get visual_enabled() { return this._visual_enabled; }
    private set visual_enabled(enabled: boolean) {
        if (this._visual_enabled !== enabled) {
            this._visual_enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private update_Transform() {
        const ArrowHeadHeight = 0.27;
        this.arrow_tail.local_scale = Vector3.create(1, this.length, 1);
        this.arrow_tail.local_position = Vector3.create(0, this.length / 2 + this.offset_length, 0);
        this.arrow_head.local_position = Vector3.create(0, this.length + this.offset_length + ArrowHeadHeight / 2, 0);
        const area_total_length = this.offset_length + this.length + ArrowHeadHeight - this.area_offset_length;
        this.area.local_position = Vector3.create(0, this.area_offset_length + area_total_length / 2, 0);
        this.area.local_scale = Vector3.create(1, area_total_length, 1);
    }

    private readonly visual_color: Color = Color.color8(0xf8, 0x2d, 0x4e);
    private visual_opacity: number = 1.0;

    private update_Visual() {
        if (this.is_hovering) {
            this.visual_color.set(this._highlight_color.r, this._highlight_color.g, this._highlight_color.b, this._highlight_color.a * this.visual_opacity);
        }
        else if (this.is_grabbing) {
            this.visual_color.set(this._highlight_color.r, this._highlight_color.g, this._highlight_color.b, this._highlight_color.a * this.visual_opacity);
        }
        else {
            this.visual_color.set(this._color.r, this._color.g, this._color.b, this._color.a * this.visual_opacity);
        }
        this.arrow_material.expect.color = this.visual_color;
    }

    private update_Opacity() {
        const viewport = this.get_RelativeViewport();
        const camera = this.get_RelativeCamera3D();
        if (viewport === undefined || camera === undefined || this.is_grabbing) {
            this.visual_opacity = 1;
            this.visual_color.set(this.visual_color.r, this.visual_color.g, this.visual_color.b, this.visual_opacity);
            this.arrow_material.expect.color = this.visual_color;
            this.arrow_head.local_visible = true;
            this.visual_enabled = true;
            return;
        }
        else {
            const cam = camera.get_Camera();
            const size = viewport.size;
            const a = cam.project_Point(this.arrow_head.global_position, Vector2.new);
            a.mult(a, size); // new Vector3().fromArray(this.arrow_head.global_position.array).project(cam);
            const b = cam.project_Point(this.global_position, Vector2.new);
            b.mult(b, size); //new Vector3().fromArray(this.global_position.array).project(cam);
            const distance = a.distance_to(b) / 150;
            const opactiy = (clamp(distance, 0.1, 0.35) - 0.1) * 4;
            this.visual_opacity = is_ApproxEqual(opactiy, 1) ? 1 : opactiy;
            this.visual_color.set(this.visual_color.r, this.visual_color.g, this.visual_color.b, this.visual_opacity);
            this.arrow_material.expect.color = this.visual_color;
            if (opactiy < 0.4) {
                this.visual_enabled = false;
            }
            else {
                this.visual_enabled = true;
            }
            return;
        }
    }

    constructor() {
        super();

        this.arrow_tail.geometry = ArrowTailGeometry.get();
        this.arrow_head.geometry = ArrowHeadGeometry.get();
        this.arrow_tail.material = this.arrow_head.material = this.arrow_material.expect;
        this.on_RenderQueueChanged();

        this.shape.shape = LineGrabberPickingShape.get();

        this.area.signal_mouse_entered.connect(() => {
            this.is_hovering = true;
        });
        this.area.signal_mouse_exited.connect(() => {
            this.is_hovering = false;
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

        this.add_Child(this.arrow_tail);
        this.add_Child(this.arrow_head);
        this.add_Child(this.area);
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
        const position = this.get_MousePositionOnLine(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        this.drag_global_position.copy(this.global_position);
        this.drag_offset_position.copy(LineGrabber3D.#tmp_vector3_0.sub(this.global_position, position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Cancelled();
        this.signal_grab_start.trigger(this.global_position.clone(), this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnLine(evt);
        if (position === undefined) return;
        const scale = this.local_scale.y;
        const new_global_position = LineGrabber3D.#tmp_vector3_0.add_Scaled(position, scale / this.drag_offset_scale, this.drag_offset_position);
        this.global_position = new_global_position;
        evt.mark_Cancelled();
        this.signal_grabbing.trigger(this.global_position.clone(), this);
    }

    private on_EndGrab() {
        this.is_grabbing = false;
        this.signal_grab_end.trigger(this.global_position.clone(), this);
    }

    private get_MousePositionOnLine(evt: MouseInputEvent) {
        const camera = evt.viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return undefined;
        const dir = this.to_Global(new Vector3(0, 1, 0), Vector3.new);
        dir.sub(dir, this.global_position);
        dir.normalize(dir);
        const r0 = new Ray3(this.global_position, dir);
        const r1 = camera.project_Ray(evt.position_normalized, undefined, Ray3.new);
        const p0 = out<number>(), p1 = out<number>();
        r0.get_UncappedClosestParametersWithUncappedRay(r1, p0, p1);
        return r0.get_Point(p0.value, Vector3.new);
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                // call FixSizeNode3D first
                super._notification(what);
                this.update_Opacity();
                break;
            }
            default: {
                super._notification(what);
                break;
            }
        }
    }
}
