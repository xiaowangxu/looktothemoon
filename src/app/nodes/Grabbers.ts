import { MouseButton, MouseButtonInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseButton";
import { MouseMotionInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseMotionInputEvent";
import { MouseEnterLeaveInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseEnterLeaveInputEvent";
import { MouseInputEvent } from "@/system/engine/inputs/events/mouse_events/MouseInputEvent";
import { InputEvent } from "@/system/engine/inputs/InputEvent";
import { Epsilon, Tau, clamp } from "@/system/fivepebble/Scalar";
import { NodeNotification } from "@/system/engine/nodes/Node";
import { type CursorStyle, Viewport } from "@/system/engine/nodes/Node";
import { Node3D } from "@/system/engine/nodes/node3ds/Node3D";
import { FixSizeNode3D } from "@/system/engine/nodes/node3ds/FixSizeNode3D";
import { PickingArea3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingArea3D";
import { PickingShape3D } from "@/system/engine/nodes/node3ds/physics3ds/PickingShape3D";
import { MeshInstance3D } from "@/system/engine/nodes/node3ds/visual_instance3ds/geometry_3ds/MeshInstance3D";
import { PolyLineGeometryResource, ThreeGeometryResource } from "@/system/engine/resources/resources/GeometryResource";
import { LineMaterialResource, ThreeMaterialResource } from "@/system/engine/resources/resources/MaterialResource";
import { PickingBVHResource, PickingCylinderResource, PickingSphereResource } from "@/system/engine/resources/resources/PickingShapeResource";
import { Vector3, ConeGeometry, MeshMatcapMaterial, MeshBasicMaterial, SphereGeometry, CylinderGeometry, Color, Euler, Quaternion, Line3, Vector2, Raycaster, Plane, TorusGeometry, DoubleSide, Ray } from 'three';
import { SignalEmitter } from '@/system/utils/SignalEmitter';
import { vec3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { euler } from "@/system/fivepebble/linear_algebra/Euler";

function get_ClosestPointsOnLineSegmentsParameters(l0: Line3, l1: Line3): [p0: number, p1: number] {
    const p = l0.end.clone().sub(l0.start);
    const q = l1.end.clone().sub(l1.start);
    const r = l0.start.clone().sub(l1.start);

    const a = p.dot(p);
    const b = p.dot(q);
    const c = q.dot(q);
    const d = p.dot(r);
    const e = q.dot(r);

    let s = 0.0;
    let t = 0.0;

    const det = a * c - b * b;
    if (det > Epsilon) {
        // Non-parallel segments
        const bte = b * e;
        const ctd = c * d;

        if (bte <= ctd) {
            // s <= 0.0
            if (e <= 0.0) {
                // t <= 0.0
                s = (-d >= a ? 1 : (-d > 0.0 ? -d / a : 0.0));
                t = 0.0;
            } else if (e < c) {
                // 0.0 < t < 1
                s = 0.0;
                t = e / c;
            } else {
                // t >= 1
                s = (b - d >= a ? 1 : (b - d > 0.0 ? (b - d) / a : 0.0));
                t = 1;
            }
        } else {
            // s > 0.0
            s = bte - ctd;
            if (s >= det) {
                // s >= 1
                if (b + e <= 0.0) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d < a ? -d / a : 1));
                    t = 0.0;
                } else if (b + e < c) {
                    // 0.0 < t < 1
                    s = 1;
                    t = (b + e) / c;
                } else {
                    // t >= 1
                    s = (b - d <= 0.0 ? 0.0 : (b - d < a ? (b - d) / a : 1));
                    t = 1;
                }
            } else {
                // 0.0 < s < 1
                const ate = a * e;
                const btd = b * d;

                if (ate <= btd) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                    t = 0.0;
                } else {
                    // t > 0.0
                    t = ate - btd;
                    if (t >= det) {
                        // t >= 1
                        s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                        t = 1;
                    } else {
                        // 0.0 < t < 1
                        s /= det;
                        t /= det;
                    }
                }
            }
        }
    } else {
        // Parallel segments
        if (e <= 0.0) {
            s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
            t = 0.0;
        } else if (e >= c) {
            s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
            t = 1;
        } else {
            s = 0.0;
            t = e / c;
        }
    }

    return [s, t];
}

function get_ClosestPointsOnLineSegments(l0: Line3, l1: Line3): [p0: Vector3, p1: Vector3] {
    const p = l0.end.clone().sub(l0.start);
    const q = l1.end.clone().sub(l1.start);
    const r = l0.start.clone().sub(l1.start);

    const a = p.dot(p);
    const b = p.dot(q);
    const c = q.dot(q);
    const d = p.dot(r);
    const e = q.dot(r);

    let s = 0.0;
    let t = 0.0;

    const det = a * c - b * b;
    if (det > Epsilon) {
        // Non-parallel segments
        const bte = b * e;
        const ctd = c * d;

        if (bte <= ctd) {
            // s <= 0.0
            if (e <= 0.0) {
                // t <= 0.0
                s = (-d >= a ? 1 : (-d > 0.0 ? -d / a : 0.0));
                t = 0.0;
            } else if (e < c) {
                // 0.0 < t < 1
                s = 0.0;
                t = e / c;
            } else {
                // t >= 1
                s = (b - d >= a ? 1 : (b - d > 0.0 ? (b - d) / a : 0.0));
                t = 1;
            }
        } else {
            // s > 0.0
            s = bte - ctd;
            if (s >= det) {
                // s >= 1
                if (b + e <= 0.0) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d < a ? -d / a : 1));
                    t = 0.0;
                } else if (b + e < c) {
                    // 0.0 < t < 1
                    s = 1;
                    t = (b + e) / c;
                } else {
                    // t >= 1
                    s = (b - d <= 0.0 ? 0.0 : (b - d < a ? (b - d) / a : 1));
                    t = 1;
                }
            } else {
                // 0.0 < s < 1
                const ate = a * e;
                const btd = b * d;

                if (ate <= btd) {
                    // t <= 0.0
                    s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
                    t = 0.0;
                } else {
                    // t > 0.0
                    t = ate - btd;
                    if (t >= det) {
                        // t >= 1
                        s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
                        t = 1;
                    } else {
                        // 0.0 < t < 1
                        s /= det;
                        t /= det;
                    }
                }
            }
        }
    } else {
        // Parallel segments
        if (e <= 0.0) {
            s = (-d <= 0.0 ? 0.0 : (-d >= a ? 1 : -d / a));
            t = 0.0;
        } else if (e >= c) {
            s = (b - d <= 0.0 ? 0.0 : (b - d >= a ? 1 : (b - d) / a));
            t = 1;
        } else {
            s = 0.0;
            t = e / c;
        }
    }

    const p0 = new Vector3().lerpVectors(l0.start, l0.end, s);
    const p1 = new Vector3().lerpVectors(l1.start, l1.end, t);

    return [p0, p1];
}

