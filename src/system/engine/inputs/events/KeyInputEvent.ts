import { InputEvent } from "../InputEvent";
import { ComposeInputEvent } from "./ComposeInputEvent";

export class KeyInputEvent extends ComposeInputEvent {
    public static readonly class_name: string = "KeyInputEvent";

    static readonly #empty_key = '';

    public key: string = KeyInputEvent.#empty_key;
    public keycode: string = KeyInputEvent.#empty_key;
    public pressed: boolean = false;
    public echo: boolean = false;

    public set_Key(key: string, keycode: string, pressed: boolean, echo: boolean) {
        this.key = key;
        this.keycode = keycode;
        this.pressed = pressed;
        this.echo = echo;
        return this;
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