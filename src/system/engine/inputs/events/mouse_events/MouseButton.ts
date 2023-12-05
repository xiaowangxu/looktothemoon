import type { Viewport } from "../../../nodes/Node";
import { Vector2 } from "../../../../math/linear_algebra/Vector2";
import { InputEvent } from "../../InputEvent";
import { MouseInputEvent } from "./MouseInputEvent";

export enum MouseButton {
    Left, Middle, Right, Next, Prev, WheelUp, WheelDown, None
}

export class MouseButtonInputEvent extends MouseInputEvent {
    public static readonly class_name: string = "MouseButtonInputEvent";

    public readonly button: MouseButton;
    public readonly pressed: boolean;
    public readonly click: boolean;
    public readonly double_click: boolean;

    constructor(
        button: MouseButton, pressed: boolean, click: boolean, double_click: boolean,
        viewport: Viewport | undefined, position: Vector2, normalized_position: Vector2,
        ctrl: boolean, shift: boolean, alt: boolean, meta: boolean
    ) {
        super(viewport, position, normalized_position, ctrl, shift, alt, meta);
        this.button = button;
        this.pressed = pressed;
        this.click = click;
        this.double_click = double_click;
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