function get_ClosestPointsOnLineParameter(l: Ray, p: Vector3): number {
    const _p = p.clone().sub(l.origin)
    const n = l.direction;
    const l2 = n.lengthSq();
    if (l2 < Epsilon) {
        return 0; // Both points are the same, just give any.
    }
    const d = n.dot(_p) / l2;
    return d;
}

function get_ClosestPointsOnLine(l: Ray, p: Vector3): Vector3 {
    const _p = p.clone().sub(l.origin)
    const n = l.direction;
    const l2 = n.lengthSq();
    if (l2 < Epsilon) {
        return l.origin.clone(); // Both points are the same, just give any.
    }
    const d = n.dot(_p) / l2;
    return l.origin.clone().addScaledVector(n, d); // Inside.
}

function get_ClosestPointsOnLinesParameters(l0: Ray, l1: Ray): [p0: number, p1: number] {
    const r1 = l0.origin.clone();
    const r2 = l1.origin.clone();
    const e1 = l0.direction.clone();
    const e2 = l1.direction.clone();

    const n = new Vector3().crossVectors(e1, e2);

    if (n.length() < Epsilon) {
        return [0, get_ClosestPointsOnLineParameter(l1, r1)];
    }

    const n_length_sq = n.lengthSq();
    const r = r2.clone().sub(r1);

    const t1 = new Vector3().crossVectors(e2, n).dot(r) / (n_length_sq);
    const t2 = new Vector3().crossVectors(e1, n).dot(r) / (n_length_sq);

    return [t1, t2];
}

