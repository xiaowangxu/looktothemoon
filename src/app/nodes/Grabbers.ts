import { InputEvent, MouseButton, MouseButtonInputEvent, MouseEnterLeaveInputEvent, MouseInputEvent, MouseMotionInputEvent } from "@/system/engine/InputEvent";
import { EPSILON, clamp, get_ClosestPointsOnLines } from "@/system/engine/MathF";
import { Node3D, NodeNotification } from "@/system/engine/SceneTree";
import { FixSizeNode3D } from "@/system/engine/nodes/node_3ds/FixSizeNode3D";
import { PickingArea3D } from "@/system/engine/nodes/physics_3ds/PickingArea3D";
import { PickingShape3D } from "@/system/engine/nodes/physics_3ds/PickingShape3D";
import { MeshInstance3D } from "@/system/engine/nodes/visual_instances/MeshInstance3D";
import { PolyLineGeometryResource, ThreeGeometryResource } from "@/system/engine/resources/GeometryResource";
import { LineMaterialResource, ThreeMaterialResource } from "@/system/engine/resources/MaterialResource";
import { PickingCylinderResource, PickingSphereResource } from "@/system/engine/resources/PickingShapeResource";
import { Vector3, ConeGeometry, MeshMatcapMaterial, MeshBasicMaterial, SphereGeometry, CylinderGeometry, Color, Euler, Quaternion, Line3, Ray, Raycaster, Plane } from 'three';
import { SignalEmitter } from '@/system/utils/SignalEmitter';

export class GrabberElement<T> extends FixSizeNode3D {
    // signals
    public readonly signal_grab_start: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T, target: GrabberElement<T>) => void> = new SignalEmitter();

    private _enabled: boolean = true;
    public get enabled() { return this._enabled; }
    public set enabled(enabled: boolean) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;
            this.on_EnabledChanged();
        }
    }

    private _visible: boolean = true;
    public get visible() { return this._visible; }
    public set visible(visible: boolean) {
        if (this._visible !== visible) {
            this._visible = visible;
            this.on_VisibleChanged();
        }
    }

    protected on_EnabledChanged() {
        throw new Error('abstract method');
    }

    protected on_VisibleChanged() {
        throw new Error('abstract method');
    }
}

