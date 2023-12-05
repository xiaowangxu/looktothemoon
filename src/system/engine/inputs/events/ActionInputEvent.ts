import { InputEvent } from "../InputEvent";


export class ActionInputEvent extends InputEvent {
    public static readonly class_name: string = "ActionInputEvent";

    public readonly action: string;
    public readonly pressed: boolean;
    public readonly echo: boolean;

    constructor(action: string, pressed: boolean, echo: boolean) {
        super();
        this.action = action;
        this.pressed = pressed;
        this.echo = echo;
    }
}