function get_ClosestPointsOnLines(l0: Ray, l1: Ray): [p0: Vector3, p1: Vector3] {
    const r1 = l0.origin.clone();
    const r2 = l1.origin.clone();
    const e1 = l0.direction.clone();
    const e2 = l1.direction.clone();

    const n = new Vector3().crossVectors(e1, e2);

    if (n.length() < Epsilon) {
        return [r1, get_ClosestPointsOnLine(l1, r1)];
    }

    const n_length_sq = n.lengthSq();
    const r = r2.clone().sub(r1);

    const t1 = new Vector3().crossVectors(e2, n).dot(r) / (n_length_sq);
    const t2 = new Vector3().crossVectors(e1, n).dot(r) / (n_length_sq);

    return [r1.clone().addScaledVector(e1, t1), r2.clone().addScaledVector(e2, t2)];
}

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

    protected set_ViewportCursorStyle(viewport: Viewport, cursor_style: CursorStyle) {
        viewport.cursor_style = cursor_style;
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
        this.line.local_scale = vec3(1, this.length, 1);
        this.line.local_position = vec3(0, this.length / 2 + this.offset_length, 0);
        this.grabber.local_position = vec3(0, this.length + this.offset_length + 0.1, 0);
        this.guide_line.local_position = vec3(0, this.length + this.offset_length + 0.2, 0);
        this.guide_line2.local_position = vec3(0, this.offset_length, 0);
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

    private update_Visual() {
        if (this.is_hovering) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.guide_line.local_visible = false;
            this.guide_line2.local_visible = false;
        }
        else if (this.is_grabbing) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.guide_line.local_visible = this.visible && true;
            this.guide_line2.local_visible = this.visible && true;
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
            const cam = camera.get_Camera();
            const a = new Vector3().fromArray(this.grabber.global_position.array).project(cam);
            const b = new Vector3().fromArray(this.global_position.array).project(cam);
            const distance = new Vector2(a.x, a.y).distanceTo(new Vector2(b.x, b.y));
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

        this.line.geometry = new ThreeGeometryResource(new CylinderGeometry(0.013, 0.013, 1));
        this.line.material = this.material;

        const grabber_geometry = new ThreeGeometryResource(new ConeGeometry(0.0675, 0.2));
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

        this.shape.local_position = vec3(0, 0.5, 0);
        this.guide_line.local_scale = vec3(1, 10000, 1);
        this.guide_line2.local_scale = vec3(1, 10000, 1);
        this.guide_line2.local_rotation = euler(Math.PI, 0, 0);

        this.update_Transform();
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
        this.drag_global_position.copy(new Vector3().fromArray(this.global_position.array));
        this.drag_offset_position.copy(new Vector3().fromArray(this.global_position.array).sub(position));
        this.drag_offset_scale = this.local_scale.y;
        evt.mark_Canceled();
        this.signal_grab_start.trigger(new Vector3().fromArray(this.global_position.array), this);
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
        const dir = this.to_Global(new Vector3(0, 1, 0)).sub(this.global_position).normalize();
        const r0 = new Ray(this.global_position, dir);
        const raycast = new Raycaster()
        raycast.setFromCamera(evt.position_normalized, camera);
        const r1 = raycast.ray;
        const [p0, _] = get_ClosestPointsOnLines(r0, r1);
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

export class AngleGrabber extends GrabberElement<{ angle: number, relative: number, delta: number }> {
    private readonly grabber: MeshInstance3D = new MeshInstance3D();
    private readonly line: MeshInstance3D = new MeshInstance3D();
    private readonly line_base: Node3D = new Node3D();
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();
    private readonly material: ThreeMaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: 0xf82d4e, side: DoubleSide, transparent: true, depthTest: false, depthWrite: false }));
    private readonly guide_line: MeshInstance3D = new MeshInstance3D();
    private readonly guide_material: ThreeMaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: 0xf82d4e, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false }));

    private update_Transform() {
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
        this.guide_line.local_visible = this.line.local_visible = this.visible && this.is_grabbing;
        this.grabber.local_visible = this.visible;
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

    private update_Visual() {
        if (this.is_hovering) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.grabber.local_visible = this.visible && true;
            this.guide_line.local_visible = false;
            this.line.local_visible = false;
        }
        else if (this.is_grabbing) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
            this.grabber.local_visible = false;
            this.guide_line.local_visible = this.visible && true;
            this.line.local_visible = this.visible && true;
        }
        else {
            (this.material.get_Material() as MeshBasicMaterial).color = this.color;
            this.grabber.local_visible = this.visible && true;
            this.guide_line.local_visible = false;
            this.line.local_visible = false
        }
        (this.guide_material.get_Material() as MeshBasicMaterial).color = this.color;
    }

    private update_Opacity() {
        const camera = this.get_SceneTree()?.get_ActiveViewports()[0]?.get_Camera3D();
        if (camera === undefined || this.is_grabbing) {
            this.material.get_Material().opacity = 1.0;
            this.visual_enabled = true;
            return;
        }
        else {
            const cam = camera.get_Camera();
            const ndc = this.global_position.project(cam);
            const raycast = new Raycaster()
            raycast.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
            const a = raycast.ray.direction;
            const b = this.to_Global(new Vector3(0, 0, -1)).sub(this.global_position).normalize();
            const distance = Math.abs(a.dot(b));
            const opactiy = clamp(distance * 3.5, 0.2, 1) - 0.2;
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

        // this.line.geometry = new ThreeGeometryResource(new CylinderGeometry(0.013, 0.013, 1));
        // this.line.material = this.material;

        const size_gap_rad = 0.375;
        const grabber_geometry = new ThreeGeometryResource(new TorusGeometry(0.6, 0.014, undefined, undefined, Math.PI / 2 - size_gap_rad));
        this.grabber.geometry = grabber_geometry;
        this.grabber.material = this.material;

        const line_geometry = new ThreeGeometryResource(new SphereGeometry(0.06));
        this.line.geometry = line_geometry;
        this.line.material = this.material;

        const picking_shape = new PickingBVHResource();
        picking_shape.compute_BVH(new ThreeGeometryResource(new TorusGeometry(0.6, 0.075, undefined, undefined, Math.PI / 2 - size_gap_rad)));
        this.shape.shape = picking_shape;

        // const test_shape = new MeshInstance3D();
        // test_shape.geometry = new ThreeGeometryResource(new TorusGeometry(0.6, 0.075, undefined, undefined, Math.PI / 2 - size_gap_rad));
        // test_shape.material = new ThreeMaterialResource(new MeshMatcapMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3, depthTest: false, depthWrite: false }));
        // this.shape.add_Child(test_shape);

        const gap_rad = 0.21;
        const guide_line_geometry = new ThreeGeometryResource(new TorusGeometry(0.6, 0.01, undefined, undefined, Tau - gap_rad));
        this.guide_line.geometry = guide_line_geometry;
        this.guide_line.material = this.guide_material;
        this.guide_line.local_visible = false;

        this.area.signal_mouse_entered.connect((evt) => {
            this.is_hovering = true;
        });
        this.area.signal_mouse_exited.connect((evt) => {
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
        this.add_Child(this.area);
        this.area.add_Child(this.shape);
        this.line_base.add_Child(this.guide_line);
        this.line_base.add_Child(this.line);
        this.add_Child(this.line_base);
        this.guide_line.local_rotation = euler(0, 0, gap_rad / 2);
        this.grabber.local_rotation = euler(0, 0, size_gap_rad / 2);
        this.area.local_rotation = euler(0, 0, size_gap_rad / 2);
        this.line.local_position = vec3(0.6, 0, 0);

        // this.shape.local_position = new Vector3(0, 0.5, 0);
        // this.guide_line.local_scale = new Vector3(1, 10000, 1);

        this.update_Transform();
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

    private drag_offset_angle: number = 0;
    private drag_angle: number = 0;

    private on_BeginGrab(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        const local = this.to_Local(position);
        local.z = 0;
        const dir = local.length() < Epsilon ? new Vector2(1, 0) : new Vector2(local.x, local.y);
        this.drag_angle = dir.angle();
        this.line_base.local_rotation = new Euler(0, 0, this.drag_angle);
        this.drag_offset_angle = this.drag_angle;
        evt.mark_Canceled();
        this.signal_grab_start.trigger({ angle: this.drag_angle, relative: 0, delta: 0 }, this);
    }

    private on_Grabbing(evt: MouseInputEvent) {
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        const local = this.to_Local(position);
        local.z = 0;
        const dir = local.length() < Epsilon ? new Vector2(1, 0) : new Vector2(local.x, local.y);
        const last_drag_angle = this.drag_angle;
        this.drag_angle = dir.angle();
        this.line_base.local_rotation = new Euler(0, 0, this.drag_angle);
        evt.mark_Canceled();
        this.signal_grabbing.trigger({ angle: this.drag_angle, relative: this.drag_angle - this.drag_offset_angle, delta: this.drag_angle - last_drag_angle }, this);
    }

    private on_EndGrab() {
        this.is_grabbing = false;
        this.signal_grab_end.trigger({ angle: this.drag_angle, relative: this.drag_angle - this.drag_offset_angle, delta: 0 }, this);
    }

    private get_MousePositionOnPlane(evt: MouseInputEvent) {
        const camera = evt.viewport?.get_Camera3D()?.get_Camera();
        if (camera === undefined) return undefined;
        const dir = this.to_Global(new Vector3(0, 0, 1)).sub(this.global_position).normalize();
        const plane = new Plane().setFromNormalAndCoplanarPoint(dir, this.global_position);
        const raycast = new Raycaster()
        raycast.setFromCamera(evt.position_normalized, camera);
        const l1 = new Line3(raycast.ray.origin, raycast.ray.origin.clone().addScaledVector(raycast.ray.direction, 100000));
        const p0 = plane.intersectLine(l1, new Vector3());
        if (p0 === null) return undefined;
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

        this.area.signal_mouse_entered.connect((evt) => {
            this.is_hovering = true;
            // this.set_ViewportCursorStyle(evt.viewport!, 'move');
        });
        this.area.signal_mouse_exited.connect((evt) => {
            this.is_hovering = false;
            // this.set_ViewportCursorStyle(evt.viewport!, 'default');
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
        const position = this.get_MousePositionOnPlane(evt);
        if (position === undefined) return;
        this.is_grabbing = true;
        this.drag_global_position.copy(this.global_position);
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

    constructor() {
        super();
        this.top_level = true;
    }
}

export class TranslateGrabber extends Grabbers<Vector3> {
    private readonly axis_x_grabber: LineGrabber = new LineGrabber();
    private readonly axis_y_grabber: LineGrabber = new LineGrabber();
    private readonly axis_z_grabber: LineGrabber = new LineGrabber();
    private readonly center_grabber: PointGrabber = new PointGrabber();

    protected on_EnabledChanged(): void {
        this.axis_x_grabber.enabled = this.enabled;
        this.axis_y_grabber.enabled = this.enabled;
        this.axis_z_grabber.enabled = this.enabled;
        this.center_grabber.enabled = this.enabled;
    }

    protected on_VisibleChanged(): void {
        this.axis_x_grabber.visible = this.visible;
        this.axis_y_grabber.visible = this.visible;
        this.axis_z_grabber.visible = this.visible;
        this.center_grabber.visible = this.visible;
    }

    constructor() {
        super();

        const red = 0xff4a56;
        const green = 0x04b973;
        const blue = 0x466fd6;
        const grey = 0x606060;

        this.axis_x_grabber.local_rotation = new Euler(0, 0, - Math.PI / 2);
        this.axis_x_grabber.color = new Color(red);
        this.axis_x_grabber.length = 0.8;
        this.axis_x_grabber.offset_length = 0.175;

        this.axis_y_grabber.color = new Color(green);
        this.axis_y_grabber.length = 0.8;
        this.axis_y_grabber.offset_length = 0.175;

        this.axis_z_grabber.local_rotation = new Euler(Math.PI / 2, 0, 0);
        this.axis_z_grabber.color = new Color(blue);
        this.axis_z_grabber.length = 0.8;
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

export class RotateGrabber extends Grabbers<Quaternion> {
    private readonly angle_x_grabber: AngleGrabber = new AngleGrabber();
    private readonly angle_y_grabber: AngleGrabber = new AngleGrabber();
    private readonly angle_z_grabber: AngleGrabber = new AngleGrabber();

    protected on_EnabledChanged(): void {
        this.angle_x_grabber.enabled = this.enabled;
        this.angle_y_grabber.enabled = this.enabled;
        this.angle_z_grabber.enabled = this.enabled;
    }

    protected on_VisibleChanged(): void {
        this.angle_x_grabber.visible = this.visible;
        this.angle_y_grabber.visible = this.visible;
        this.angle_z_grabber.visible = this.visible;
    }

    constructor() {
        super();

        const red = 0xff4a56;
        const green = 0x04b973;
        const blue = 0x466fd6;
        const grey = 0x606060;

        this.angle_x_grabber = new AngleGrabber();
        this.angle_x_grabber.color = new Color(red);
        this.angle_x_grabber.local_rotation = new Euler(0, -Math.PI / 2, 0);

        this.angle_y_grabber = new AngleGrabber();
        this.angle_y_grabber.color = new Color(green);
        this.angle_y_grabber.local_rotation = new Euler(Math.PI / 2, 0, 0);

        this.angle_z_grabber = new AngleGrabber();
        this.angle_z_grabber.color = new Color(blue);

        this.add_Child(this.angle_x_grabber);
        this.add_Child(this.angle_y_grabber);
        this.add_Child(this.angle_z_grabber);

        this.angle_x_grabber.signal_grab_start.connect(() => {
            this.angle_y_grabber.visible = false;
            this.angle_z_grabber.visible = false;
            this.signal_grab_start.trigger(new Quaternion());
        });
        this.angle_y_grabber.signal_grab_start.connect(() => {
            this.angle_x_grabber.visible = false;
            this.angle_z_grabber.visible = false;
            this.signal_grab_start.trigger(new Quaternion());
        });
        this.angle_z_grabber.signal_grab_start.connect(() => {
            this.angle_x_grabber.visible = false;
            this.angle_y_grabber.visible = false;
            this.signal_grab_start.trigger(new Quaternion());
        });


        const grabbing = (value: { angle: number, delta: number, relative: number }, target: GrabberElement<{ angle: number, delta: number, relative: number }>) => {
            switch (target) {
                case this.angle_x_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), value.relative);
                    this.signal_grabbing.trigger(quat);
                    return;
                }
                case this.angle_y_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(0, -1, 0), value.relative);
                    this.signal_grabbing.trigger(quat);
                    return;
                }
                case this.angle_z_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), value.relative);
                    this.signal_grabbing.trigger(quat);
                    return;
                }
            }
        }
        this.angle_x_grabber.signal_grabbing.connect(grabbing);
        this.angle_y_grabber.signal_grabbing.connect(grabbing);
        this.angle_z_grabber.signal_grabbing.connect(grabbing);

        const grab_end = (value: { angle: number, delta: number, relative: number }, target: GrabberElement<{ angle: number, delta: number, relative: number }>) => {
            const local = new Quaternion().setFromEuler(this.local_rotation);
            switch (target) {
                case this.angle_x_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(-1, 0, 0), value.relative);
                    local.multiply(quat);
                    break;
                }
                case this.angle_y_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(0, -1, 0), value.relative);
                    local.multiply(quat);
                    break;
                }
                case this.angle_z_grabber: {
                    const quat = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), value.relative);
                    local.multiply(quat);
                    break;
                }
            }
            this.local_rotation = new Euler().setFromQuaternion(local);
            this.angle_x_grabber.visible = true;
            this.angle_y_grabber.visible = true;
            this.angle_z_grabber.visible = true;
            this.signal_grab_end.trigger(new Quaternion());
        }

        this.angle_x_grabber.signal_grab_end.connect(grab_end);
        this.angle_y_grabber.signal_grab_end.connect(grab_end);
        this.angle_z_grabber.signal_grab_end.connect(grab_end);
    }
}

