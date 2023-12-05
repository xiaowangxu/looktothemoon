import type { Viewport } from "../../nodes/Node";
import { InputEvent } from "../InputEvent";
import { ComposeInputEvent } from "./ComposeInputEvent";

export class KeyInputEvent extends ComposeInputEvent {
    public static readonly class_name: string = "KeyInputEvent";

    public readonly key: string;
    public readonly keycode: string;
    public readonly pressed: boolean;
    public readonly echo: boolean;

    constructor(
        key: string, keycode: string,
        pressed: boolean, echo: boolean,
        viewport: Viewport | undefined, ctrl: boolean, shift: boolean, alt: boolean, meta: boolean
    ) {
        super(viewport, ctrl, shift, alt, meta);
        this.key = key;
        this.keycode = keycode;
        this.pressed = pressed;
        this.echo = echo;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return event instanceof KeyInputEvent && (
            event.key === this.key &&
            (with_pressed ? event.pressed === this.pressed : true) &&
            (this.echo === false ? event.echo === false : true)
        ) && (
                event.ctrl === this.ctrl &&
                event.shift === this.shift &&
                event.alt === this.alt &&
                event.meta === this.meta
            );
    }
}