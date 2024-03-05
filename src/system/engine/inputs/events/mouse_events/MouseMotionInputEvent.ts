import { Vector2 } from "../../../../fivepebble/linear_algebra/Vector2";
import { MouseInputEvent } from "./MouseInputEvent";

export class MouseMotionInputEvent extends MouseInputEvent {
    public static readonly class_name: string = "MouseMotionInputEvent";

    private readonly _relative: Vector2 = new Vector2();
    private readonly _relative_normalized: Vector2 = new Vector2();

    public get relative() { return this._relative.clone(); }
    public get_Relative(target: Vector2) { return target.copy(this._relative); }
    
    public get relative_normalized() { return this._relative_normalized.clone(); }
    public get_RelativeNormalized(target: Vector2) { return target.copy(this.relative_normalized); }

    public set_Motion(relative: Vector2, relative_normalized: Vector2) {
        this._relative.copy(relative);
        this._relative_normalized.copy(relative_normalized);
        return this;
    }
}