export class TransformGrabber extends Grabbers<{ type: 'translate' | 'rotate', local_position: Vector3, local_rotation: Euler }> {
    public readonly translate: TranslateGrabber = new TranslateGrabber();
    public readonly rotate: RotateGrabber = new RotateGrabber();

    private _rotate_enabled: boolean = true;
    public get rotate_enabled() { return this._rotate_enabled; }
    public set rotate_enabled(enabled: boolean) {
        if (this._rotate_enabled !== enabled) {
            this._rotate_enabled = enabled;
            this.update_Enabled();
        }
    }

    private _translate_enabled: boolean = true;
    public get translate_enabled() { return this._translate_enabled; }
    public set translate_enabled(enabled: boolean) {
        if (this._translate_enabled !== enabled) {
            this._translate_enabled = enabled;
            this.update_Enabled();
        }
    }

    protected on_EnabledChanged() {
        this.update_Enabled();
    }

    protected on_VisibleChanged() {
        this.update_Enabled();
    }

    update_Enabled() {
        this.rotate.enabled = this.rotate_enabled && this.enabled;
        this.rotate.visible = this.rotate_enabled && this.visible;
        this.translate.enabled = this.translate_enabled && this.enabled;
        this.translate.visible = this.translate_enabled && this.visible;
    }

