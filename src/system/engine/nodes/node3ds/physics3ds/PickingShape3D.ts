import type { Rid } from "../../../Rid";
import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";
import type { PickingShape3DResource } from "../../../resources/picking_shape_resources/picking_shape3d_resources/PickingShape3DResource";
import { PickingArea3D } from "./PickingArea3D";
import { Ref } from "@/system/utils/RefCounted";

export class PickingShape3D extends Node3D {
    public static readonly class_name: string = "PickingShape3D";

    private shape_rid: Rid | undefined = undefined;

    private _shape: Ref<PickingShape3DResource> = new Ref();
    public get shape() { return this._shape.value; }
    public set shape(shape: PickingShape3DResource | undefined) {
        if (this._shape.value !== shape) {
            this._shape.value = shape;
            if (this.shape_rid !== undefined) {
                const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                if (picking_world !== undefined) {
                    picking_world.set_PickingShapeInstanceShape(this.shape_rid, this._shape.value);
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
                const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                if (picking_world !== undefined) {
                    picking_world.set_PickingShapeInstanceDistanceOffset(this.shape_rid, this._distance_offset);
                }
            }
        }
    }

    constructor() {
        super();
        this.reset_transform_changed_before_render = false;
        this.reset_transform_changed_after_physics_process = true;
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.shape_rid === undefined) {
                    const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                    if (picking_world !== undefined) {
                        this.shape_rid = picking_world.create_PickingShapeInstance();
                        picking_world.set_PickingShapeInstanceShape(this.shape_rid, this.shape);
                        picking_world.set_PickingShapeInstanceDistanceOffset(this.shape_rid, this.distance_offset);
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
                    const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                    if (picking_world === undefined) throw new Error('<MeshInstance3D> _notification@ExitingTree: cannot find picking world, fail to free shape instance');
                    picking_world.free_PickingShapeInstance(this.shape_rid);
                    this.shape_rid = undefined;
                }
                break;
            }
            case NodeNotification.InternalAfterPhysicsProcess: {
                if (this.shape_rid !== undefined) {
                    const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                    if (picking_world === undefined) throw new Error('<MeshInstance3D> _notification@ExitingTree: cannot find picking world, fail to update shape instance');
                    if (this.is_global_transform_changed) {
                        this.update_GlobalTransform();
                        picking_world.set_PickingShapeInstanceGlobalTransform(this.shape_rid, this._global_transform);
                    }
                }
                break;
            }
            case NodeNotification.Dispose: {
                this._shape.clear();
                break;
            }
        }
        super._notification(what);
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