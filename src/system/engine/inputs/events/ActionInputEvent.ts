import { InputEvent } from "../InputEvent";

export class ActionInputEvent extends InputEvent {
    public static readonly class_name: string = "ActionInputEvent";

    static readonly #empty_action = '';

    public action: string = ActionInputEvent.#empty_action;
    public pressed: boolean = false;
    public echo: boolean = false;

    public set_Action(action: string, pressed: boolean, echo: boolean) {
        this.action = action;
        this.pressed = pressed;
        this.echo = echo;
        return this;
    }
}