    private readonly rotate_offset_local_rotation: Euler = new Euler();

    constructor() {
        super();

        this.add_Child(this.translate);
        this.add_Child(this.rotate);

        this.translate.signal_grab_start.connect(() => {
            this.rotate.visible = false;
            this.signal_grab_start.trigger({ type: 'translate', local_position: this.translate.local_position, local_rotation: this.rotate.local_rotation });
        });
        this.translate.signal_grabbing.connect((position) => {
            this.signal_grabbing.trigger({ type: 'translate', local_position: this.to_Local(position), local_rotation: this.rotate.local_rotation });
        });
        this.translate.signal_grab_end.connect(() => {
            this.rotate.local_position = this.translate.local_position;
            this.rotate.visible = this.rotate_enabled && this.visible;
            this.signal_grab_end.trigger({ type: 'translate', local_position: this.translate.local_position, local_rotation: this.rotate.local_rotation });
        });

        this.rotate.signal_grab_start.connect(() => {
            this.rotate_offset_local_rotation.copy(this.rotate.local_rotation);
            this.signal_grab_start.trigger({ type: 'rotate', local_position: this.translate.local_position, local_rotation: this.rotate.local_rotation });
        });
        this.rotate.signal_grabbing.connect((quat) => {
            const local = new Quaternion().setFromEuler(this.rotate_offset_local_rotation).multiply(quat);
            this.translate.local_rotation = new Euler().setFromQuaternion(local);
            this.signal_grabbing.trigger({ type: 'rotate', local_position: this.translate.local_position, local_rotation: this.translate.local_rotation });
        });
        this.rotate.signal_grab_end.connect(() => {
            this.translate.local_rotation = this.rotate.local_rotation;
            this.signal_grab_end.trigger({ type: 'rotate', local_position: this.translate.local_position, local_rotation: this.rotate.local_rotation });
        });
    }
}

export class Node3DTransformGrabber extends Grabbers<{ type: 'translate' | 'rotate', local_position: Vector3, local_rotation: Euler }> {
}