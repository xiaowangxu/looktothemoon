import { NodeNotification } from "../../SceneTree";
import { PhysicsInstance3D } from "./PhysicsInstance3D";
import { type RID } from "../../Rid";
import { SignalEmitter } from "@/system/utils/SignalEmitter";

export class PickingArea3D extends PhysicsInstance3D {
    public static readonly class_name: string = "PickingArea3D";

    // signal
    public readonly signal_mouse_entered: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_mouse_exited: SignalEmitter<() => void> = new SignalEmitter();

    private area_rid: RID | undefined = undefined;
    public get picking_area_rid() { return this.area_rid; }

    private _is_mouse_hover: boolean = false;
    public get is_mouse_hover() { return this._is_mouse_hover; }

    public on_LayerChanged(): void {
        if (this.area_rid !== undefined) {
            const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
            if (picking_world !== undefined) {
                picking_world.set_PickingAreaLayer(this.area_rid, this.layer);
            }
        }
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.area_rid === undefined) {
                    const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                    if (picking_world !== undefined) {
                        this.area_rid = picking_world.create_PickingArea(this);
                        picking_world.set_PickingAreaLayer(this.area_rid, this.layer);
                    }
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.area_rid !== undefined) {
                    const picking_world = this.get_Viewport()?.get_World3D()?.get_PickingWorld();
                    if (picking_world === undefined) throw new Error('cannot find picking world, fail to free area instance');
                    picking_world.free_PickingArea(this.area_rid);
                    this.area_rid = undefined;
                }
                break;
            }
        }
        super._notification(what);
    }

    public on_MouseEntered() {
        this._is_mouse_hover = true;
        this.signal_mouse_entered.trigger();
    }

    public on_MouseExited() {
        this._is_mouse_hover = false;
        this.signal_mouse_exited.trigger();
    }
}