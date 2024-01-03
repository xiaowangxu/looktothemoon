import { type Camera3 } from "../../../../fivepebble/graphics/Camera3";
import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class Camera3D extends Node3D {
    public static readonly class_name: string = "Camera3D";

    public _current: boolean = true;
    public get current() { return this._current; }
    public set current(current: boolean) {
        if (this._current !== current) {
            if (current) {
                this.get_Viewport()?.set_ActiveCamera3D(this);
            }
            else {
                this.get_Viewport()?.clear_Camera3D(this);
            }
        }
    }

    private _visual_mask: number = 0xffffffff;
    public get visual_mask() { return this._visual_mask; }
    public set visual_mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._visual_mask !== mask) {
            this._visual_mask = mask;
            this.on_VisualMaskChanged();
        }
    }

    protected on_VisualMaskChanged() {
        throw new Error('abstract method');
    }

    public get_Camera(): Camera3 {
        throw new Error('abstract method');
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this.current) {
                    this.get_Viewport()?.set_ActiveCamera3D(this);
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this.current) {
                    this.get_Viewport()?.clear_Camera3D(this);
                }
                break;
            }
        }
        super._notification(what);
    }

    public update_ViewportSize(size: Readonly<Vector2>) {
        throw new Error('abstract method');
    }
}