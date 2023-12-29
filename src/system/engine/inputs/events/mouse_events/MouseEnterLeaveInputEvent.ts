import { InputEventFromViewport } from "../InputEventFromViewport";

export class MouseEnterLeaveInputEvent extends InputEventFromViewport {
    public static readonly class_name: string = "MouseEnterLeaveInputEvent";

    public inside: boolean = false;

    public set_Inside(inside: boolean) {
        this.inside = inside;
        return this;
    }
}