export class LineGrabber extends GrabberElement<Vector3> {
    private readonly grabber: MeshInstance3D = new MeshInstance3D();
    private readonly line: MeshInstance3D = new MeshInstance3D();
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();
    private readonly material: ThreeMaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: 0xf82d4e, transparent: true, depthTest: false, depthWrite: false }));
    private readonly guide_line: MeshInstance3D = new MeshInstance3D();
    private readonly guide_line2: MeshInstance3D = new MeshInstance3D();
    private readonly guide_material: LineMaterialResource = new LineMaterialResource();

    private _length: number = 1;
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
        this.line.local_scale = new Vector3(1, this.length, 1);
        this.line.local_position = new Vector3(0, this.length / 2 + this.offset_length, 0);
        this.grabber.local_position = new Vector3(0, this.length + this.offset_length + 0.1, 0);
        this.guide_line.local_position = new Vector3(0, this.length + this.offset_length + 0.2, 0);
        this.guide_line2.local_position = new Vector3(0, this.offset_length, 0);
        this.area.local_position = new Vector3(0, this.offset_length * 2, 0);
        this.area.local_scale = new Vector3(1, this.length + 0.2 - this.offset_length, 1);
    }

    public _direction: Vector3 = new Vector3(0, 1, 0);
    public get direction() { return this._direction.clone(); }
    public set direction(direction: Vector3) {
        direction = direction.normalize();
        if (direction.length() < EPSILON) return;
        this._direction.copy(direction);
        this.global_rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this._direction));
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

    private readonly _color: Color = new Color(0xf82d4e);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.update_Visual();
    }

    protected on_VisibleChanged(): void {
        this.on_EnabledChanged();
        this.guide_line.local_visible = this.guide_line2.local_visible = this.visible && this.is_grabbing;
        this.grabber.local_visible = this.line.local_visible = this.visible;
    }

    protected on_EnabledChanged(): void {
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

    private update_Visual() {
        if (this.is_hovering) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.guide_line.local_visible = false;
            this.guide_line2.local_visible = false;
        }
        else if (this.is_grabbing) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.guide_line.local_visible = true;
            this.guide_line2.local_visible = true;
        }
        else {
            (this.material.get_Material() as MeshBasicMaterial).color = this.color;
            this.guide_line.local_visible = false;
            this.guide_line2.local_visible = false;
        }
        this.guide_material.color = this.color;
    }

    private update_Opacity() {
        const camera = this.get_SceneTree()?.get_ActiveViewports()[0]?.get_Camera3D();
        if (camera === undefined || this.is_grabbing) {
            this.material.get_Material().opacity = 1.0;
            this.visual_enabled = true;
            return;
        }
        else {
            const a = this.grabber.global_position.project(camera.get_Camera());
            const b = this.global_position.project(camera.get_Camera());
            const distance = a.distanceTo(b);
            const opactiy = (clamp(distance * 8, 0.1, 0.35) - 0.1) * 4;
            this.material.get_Material().opacity = opactiy;
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
        this.unit_pixel_count = 75;

        this.line.visual_layer = 1;
        this.grabber.visual_layer = 1;
        this.guide_line.visual_layer = 1;
        this.guide_line2.visual_layer = 1;

        this.line.geometry = new ThreeGeometryResource(new CylinderGeometry(0.0125, 0.0125, 1));
        this.line.material = this.material;

        const grabber_geometry = new ThreeGeometryResource(new ConeGeometry(0.065, 0.2));
        this.grabber.geometry = grabber_geometry;
        this.grabber.material = this.material;

        const picking_shape = new PickingCylinderResource();
        picking_shape.radius = 0.1;
        this.shape.shape = picking_shape;

        // const test_shape = new MeshInstance3D();
        // test_shape.geometry = new ThreeGeometryResource(new CylinderGeometry(0.1, 0.1, 1));
        // test_shape.material = new ThreeMaterialResource(new MeshMatcapMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }));
        // this.shape.add_Child(test_shape);

        const guide_line_geometry = new PolyLineGeometryResource();
        guide_line_geometry.points = [new Vector3(0, 0, 0), new Vector3(0, 1, 0)];
        guide_line_geometry.compute_LineDistances();
        this.guide_material.transparent = true;
        this.guide_material.opacity = 0.5;
        this.guide_material.color = this.color;
        this.guide_material.width = 1.5;
        this.guide_material.get_Material().depthTest = false;
        this.guide_material.get_Material().depthWrite = false;

        this.guide_line.geometry = guide_line_geometry;
        this.guide_line.material = this.guide_material;
        this.guide_line2.geometry = guide_line_geometry;
        this.guide_line2.material = this.guide_material;
        this.guide_line.local_visible = false;
        this.guide_line2.local_visible = false;

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

        this.add_Child(this.line);
        this.add_Child(this.grabber);
        this.add_Child(this.guide_line);
        this.add_Child(this.guide_line2);
        this.add_Child(this.area);
        this.area.add_Child(this.shape);

        this.shape.local_position = new Vector3(0, 0.5, 0);
        this.guide_line.local_scale = new Vector3(1, 10000, 1);
        this.guide_line2.local_scale = new Vector3(1, 10000, 1);
        this.guide_line2.local_rotation = new Euler(Math.PI, 0, 0);

        this.update_Transform();
    }

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && this.is_grabbing) {
            if (event instanceof MouseButtonInputEvent) {
                if (event.button === MouseButton.Left) {
                    if (event.pressed === false) {
                        this.on_EndGrab();
                    }
                }
            }
            // mouse exit
            else if (event instanceof MouseEnterLeaveInputEvent) {
                if (!event.inside) {
                    this.on_EndGrab();
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

    private readonly drag_offset_position: Vector3 = new Vector3();
    private drag_offset_scale: number = 1;

    private on_BeginGrab(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnLine(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        this.drag_offset_position.copy(this.global_position.sub(position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Canceled();
        this.signal_grab_start.trigger(this.global_position, this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnLine(evt);
        if (position === undefined) return;
        const scale = this.local_scale.y;
        const new_global_position = position.addScaledVector(this.drag_offset_position, scale / this.drag_offset_scale);
        this.global_position = new_global_position;
        evt.mark_Canceled();
        this.signal_grabbing.trigger(this.global_position, this);
    }

    private on_EndGrab() {
        this.is_grabbing = false;
        this.signal_grab_end.trigger(this.global_position, this);
    }

    private get_MousePositionOnLine(evt: MouseInputEvent) {
        const camera = evt.viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return undefined;
        const l0 = new Line3(this.global_position.addScaledVector(this.direction, -10000), this.global_position.addScaledVector(this.direction, 10000));
        const raycast = new Raycaster()
        raycast.setFromCamera(evt.position_normalized, camera);
        const l1 = new Line3(raycast.ray.origin, raycast.ray.origin.clone().addScaledVector(raycast.ray.direction, 100000));
        const [p0, _] = get_ClosestPointsOnLines(l0, l1);
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

export class PointGrabber extends GrabberElement<Vector3> {
    private readonly grabber: MeshInstance3D = new MeshInstance3D();
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();
    private readonly material: ThreeMaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: 0xf82d4e, transparent: true, depthTest: false, depthWrite: false }));

    private _radius: number = 0.1;
    public get radius() { return this._radius; }
    public set radius(radius: number) {
        if (this._radius !== radius) {
            this._radius = radius;
            this.update_Transform();
        }
    }

    private update_Transform() {
        this.grabber.local_scale = new Vector3(this.radius, this.radius, this.radius);
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

    private readonly _color: Color = new Color(0xf82d4e);
    public get color() { return this._color.clone(); }
    public set color(color: Color) {
        this._color.copy(color);
        this.update_Visual();
    }

    protected on_VisibleChanged(): void {
        this.on_EnabledChanged();
        this.grabber.local_visible = this.visible;
    }

    protected on_EnabledChanged(): void {
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

    private update_Visual() {
        if (this.is_hovering) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
        }
        else if (this.is_grabbing) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
        }
        else {
            (this.material.get_Material() as MeshBasicMaterial).color = this.color;
        }
    }

    constructor() {
        super();
        this.unit_pixel_count = 75;

        this.grabber.visual_layer = 1;

        const grabber_geometry = new ThreeGeometryResource(new SphereGeometry(1));
        this.grabber.geometry = grabber_geometry;
        this.grabber.material = this.material;

        const picking_shape = new PickingSphereResource();
        picking_shape.radius = 1.3;
        this.shape.shape = picking_shape;

        // const test_shape = new MeshInstance3D();
        // test_shape.geometry = new ThreeGeometryResource(new SphereGeometry(1.3));
        // test_shape.material = new ThreeMaterialResource(new MeshMatcapMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }));
        // this.shape.add_Child(test_shape);

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

        this.add_Child(this.grabber);
        this.grabber.add_Child(this.area);
        this.area.add_Child(this.shape);

        this.update_Transform();
    }

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && this.is_grabbing) {
            if (event instanceof MouseButtonInputEvent) {
                if (event.button === MouseButton.Left) {
                    if (event.pressed === false) {
                        this.on_EndGrab();
                    }
                }
            }
            // mouse exit
            else if (event instanceof MouseEnterLeaveInputEvent) {
                if (!event.inside) {
                    this.on_EndGrab();
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

    private readonly drag_offset_position: Vector3 = new Vector3();
    private drag_offset_scale: number = 1;

    private on_BeginGrab(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        this.drag_offset_position.copy(this.global_position.sub(position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Canceled();
        this.signal_grab_start.trigger(this.global_position, this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        const scale = this.local_scale.y;
        const new_global_position = position.addScaledVector(this.drag_offset_position, scale / this.drag_offset_scale);
        this.global_position = new_global_position;
        evt.mark_Canceled();
        this.signal_grabbing.trigger(this.global_position, this);
    }

    private on_EndGrab() {
        console.log(">>>>>");
        this.is_grabbing = false;
        this.signal_grab_end.trigger(this.global_position, this);
    }

    private get_MousePositionOnPlane(evt: MouseInputEvent) {
        const camera_3d = evt.viewport?.get_Camera3D();
        const camera = camera_3d?.get_Camera();
        if (camera_3d === undefined || camera === undefined) return undefined;
        const plane = new Plane().setFromNormalAndCoplanarPoint(camera_3d.global_position.sub(camera_3d.to_Global(new Vector3(0, 0, -1))).normalize(), this.global_position);
        const raycast = new Raycaster()
        raycast.setFromCamera(evt.position_normalized, camera);
        const l = new Line3(raycast.ray.origin, raycast.ray.origin.clone().addScaledVector(raycast.ray.direction, 100000));
        const point = plane.intersectLine(l, new Vector3());
        if (point === null) return undefined;
        return point;
    }
}

export class Grabbers<T> extends Node3D {
    public readonly signal_grab_start: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grabbing: SignalEmitter<(value: T) => void> = new SignalEmitter();
    public readonly signal_grab_end: SignalEmitter<(value: T) => void> = new SignalEmitter();
}

export class TranslateGrabber extends Grabbers<Vector3> {
    private readonly axis_x_grabber: LineGrabber = new LineGrabber();
    private readonly axis_y_grabber: LineGrabber = new LineGrabber();
    private readonly axis_z_grabber: LineGrabber = new LineGrabber();
    private readonly center_grabber: PointGrabber = new PointGrabber();

    constructor() {
        super();

        const red = 0xff4a56;
        const green = 0x04b973;
        const blue = 0x466fd6;
        const grey = 0x606060;

        this.axis_x_grabber.direction = new Vector3(1, 0, 0);
        this.axis_x_grabber.color = new Color(red);
        this.axis_x_grabber.length = 0.7;
        this.axis_x_grabber.offset_length = 0.175;

        this.axis_y_grabber.direction = new Vector3(0, 1, 0);
        this.axis_y_grabber.color = new Color(green);
        this.axis_y_grabber.length = 0.7;
        this.axis_y_grabber.offset_length = 0.175;

        this.axis_z_grabber.direction = new Vector3(0, 0, 1);
        this.axis_z_grabber.color = new Color(blue);
        this.axis_z_grabber.length = 0.7;
        this.axis_z_grabber.offset_length = 0.175;

        this.center_grabber.radius = 0.075;
        this.center_grabber.color = new Color(grey);

        this.add_Child(this.axis_x_grabber);
        this.add_Child(this.axis_y_grabber);
        this.add_Child(this.axis_z_grabber);
        this.add_Child(this.center_grabber);

        this.axis_x_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_y_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.axis_y_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.axis_z_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_y_grabber.visible = false;
            this.center_grabber.enabled = false;
            this.signal_grab_start.trigger(position);
        });
        this.center_grabber.signal_grab_start.connect((position: Vector3) => {
            this.axis_x_grabber.visible = false;
            this.axis_y_grabber.visible = false;
            this.axis_z_grabber.visible = false;
            this.signal_grab_start.trigger(position);
        });

        const grabbing = (position: Vector3, target: GrabberElement<Vector3>) => {
            if (target !== this.center_grabber) {
                this.center_grabber.global_position = position;
            }
            this.signal_grabbing.trigger(position);
        }
        this.axis_x_grabber.signal_grabbing.connect(grabbing);
        this.axis_y_grabber.signal_grabbing.connect(grabbing);
        this.axis_z_grabber.signal_grabbing.connect(grabbing);
        this.center_grabber.signal_grabbing.connect(grabbing);

        const grab_end = (position: Vector3) => {
            this.global_position = position;
            this.axis_x_grabber.local_position = new Vector3(0, 0, 0);
            this.axis_y_grabber.local_position = new Vector3(0, 0, 0);
            this.axis_z_grabber.local_position = new Vector3(0, 0, 0);
            this.center_grabber.local_position = new Vector3(0, 0, 0);
            this.axis_x_grabber.visible = true;
            this.axis_y_grabber.visible = true;
            this.axis_z_grabber.visible = true;
            this.center_grabber.enabled = true;
            this.center_grabber.visible = true;
            this.signal_grab_end.trigger(position);
        }
        this.axis_x_grabber.signal_grab_end.connect(grab_end);
        this.axis_y_grabber.signal_grab_end.connect(grab_end);
        this.axis_z_grabber.signal_grab_end.connect(grab_end);
        this.center_grabber.signal_grab_end.connect(grab_end);
    }
}