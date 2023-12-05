import type { Viewport } from "../../../nodes/Node";
import { Vector2 } from "../../../../math/linear_algebra/Vector2";
import { ComposeInputEvent } from "../ComposeInputEvent";

export class MouseInputEvent extends ComposeInputEvent {
    public static readonly class_name: string = "MouseInputEvent";

    public readonly position: Vector2;
    public readonly position_normalized: Vector2;

    constructor(viewport: Viewport | undefined, position: Vector2, position_normalized: Vector2, ctrl: boolean, shift: boolean, alt: boolean, meta: boolean) {
        super(viewport, ctrl, shift, alt, meta);
        this.position = position.clone();
        this.position_normalized = position_normalized.clone();
    }
}