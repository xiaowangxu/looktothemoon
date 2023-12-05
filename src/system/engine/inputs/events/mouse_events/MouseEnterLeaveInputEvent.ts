import type { Viewport } from "../../../nodes/Node";
import { InputEventFromViewport } from "../InputEventFromViewport";

export class MouseEnterLeaveInputEvent extends InputEventFromViewport {
    public static readonly class_name: string = "MouseEnterLeaveInputEvent";

    public readonly inside: boolean;

    constructor(inside: boolean, viewport: Viewport | undefined) {
        super(viewport);
        this.inside = inside;
    }
}