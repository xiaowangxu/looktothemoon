import { type Camera, Vector2 } from "three";
import { NodeNotification } from "../Node";
import { Node3D } from "../node3ds/Node3D";

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

    private _visual_mask: number = 4294967295;
    public get visual_mask() { return this._visual_mask; }
    public set visual_mask(mask: number) {
        mask = mask & 4294967295;
        if (this._visual_mask !== mask) {
            this._visual_mask = mask;
            this.on_VisualMaskChanged();
        }
    }

    protected on_VisualMaskChanged() {
        throw new Error('abstract method');
    }

    public get_Camera(): Camera {
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

    public update_ViewportSize(size: Vector2) {
        throw new Error('abstract method');
    }

}