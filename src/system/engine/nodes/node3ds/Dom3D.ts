import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import { NodeNotification } from "../Node";
import { Node3D } from "./Node3D";
import { VisualInstance3D } from "./visual_instance3ds/VisualInstance3D";
import { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import { Rad2Ded } from "@/system/fivepebble/Scalar";

export class Dom3D extends Node3D {

    private _dom: HTMLElement | undefined = undefined;
    public get dom() { return this._dom; }
    public set dom(dom: HTMLElement | undefined) {
        if (this._dom !== dom) {
            if (this._dom !== undefined) {
                this.get_Viewport()?.canvas.removeChild(this._dom);
            }
            this._dom = dom;
            if (this._dom !== undefined) {
                this._dom.style.display = 'none';
                this.get_Viewport()?.canvas.appendChild(this._dom);
            }
        }
    }

    protected update_DomPosition() {
        if (this._dom === undefined) return;
        const camera = this.get_Viewport()?.get_Camera3D();
        if (camera === undefined) return;
        const camera3 = camera.get_Camera();
        if (!camera3.frustum.contain_Point(this._global_position)) {
            this._dom.style.display = 'none';
            return;
        }
        this._dom.style.display = 'block';
        const pos = camera3.project_Point(this._global_position, Vector2.new);
        pos.y *= -1;
        pos.add_Number(pos, 1.0).div_Number(pos, 2).mult(pos, this.get_Viewport()!.size);
        const dir = Vector3.new.add(this._global_position, Vector3.create(1, 0, 0));
        const pos2 = camera3.project_Point(dir, Vector2.new);
        pos2.y *= -1;
        pos2.add_Number(pos2, 1.0).div_Number(pos2, 2).mult(pos2, this.get_Viewport()!.size);
        let angle = Vector2.new.direction_to(pos, pos2).angle;
        this._dom.style.transform = `translate(${pos.x}px,${pos.y}px) rotate(${angle * Rad2Ded}deg)`;
        this._dom.style.transformOrigin = 'top left';
    }

    public _notification(what: NodeNotification): void {
        switch (what) {
            case NodeNotification.EnteredTree: {
                if (this._dom !== undefined) {
                    this.get_Viewport()?.canvas.appendChild(this._dom);
                }
                break;
            }
            case NodeNotification.ExitingTree: {
                if (this._dom !== undefined) {
                    this.get_Viewport()?.canvas.removeChild(this._dom);
                }
                break;
            }
            case NodeNotification.InternalBeforeRender: {
                if (this.is_global_transform_changed) {
                    this.update_GlobalTransform();
                }
                this.update_DomPosition();
                break;
            }
            case NodeNotification.Dispose: {
                this.dom = undefined;
                break;
            }
        }
        super._notification(what);
    }
}