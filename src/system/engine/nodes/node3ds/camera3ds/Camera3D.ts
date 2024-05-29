import { type Camera3 } from "../../../../fivepebble/graphics/Camera3";
import { NodeNotification } from "../../Node";
import { Node3D } from "../Node3D";

export abstract class Camera3D extends Node3D {
    public static readonly class_name: string = "Camera3D";

    public _current: boolean = true;
    public get current() { return this._current; }
    public set current(current: boolean) {
        if (this._current !== current) {
            if (current) {
                this.get_Viewport()?.set_ActiveCamera3D(this);
            }
            else {
                this.get_Viewport()?.clear_ActiveCamera3D(this);
            }
        }
    }

    private _mask: number = 0xffffffff;
    public get mask() { return this._mask; }
    public set mask(mask: number) {
        mask = mask & 0xffffffff;
        if (this._mask !== mask) {
            this._mask = mask;
            this.on_MaskChanged();
        }
    }

    protected abstract on_MaskChanged(): void;

    public abstract get_Camera(): Camera3;

    public abstract update_ViewportSize(width: number, height: number): void;

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
                    this.get_Viewport()?.clear_ActiveCamera3D(this);
                }
                break;
            }
        }
        super._notification(what);
    }
}