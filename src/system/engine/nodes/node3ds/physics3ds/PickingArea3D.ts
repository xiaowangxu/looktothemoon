import { NodeNotification } from "../../Node";
import { PhysicsInstance3D } from "./PhysicsInstance3D";
import { type Rid } from "../../../Rid";
import { SignalEmitter } from "@/system/utils/SignalEmitter";
import type { MouseInputEvent } from "../../../inputs/events/mouse_events/MouseInputEvent";
import type { ClassReader, ClassWriter } from "../../../classes/saver_loader/ClassWriterReader";

export class PickingArea3D extends PhysicsInstance3D {
    public static readonly class_name: string = "PickingArea3D";

    // signal
    public readonly signal_mouse_entered: SignalEmitter<(event: MouseInputEvent) => void> = new SignalEmitter();
    public readonly signal_mouse_exited: SignalEmitter<(event: MouseInputEvent) => void> = new SignalEmitter();

    private area_rid: Rid | undefined = undefined;
    public get picking_area_rid() { return this.area_rid; }

    private _is_mouse_hover: boolean = false;
    public get is_mouse_hover() { return this._is_mouse_hover; }

    private _priority: number = 0;
    public get priority() { return this._priority; }
    public set priority(priority: number) {
        if (this._priority !== priority) {
            this._priority = priority;
            this.on_PriorityChanged();
        }
    }

    protected on_PriorityChanged(): void {
        if (this.area_rid !== undefined) {
            const picking_world = this.get_Viewport()?.world_3d?.picking_world;
            if (picking_world !== undefined) {
                picking_world.set_PickingAreaPriority(this.area_rid, this.priority);
            }
        }
    }

    public on_LayerChanged(): void {
        if (this.area_rid !== undefined) {
            const picking_world = this.get_Viewport()?.world_3d?.picking_world;
            if (picking_world !== undefined) {
                picking_world.set_PickingAreaLayer(this.area_rid, this.layer);
            }
        }
    }

    public on_EnabledChanged(): void {
        if (this.area_rid !== undefined) {
            const picking_world = this.get_Viewport()?.world_3d?.picking_world;
            if (picking_world !== undefined) {
                picking_world.set_PickingAreaEnabled(this.area_rid, this.enabled);
            }
        }
    }

    public on_DetectLayerChanged(): void {

    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.area_rid === undefined) {
                    const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                    if (picking_world !== undefined) {
                        this.area_rid = picking_world.create_PickingArea(this);
                        picking_world.set_PickingAreaLayer(this.area_rid, this.layer);
                        picking_world.set_PickingAreaPriority(this.area_rid, this.priority);
                        picking_world.set_PickingAreaEnabled(this.area_rid, this.enabled);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.area_rid !== undefined) {
                    const picking_world = this.get_Viewport()?.world_3d?.picking_world;
                    if (picking_world === undefined) throw new Error('cannot find picking world, fail to free area instance');
                    picking_world.free_PickingArea(this.area_rid);
                    this.area_rid = undefined;
                }
                break;
            }
            case NodeNotification.Dispose: {
                this.signal_mouse_entered.clear();
                this.signal_mouse_exited.clear();
                break;
            }
        }
        super._notification(what);
    }

    public on_MouseEntered(event: MouseInputEvent) {
        this._is_mouse_hover = true;
        this.signal_mouse_entered.trigger(event);
    }

    public on_MouseExited(event: MouseInputEvent) {
        this._is_mouse_hover = false;
        this.signal_mouse_exited.trigger(event);
    }

    // save / load

    public dump(writer: ClassWriter): void {
        super.dump(writer);
        writer.property('priority', this.priority);
    }

    public load(reader: ClassReader): void {
        super.load(reader);
        this.priority = reader.get<number>('priority') ?? 0;
    }
}