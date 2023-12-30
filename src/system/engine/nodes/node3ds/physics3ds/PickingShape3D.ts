import type { RID } from "../../../Rid";
import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import type { PickingShape3DResource } from "../../../resources/picking_shape_resources/PickingShapeResource";
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

    private _distance_offset: number = 0;
    public get distance_offset() { return this._distance_offset; }
    public set distance_offset(distance_offset: number) {
        if (this._distance_offset !== distance_offset) {
            this._distance_offset = distance_offset;
            if (this.shape_rid !== undefined) {
                const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                if (picking_world !== undefined) {
                    picking_world.set_PickingShapeInstanceDistanceOffset(this.shape_rid, this._distance_offset);
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
                        picking_world.set_PickingShapeInstanceDistanceOffset(this.shape_rid, this.distance_offset);
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

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('shape', this.shape);
        writer.property('distance_offset', this.distance_offset);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        const shape = reader.get<PickingShape3DResource>('shape');
        this.shape = shape;
        this.distance_offset = reader.get<number>('distance_offset') ?? 0;
    }
}