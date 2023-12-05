import type { Viewport } from "../../nodes/Node";
import { InputEvent } from "../InputEvent";

export class InputEventFromViewport extends InputEvent {
    public static readonly class_name: string = "InputEventFromViewport";

    public readonly viewport: Viewport | undefined;

    constructor(viewport: Viewport | undefined) {
        super();
        this.viewport = viewport;
    }
}