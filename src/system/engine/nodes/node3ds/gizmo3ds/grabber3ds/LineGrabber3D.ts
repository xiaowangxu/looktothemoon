import { Vector3, vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { GrabberElement, GrabberPlainColorMaterialResource } from "./Grabber3D";
import { MeshInstance3D } from "../../visual_instance3ds/geometry3ds/MeshInstance3D";
import { color8, type Color } from "@/system/fivepebble/graphics/Color";
import { Epsilon, clamp, is_ApproxEqual } from "@/system/fivepebble/Scalar";
import { Cacher } from "@/system/utils/Cacher";
import { CylinderGeometryResource } from "@/system/engine/resources/geometry_resources/PrimitiveGeometryResource";
import { MaterialOverrideResource } from "@/system/engine/resources/material_resources/MaterialResource";
import { Ref } from "@/system/utils/RefCounted";
import type { InputEvent } from "@/system/engine/inputs/InputEvent";
import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButton";
import { MouseEnterLeaveInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { MouseMotionInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseMotionInputEvent";
import type { MouseInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseInputEvent";
import { NodeNotification } from "../../../Node";
import { PickingArea3D } from "../../physics3ds/PickingArea3D";
import { PickingShape3D } from "../../physics3ds/PickingShape3D";
import { PickingCylinderResource } from "@/system/engine/resources/picking_shape_resources/PickingShapeResource";
import { Ray3 } from "@/system/fivepebble/geometries/Ray3";

const ArrowTailGeometry = new Cacher(() => {
    const geometry = new CylinderGeometryResource();
    geometry.top_radius = geometry.bottom_radius = 0.0175;
    geometry.height = 1;
    geometry.segments = 16;
    geometry.build();
    return new Ref(geometry);
});

const ArrowHeadGeometry = new Cacher(() => {
    const geometry = new CylinderGeometryResource();
    geometry.top_radius = 0;
    geometry.bottom_radius = 0.075;
    geometry.height = 0.25;
    geometry.segments = 16;
    geometry.build();
    return new Ref(geometry);
});

const LineGrabberMaterial = new Cacher(() => new Ref(new GrabberPlainColorMaterialResource()));

const LineGrabberPickingShape = new Cacher(() => {
    const picking_shape = new PickingCylinderResource();
    picking_shape.radius = 0.1;
    return new Ref(picking_shape);
});

export class LineGrabber3D extends GrabberElement<Vector3> {
    private readonly arrow_tail: MeshInstance3D = new MeshInstance3D();
    private readonly arrow_head: MeshInstance3D = new MeshInstance3D();
    private readonly arrow_material: Ref<MaterialOverrideResource> = new Ref(new MaterialOverrideResource());
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();

    // private readonly guide_line: MeshInstance3D = new MeshInstance3D();
    // private readonly guide_line2: MeshInstance3D = new MeshInstance3D();
    // private readonly guide_material: LineMaterialResource = new LineMaterialResource();

    private _length: number = 0.75;
    public get length() { return this._length; }
    public set length(length: number) {
        if (this._length !== length) {
            this._length = length;
            this.update_Transform();
        }
    }

    private _offset_length: number = 0;
    public get offset_length() { return this._offset_length; }
    public set offset_length(offset_length: number) {
        if (this._offset_length !== offset_length) {
            this._offset_length = offset_length;
            this.update_Transform();
        }
    }

    private update_Transform() {
        this.arrow_tail.local_scale = vec3(1, this.length, 1);
        this.arrow_tail.local_position = vec3(0, this.length / 2 + this.offset_length, 0);
        this.arrow_head.local_position = vec3(0, this.length + this.offset_length + 0.1, 0);
        // this.guide_line.local_position = vec3(0, this.length + this.offset_length + 0.2, 0);
        // this.guide_line2.local_position = vec3(0, this.offset_length, 0);
        this.area.local_position = vec3(0, this.offset_length * 2, 0);
        this.area.local_scale = vec3(1, this.length + 0.2 - this.offset_length, 1);
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

    private readonly _color: Color = color8(0xf8, 0x2d, 0x4e);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.update_Visual();
    }

    protected on_VisibleChanged(): void {
        this.on_EnabledChanged();
        // this.guide_line.local_visible = this.guide_line2.local_visible = this.visible && this.is_grabbing;
        this.arrow_head.local_visible = this.arrow_tail.local_visible = this.visible;
    }

    protected on_EnabledChanged(): void {
        if (this.is_grabbing) this.on_EndGrab();
        this.area.enabled = this.enabled && this.visual_enabled && this.visible;
    }

    private _visual_enabled: boolean = true;
    public get visual_enabled() { return this._visual_enabled; }
    private set visual_enabled(enabled: boolean) {
        if (this._visual_enabled !== enabled) {
            this._visual_enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private readonly visual_color: Color = color8(0xf8, 0x2d, 0x4e);
    private visual_opacity: number = 1.0;

    private update_Visual() {
        if (this.is_hovering) {
            this.visual_color.set(0xff / 255, 0xbb / 255, 0x00 / 255, this.visual_opacity);
            this.arrow_material.expect.set_UniformOverride('u_color', this.visual_color);
            // this.guide_line.local_visible = false;
            // this.guide_line2.local_visible = false;
        }
        else if (this.is_grabbing) {
            this.visual_color.set(0xff / 255, 0xbb / 255, 0x00 / 255, this.visual_opacity);
            this.arrow_material.expect.set_UniformOverride('u_color', this.visual_color);
            // this.guide_line.local_visible = this.visible && true;
            // this.guide_line2.local_visible = this.visible && true;
        }
        else {
            this.visual_color.set(this.color.r, this.color.g, this.color.b, this.visual_opacity);
            this.arrow_material.expect.set_UniformOverride('u_color', this.visual_color);
            // this.guide_line.local_visible = false;
            // this.guide_line2.local_visible = false;
        }
        // this.guide_material.color = this.color;
    }

    private update_Opacity() {
        const camera = this.get_SceneTree()?.get_ActiveViewports()[0]?.get_Camera3D();
        if (camera === undefined || this.is_grabbing) {
            this.visual_opacity = 1;
            this.visual_color.set(this.visual_color.r, this.visual_color.g, this.visual_color.b, this.visual_opacity);
            this.arrow_material.expect.set_UniformOverride('u_color', this.visual_color);
            this.arrow_material.expect.material.is_transparent = false;
            this.arrow_head.local_visible = true;
            this.visual_enabled = true;
            return;
        }
        else {
            const cam = camera.get_Camera();
            const a = cam.project_Point(this.arrow_head.global_position); // new Vector3().fromArray(this.arrow_head.global_position.array).project(cam);
            const b = cam.project_Point(this.global_position); //new Vector3().fromArray(this.global_position.array).project(cam);
            const distance = a.distance_to(b);
            const opactiy = (clamp(distance * 8, 0.1, 0.35) - 0.1) * 4;
            this.visual_opacity = opactiy;
            this.visual_color.set(this.visual_color.r, this.visual_color.g, this.visual_color.b, this.visual_opacity);
            this.arrow_material.expect.set_UniformOverride('u_color', this.visual_color);
            this.arrow_material.expect.material.is_transparent = !is_ApproxEqual(this.visual_opacity, 1);
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
        this.top_level = true;
        this.unit_pixel_count = 75;

        this.arrow_tail.render_queue = 1;
        this.arrow_head.render_queue = 1;
        this.arrow_tail.layer = 1;
        this.arrow_head.layer = 1;
        // this.guide_line.layer = 1;
        // this.guide_line2.layer = 1;

        this.arrow_tail.geometry = ArrowTailGeometry.value.expect;
        this.arrow_material.expect.set_OverrideMaterial(LineGrabberMaterial.value.expect);
        this.arrow_head.geometry = ArrowHeadGeometry.value.expect;
        this.arrow_tail.material = this.arrow_head.material = this.arrow_material.expect;

        this.shape.shape = LineGrabberPickingShape.value.expect;
        this.shape.local_position = vec3(0, 0.5, 0);

        // // const test_shape = new MeshInstance3D();
        // // test_shape.geometry = new ThreeGeometryResource(new CylinderGeometry(0.1, 0.1, 1));
        // // test_shape.material = new ThreeMaterialResource(new MeshMatcapMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }));
        // // this.shape.add_Child(test_shape);
        // const guide_line_geometry = new PolyLineGeometryResource();
        // guide_line_geometry.points = [new Vector3(0, 0, 0), new Vector3(0, 1, 0)];
        // guide_line_geometry.compute_LineDistances();
        // this.guide_material.transparent = true;
        // this.guide_material.opacity = 0.5;
        // this.guide_material.color = this.color;
        // this.guide_material.width = 1.5;
        // this.guide_material.get_Material().depthTest = false;
        // this.guide_material.get_Material().depthWrite = false;

        // this.guide_line.geometry = guide_line_geometry;
        // this.guide_line.material = this.guide_material;
        // this.guide_line2.geometry = guide_line_geometry;
        // this.guide_line2.material = this.guide_material;
        // this.guide_line.local_visible = false;
        // this.guide_line2.local_visible = false;

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

        // this.add_Child(this.guide_line);
        // this.add_Child(this.guide_line2);
        // this.guide_line.local_scale = vec3(1, 10000, 1);
        // this.guide_line2.local_scale = vec3(1, 10000, 1);
        // this.guide_line2.local_rotation = euler(Math.PI, 0, 0);

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
                event.mark_Canceled();
            }
            // mouse exit
            else if (event instanceof MouseEnterLeaveInputEvent) {
                if (!event.inside) {
                    this.on_EndGrab();
                    return;
                }
            }
            else {
                event.mark_Canceled();
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
        this.drag_offset_position.copy(this.global_position.sub(position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Canceled();
        this.signal_grab_start.trigger(this.global_position.clone(), this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnLine(evt);
        if (position === undefined) return;
        const scale = this.local_scale.y;
        const new_global_position = position.add_Scaled(scale / this.drag_offset_scale, this.drag_offset_position);
        this.global_position = new_global_position;
        evt.mark_Canceled();
        this.signal_grabbing.trigger(this.global_position.clone(), this);
    }

    private on_EndGrab() {
        this.is_grabbing = false;
        this.signal_grab_end.trigger(this.global_position.clone(), this);
    }

    private get_MousePositionOnLine(evt: MouseInputEvent) {
        const camera = evt.viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return undefined;
        const dir = this.to_Global(new Vector3(0, 1, 0)).sub(this.global_position).normalize();
        const r0 = new Ray3(this.global_position, dir);
        const r1 = camera.project_Ray(evt.position_normalized);
        const [p0, _] = r0.get_ClosestPointsUncapped(r1);
        return p0;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.InternalBeforeRender: {
                this.update_Opacity();
                break;
            }
        }
        super._notification(what);
    }
}
