import type { Viewport } from "../../../nodes/Node";
import { Vector2 } from "../../../../math/linear_algebra/Vector2";
import { MouseInputEvent } from "./MouseInputEvent";

export class MouseMotionInputEvent extends MouseInputEvent {
    public static readonly class_name: string = "MouseMotionInputEvent";

    public readonly relative: Vector2;
    public readonly relative_normalized: Vector2;

    constructor(
        relative: Vector2, relative_normalized: Vector2,
        viewport: Viewport, position: Vector2, position_normalized: Vector2,
        ctrl: boolean, shift: boolean, alt: boolean, meta: boolean
    ) {
        super(viewport, position, position_normalized, ctrl, shift, alt, meta);
        this.relative = relative;
        this.relative_normalized = relative_normalized;
    }
}