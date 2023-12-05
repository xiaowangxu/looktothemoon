import type { Viewport } from "../../nodes/Node";
import { InputEvent } from "../InputEvent";
import { InputEventFromViewport } from "./InputEventFromViewport";

export class ComposeInputEvent extends InputEventFromViewport {
    public static readonly class_name: string = "ComposeInputEvent";

    public readonly ctrl: boolean;
    public readonly shift: boolean;
    public readonly alt: boolean;
    public readonly meta: boolean;

    constructor(viewport: Viewport | undefined, ctrl: boolean, shift: boolean, alt: boolean, meta: boolean) {
        super(viewport);
        this.ctrl = ctrl;
        this.shift = shift;
        this.alt = alt;
        this.meta = meta;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return event instanceof ComposeInputEvent && (
            event.ctrl === this.ctrl &&
            event.shift === this.shift &&
            event.alt === this.alt &&
            event.meta === this.meta
        );
    }
}