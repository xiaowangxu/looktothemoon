import { InputEvent, MouseButton, MouseButtonInputEvent, MouseEnterLeaveInputEvent, MouseMotionInputEvent } from "@/system/engine/InputEvent";
import { EPSILON } from "@/system/engine/MathF";
import { FixSizeNode3D } from "@/system/engine/nodes/node_3ds/FixSizeNode3D";
import { PickingArea3D } from "@/system/engine/nodes/physics_3ds/PickingArea3D";
import { PickingShape3D } from "@/system/engine/nodes/physics_3ds/PickingShape3D";
import { MeshInstance3D } from "@/system/engine/nodes/visual_instances/MeshInstance3D";
import { ThreeGeometryResource } from "@/system/engine/resources/GeometryResource";
import { ThreeMaterialResource } from "@/system/engine/resources/MaterialResource";
import { PickingBVHResource, PickingSphereResource } from "@/system/engine/resources/PickingShapeResource";
import { Vector3, ConeGeometry, MeshBasicMaterial, CylinderGeometry, Color, Euler, Quaternion, Line3, Ray } from 'three';

export class LineGrabber extends FixSizeNode3D {
    private readonly grabber: MeshInstance3D = new MeshInstance3D();
    private readonly line: MeshInstance3D = new MeshInstance3D();
    private readonly area: PickingArea3D = new PickingArea3D();
    private readonly shape: PickingShape3D = new PickingShape3D();
    private readonly material: ThreeMaterialResource = new ThreeMaterialResource(new MeshBasicMaterial({ color: 0xf82d4e }));

    public _direction: Vector3 = new Vector3(0, 1, 0);
    public get direction() { return this._direction.clone(); }
    public set direction(direction: Vector3) {
        direction = direction.normalize();
        if (direction.length() < EPSILON) return;
        this._direction.copy(direction);
        this.global_rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this._direction));
    }

    private _is_dragging: boolean = false;
    public get is_dragging() { return this._is_dragging; }
    public set is_dragging(dragging: boolean) {
        if (this._is_dragging !== dragging) {
            this._is_dragging = dragging;
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

    private update_Visual() {
        if (this.is_hovering) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
        }
        else if (this.is_dragging) {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xffbb00);
        }
        else {
            (this.material.get_Material() as MeshBasicMaterial).color = new Color(0xf82d4e);
        }
    }

    constructor() {
        super();
        this.unit_pixel_count = 75;

        this.line.visual_layer = 1;
        this.grabber.visual_layer = 1;

        this.line.geometry = new ThreeGeometryResource(new CylinderGeometry(0.02, 0.02, 1));
        this.line.material = this.material;

        const grabber_geometry = new ThreeGeometryResource(new ConeGeometry(0.1, 0.3));
        this.grabber.geometry = grabber_geometry;
        this.grabber.material = this.material;

        const picking_shape = new PickingBVHResource();
        picking_shape.compute_BVH(grabber_geometry);
        this.shape.shape = picking_shape;

        this.area.signal_mouse_entered.connect(() => {
            this.is_hovering = true;
        });
        this.area.signal_mouse_exited.connect(() => {
            this.is_hovering = false;
        });

        this.area.signal_input.connect((evt, prop) => {
            if (!prop && this.area.is_mouse_hover) {
                if (!this.is_dragging) {
                    if (evt instanceof MouseButtonInputEvent && evt.button === MouseButton.Left && evt.pressed) {
                        this.is_dragging = true;
                        evt.mark_Canceled();
                    }
                }
            }
        });

        this.add_Child(this.line);
        this.line.add_Child(this.grabber);
        this.grabber.add_Child(this.area);
        this.area.add_Child(this.shape);

        this.line.local_position = new Vector3(0, 0.5, 0);
        this.grabber.local_position = new Vector3(0, 0.5, 0);
    }

    public _input(event: InputEvent, propagate: boolean): void {
        if (!propagate && event instanceof MouseButtonInputEvent) {
            // drag
            if (event.button === MouseButton.Left) {
                if (event.pressed === false) {
                    this.is_dragging = false;
                }
            }
        }
        // mouse exit
        if (!propagate && event instanceof MouseEnterLeaveInputEvent) {
            if (this.is_dragging && !event.inside) {
                this.is_dragging = false;
            }
        }
        if (!propagate && this.is_dragging) {
            event.mark_Canceled();
            if (event instanceof MouseMotionInputEvent) {
            }
        }
    }
}