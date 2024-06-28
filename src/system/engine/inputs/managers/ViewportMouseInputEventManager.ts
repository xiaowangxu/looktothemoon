import type { Viewport } from "../../nodes/Node";
import { SignalEmitter } from "../../../utils/SignalEmitter";
import { MouseButton, MouseButtonInputEvent } from "../events/mouse_events/MouseButtonInputEvent";
import { MouseMotionInputEvent } from "../events/mouse_events/MouseMotionInputEvent";
import { MouseEnterLeaveInputEvent } from "../events/mouse_events/MouseEnterLeaveInputEvent";
import { InputEventFromViewport } from "../events/InputEventFromViewport";
import { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";

export class ViewportMouseInputEventManager {

    static #tmp_vector2_0 = Vector2.new;
    static #tmp_vector2_1 = Vector2.new;
    static #tmp_vector2_2 = Vector2.new;

    private readonly viewport: Viewport;

    private get canvas() { return this.viewport.canvas; }

    private _is_mouse_inside: boolean = false;
    private set is_mouse_inside(inside: boolean) {
        if (this._is_mouse_inside !== inside) {
            this._is_mouse_inside = inside;
            if (this._is_mouse_inside) {
                this.signal_mouse_enetered.trigger();
            }
            else {
                this.signal_mouse_leaved.trigger();
            }
        }
    }
    public get is_mouse_inside() { return this._is_mouse_inside; }

    private _mouse_position: Vector2 = Vector2.create(0, 0);
    private _mouse_position_normalized: Vector2 = Vector2.create(-1, -1);

    public get mouse_position() { return this._mouse_position.clone(); }
    public get_MousePosition(target: Vector2) { return target.copy(this._mouse_position); }

    public get mouse_position_normalized() { return this._mouse_position_normalized.clone(); }
    public get_MousePositionNormalized(target: Vector2) { return target.copy(this._mouse_position_normalized); }

    private readonly mouse_button_map: Map<MouseButton, boolean> = new Map([
        [MouseButton.Left, false],
        [MouseButton.Middle, false],
        [MouseButton.Right, false],
        [MouseButton.Prev, false],
        [MouseButton.Next, false],
        [MouseButton.None, false]
    ]);

    public is_ButtonPressed(button: MouseButton) {
        return this.mouse_button_map.get(button) ?? false;
    }

    // signals
    public readonly signal_mouse_event: SignalEmitter<(event: InputEventFromViewport) => void> = new SignalEmitter();
    public readonly signal_mouse_enetered: SignalEmitter<() => void> = new SignalEmitter();
    public readonly signal_mouse_leaved: SignalEmitter<() => void> = new SignalEmitter();

    constructor(viewport: Viewport) {
        this.viewport = viewport;
        this.canvas.addEventListener('mouseenter', this._on_MouseEntered);
        this.canvas.addEventListener('mouseleave', this._on_MouseLeaved);
        this.canvas.addEventListener('mousemove', this._on_MouseMoved);
        this.canvas.addEventListener('mousedown', this._on_MouseDown);
        this.canvas.addEventListener('mouseup', this._on_MouseUp);
        this.canvas.addEventListener('click', this._on_Click);
        this.canvas.addEventListener('dblclick', this._on_DoubleClick);
        this.canvas.addEventListener('contextmenu', this._on_RightClick);
        this.canvas.addEventListener('wheel', this._on_Wheel);
    }

    private trigger_MouseEvent(event: InputEventFromViewport) {
        this.viewport.on_InputEvent(event);
        this.signal_mouse_event.trigger(event);
    }

    private get_MouseButton(event: MouseEvent): MouseButton {
        switch (event.button) {
            case 0: return MouseButton.Left;
            case 1: return MouseButton.Middle;
            case 2: return MouseButton.Right;
            case 3: return MouseButton.Prev;
            case 4: return MouseButton.Next;
            default: return MouseButton.None;
        }
    }

    private update_MousePosition(event: MouseEvent) {
        const { x, y } = this.viewport.get_Size(ViewportMouseInputEventManager.#tmp_vector2_2);
        const { offsetX, offsetY } = event;
        this._mouse_position.set(offsetX, offsetY);
        this._mouse_position_normalized.set(
            x === 0 ? -1 : (offsetX / x * 2 - 1),
            y === 0 ? -1 : (1 - offsetY / y * 2)
        );
    }

    private update_MouseKey(event: MouseEvent, down: boolean) {
        this.mouse_button_map.set(this.get_MouseButton(event), down);
    }

    private _on_MouseEntered = this.on_MouseEntered.bind(this);
    private on_MouseEntered(event: MouseEvent) {
        this.is_mouse_inside = true;
        this.update_MousePosition(event);
        this.trigger_MouseEvent(
            new MouseEnterLeaveInputEvent().set_Viewport(this.viewport).set_Inside(true)
        );
    }

    private _on_MouseLeaved = this.on_MouseLeaved.bind(this);
    private on_MouseLeaved(event: MouseEvent) {
        this.is_mouse_inside = false;
        this.trigger_MouseEvent(
            new MouseEnterLeaveInputEvent().set_Viewport(this.viewport).set_Inside(false)
        );
    }

    private _on_MouseMoved = this.on_MouseMoved.bind(this);
    private on_MouseMoved(event: MouseEvent) {
        if (event.target !== this.canvas) return;
        const last_mouse_position = ViewportMouseInputEventManager.#tmp_vector2_0.copy(this._mouse_position);
        const last_mouse_position_normalized = ViewportMouseInputEventManager.#tmp_vector2_1.copy(this._mouse_position_normalized);
        this.update_MousePosition(event);
        const relative = last_mouse_position.sub(this._mouse_position, last_mouse_position);
        const relative_normalized = last_mouse_position_normalized.sub(this._mouse_position_normalized, last_mouse_position_normalized);
        this.trigger_MouseEvent(
            new MouseMotionInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Motion(relative, relative_normalized)
        );
    }

    private _on_MouseDown = this.on_MouseDown.bind(this);
    private on_MouseDown(event: MouseEvent) {
        if (event.target !== this.canvas) return;
        this.update_MouseKey(event, true);
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(this.get_MouseButton(event), true, false, false)
        );
    }

    private _on_MouseUp = this.on_MouseUp.bind(this);
    private on_MouseUp(event: MouseEvent) {
        if (event.target !== this.canvas) return;
        this.update_MouseKey(event, false);
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(this.get_MouseButton(event), false, false, false)
        );
    }

    private _on_Click = this.on_Click.bind(this);
    private on_Click(event: MouseEvent) {
        if (event.target !== this.canvas) return;
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(MouseButton.Left, false, true, false)
        );
    }

    private _on_DoubleClick = this.on_DoubleClick.bind(this);
    private on_DoubleClick(event: MouseEvent) {
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(MouseButton.Left, false, false, true)
        );
    }

    private _on_RightClick = this.on_RightClick.bind(this);
    private on_RightClick(event: MouseEvent) {
        event.preventDefault();
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(MouseButton.Right, false, true, false)
        );
    }

    private _on_Wheel = this.on_Wheel.bind(this);
    private on_Wheel(event: WheelEvent) {
        event.preventDefault();
        const button = event.deltaY < 0 ? MouseButton.WheelUp : MouseButton.WheelDown;
        this.trigger_MouseEvent(
            new MouseButtonInputEvent()
                .set_Viewport(this.viewport)
                .set_Compose(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey)
                .set_Position(this._mouse_position, this._mouse_position_normalized)
                .set_Button(button, true, false, false)
        );
    }

    dispose() {
        this.canvas.removeEventListener('mouseenter', this._on_MouseEntered);
        this.canvas.removeEventListener('mouseleave', this._on_MouseLeaved);
        this.canvas.removeEventListener('mousemove', this._on_MouseMoved);
        this.canvas.removeEventListener('mousedown', this._on_MouseDown);
        this.canvas.removeEventListener('mouseup', this._on_MouseUp);
        this.canvas.removeEventListener('click', this._on_Click);
        this.canvas.removeEventListener('dblclick', this._on_DoubleClick);
        this.canvas.removeEventListener('contextmenu', this._on_RightClick);
        this.canvas.removeEventListener('wheel', this._on_Wheel);
        this.signal_mouse_event.clear();
        this.signal_mouse_enetered.clear();
        this.signal_mouse_leaved.clear();
    }
}
