import { InputEvent } from "../../InputEvent";
import { MouseInputEvent } from "./MouseInputEvent";

export enum MouseButton {
    Left, Middle, Right, Next, Prev, WheelUp, WheelDown, None
}

export class MouseButtonInputEvent extends MouseInputEvent {
    public static readonly class_name: string = "MouseButtonInputEvent";

    public button: MouseButton = MouseButton.None;
    public pressed: boolean = false;
    public click: boolean = false;
    public double_click: boolean = false;

    public set_Button(button: MouseButton, pressed: boolean, click: boolean, double_click: boolean) {
        this.button = button;
        this.pressed = pressed;
        this.click = click;
        this.double_click = double_click;
        return this;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return event instanceof MouseButtonInputEvent && (
            event.button === this.button &&
            (with_pressed ? event.pressed === this.pressed : true) &&
            event.click === this.click &&
            event.double_click === this.double_click
        ) && (
                event.ctrl === this.ctrl &&
                event.shift === this.shift &&
                event.alt === this.alt &&
                event.meta === this.meta
            );
    }
}