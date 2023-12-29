import { InputEvent } from "../InputEvent";
import { InputEventFromViewport } from "./InputEventFromViewport";

export class ComposeInputEvent extends InputEventFromViewport {
    public static readonly class_name: string = "ComposeInputEvent";

    public ctrl: boolean = false;
    public shift: boolean = false;
    public alt: boolean = false;
    public meta: boolean = false;

    public set_Compose(ctrl: boolean = false, shift: boolean = false, alt: boolean = false, meta: boolean = false) {
        this.ctrl = ctrl;
        this.shift = shift;
        this.alt = alt;
        this.meta = meta;
        return this;
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