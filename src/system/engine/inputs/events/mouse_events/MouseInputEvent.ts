import { Vector2 } from "../../../../fivepebble/linear_algebra/Vector2";
import { ComposeInputEvent } from "../ComposeInputEvent";

export class MouseInputEvent extends ComposeInputEvent {
    public static readonly class_name: string = "MouseInputEvent";

    private readonly _position: Vector2 = new Vector2();
    private readonly _position_normalized: Vector2 = new Vector2();

    public get position() { return this._position.clone(); }
    public get_Position(target: Vector2) { return target.copy(this._position); }
    
    public get position_normalized() { return this._position_normalized.clone(); }
    public get_PositionNormalized(target: Vector2) { return target.copy(this._position_normalized); }

    public set_Position(position: Vector2, position_normalized: Vector2) {
        this._position.copy(position);
        this._position_normalized.copy(position_normalized);
        return this;
    }
}