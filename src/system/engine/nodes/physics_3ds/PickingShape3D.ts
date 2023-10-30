import type { RID } from "../../Rid";
import { Node3D, NodeNotification } from "../../SceneTree";
import type { PickingShape3DResource } from "../../resources/PickingShapeResource";
import { PickingArea3D } from "./PickingArea3D";

export class PickingShape3D extends Node3D {
    public static readonly class_name: string = "PickingShape3D";

    private shape_rid: RID | undefined = undefined;

    private _shape: PickingShape3DResource | undefined = undefined;
    public get shape() { return this._shape; }
    public set shape(shape: PickingShape3DResource | undefined) {
        if (this._shape !== shape) {
            this._shape = shape;
            if (this.shape_rid !== undefined) {
                const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                if (picking_world !== undefined) {
                    if (this._shape === undefined) {
                        picking_world.clear_PickingShapeInstanceShape(this.shape_rid);
                    }
                    else {
                        picking_world.set_PickingShapeInstanceShape(this.shape_rid, this._shape);
                    }
                }
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.shape_rid === undefined) {
                    const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                    if (picking_world !== undefined) {
                        this.shape_rid = picking_world.create_PickingShapeInstance();
                        if (this.shape !== undefined) {
                            picking_world.set_PickingShapeInstanceShape(this.shape_rid, this.shape);
                        }
                        const parent = this.get_Parent();
                        if (parent !== undefined && parent instanceof PickingArea3D && parent.picking_area_rid) {
                            picking_world.set_PickingShapeInstanceArea(this.shape_rid, parent.picking_area_rid);
                        }
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.shape_rid !== undefined) {
                    const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                    if (picking_world === undefined) throw new Error('cannot find picking world, fail to free shape instance');
                    const parent = this.get_Parent();
                    if (parent !== undefined && parent instanceof PickingArea3D && parent.picking_area_rid) {
                        picking_world.clear_PickingShapeInstanceArea(this.shape_rid);
                    }
                    picking_world.free_PickingShapeInstance(this.shape_rid);
                    this.shape_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalAfterPhysicsProcess: {
                if (this.shape_rid !== undefined) {
                    const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                    if (picking_world === undefined) throw new Error('cannot find picking world, fail to update shape instance');
                    if (this.is_global_transform_changed) {
                        picking_world.set_PickingShapeInstanceGlobalTransform(this.shape_rid, this.global_transform);
                        this.is_global_transform_changed = false;
                    }
                }
                break;
            }
        }
        super._notification_IgnoreTransformChange(what);
    }
}