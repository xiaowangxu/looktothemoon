import type { Viewport } from "../../nodes/Node";
import { InputEvent } from "../InputEvent";

export class InputEventFromViewport extends InputEvent {
    public static readonly class_name: string = "InputEventFromViewport";

    public viewport: Viewport | undefined;

    public set_Viewport(viewport: Viewport | undefined) {
        this.viewport = viewport;
        return this;
    }
}