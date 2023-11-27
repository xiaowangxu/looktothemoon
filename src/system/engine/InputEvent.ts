import { Vector2 } from "three";
import { SignalEmitter } from "../utils/SignalEmitter";
import type { Viewport } from "./SceneTree";
import { Resource } from "./Resource";

export class InputEvent extends Resource {
    public static readonly class_name: string = "InputEvent";

    private _canceled: boolean = false;
    public get canceled() {
        return this._canceled;
    }

    constructor() {
        super();
    }

    public mark_Canceled() {
        this._canceled = true;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return false;
    }

    protected dispose(): void { }
}

export class InputEventFromViewport extends InputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "InputEventFromViewport";

    public readonly viewport: Viewport | undefined;

    constructor(viewport: Viewport | undefined) {
        super();
        this.viewport = viewport;
    }
}

export class ComposeInputEvent extends InputEventFromViewport {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
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

export class MouseInputEvent extends ComposeInputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "MouseInputEvent";

    public readonly position: Vector2;
    public readonly position_normalized: Vector2;

    constructor(viewport: Viewport | undefined, position: Vector2, position_normalized: Vector2, ctrl: boolean, shift: boolean, alt: boolean, meta: boolean) {
        super(viewport, ctrl, shift, alt, meta);
        this.position = position.clone();
        this.position_normalized = position_normalized.clone();
    }
}

export class MouseEnterLeaveInputEvent extends InputEventFromViewport {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "MouseEnterLeaveInputEvent";

    public readonly inside: boolean;

    constructor(inside: boolean, viewport: Viewport | undefined) {
        super(viewport);
        this.inside = inside;
    }
}

export class MouseMotionInputEvent extends MouseInputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "MouseMotionInputEvent";

    public readonly relative: Vector2;
    public readonly relative_normalized: Vector2;

    constructor(
        relative: Vector2, relative_normalized: Vector2,
        viewport: Viewport, position: Vector2, position_normalized: Vector2,
        ctrl: boolean, shift: boolean, alt: boolean, meta: boolean
    ) {
        super(viewport, position, position_normalized, ctrl, shift, alt, meta);
        this.relative = relative.clone();
        this.relative_normalized = relative_normalized.clone();
    }
}

export enum MouseButton {
    Left, Middle, Right, Next, Prev, WheelUp, WheelDown, None
}

export class MouseButtonInputEvent extends MouseInputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
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

export class KeyInputEvent extends ComposeInputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
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

export class ActionInputEvent extends InputEvent {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
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

// InputManager

export class ShortCut extends Resource {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "ShortCut";

    public readonly events: InputEvent[];

    constructor(events: InputEvent[]) {
        super();
        this.events = events;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return this.events.some(e => e.match(event, with_pressed));
    }
}

export class InputActionMap extends Resource {
    protected dispose(): void {
        throw new Error("Method not implemented.");
    }
    public static readonly class_name: string = "InputActionMap";

    private input_action_map: Map<string, ShortCut> = new Map();

    constructor() {
        super();
    }

    private is_InputEventPressed(event: InputEvent) {
        if (event instanceof MouseButtonInputEvent) return event.pressed;
        if (event instanceof KeyInputEvent) return event.pressed;
        return false;
    }

    private is_InputEventEcho(event: InputEvent) {
        if (event instanceof KeyInputEvent) return event.echo;
        return false;
    }

    public parse_ActionInputEvent(event: InputEvent): ActionInputEvent | undefined {
        for (const [action, shortcut] of this.input_action_map.entries()) {
            if (shortcut.match(event, false)) {
                const pressed = this.is_InputEventPressed(event);
                const echo = this.is_InputEventEcho(event);
                return new ActionInputEvent(action, pressed, echo);
            }
        }
        return undefined;
    }

    public add_Action(action: string, shortcut: ShortCut) {
        this.input_action_map.set(action, shortcut);
    }
}

// ViewportInputEventManager

export class InputManager {
    private readonly viewport: Viewport;
    public get is_mouse_inside() { return this.viewport.mouse_event_manager.is_mouse_inside; }
    public get mouse_position() { return this.viewport.mouse_event_manager.mouse_position; }
    public get mouse_position_normalized() { return this.viewport.mouse_event_manager.mouse_position_normalized; }

    // signals
    public get signal_mouse_entered() { return this.viewport.mouse_event_manager.signal_mouse_enetered; }
    public get signal_mouse_leaved() { return this.viewport.mouse_event_manager.signal_mouse_leaved; }

    constructor(viewport: Viewport) {
        this.viewport = viewport;
    }

    public is_ActionJustPressed(action: string) {
        return this.viewport.action_event_manager.is_ActionPressed(action, false);
    }

    public is_ActionPressed(action: string) {
        return this.viewport.action_event_manager.is_ActionPressed(action, true);
    }

    public is_KeyJustPressed(key: string) {
        return this.viewport.key_event_manager.is_KeyPressed(key, false);
    }

    public is_KeyPressed(key: string) {
        return this.viewport.key_event_manager.is_KeyPressed(key, true);
    }
}

export class ViewportActionInputEventManager {
    private readonly viewport: Viewport;
    private action_map: Map<string, boolean> = new Map();

    constructor(viewport: Viewport) {
        this.viewport = viewport;
    }

    public is_ActionPressed(action: string, echo: boolean = true) {
        return this.action_map.has(action) && (echo || this.action_map.get(action) === false);
    }

    public is_ActionEcho(action: string) {
        return this.action_map.has(action) && this.action_map.get(action) === true;
    }

    public parse_ActionInputEvent(event: InputEvent) {
        const action_input_event = this.viewport.get_SceneTree()?.get_InputActionMap()?.parse_ActionInputEvent(event);
        if (action_input_event !== undefined) {
            this.update_Action(action_input_event);
        }
        return action_input_event;
    }

    private update_Action(action_input_event: ActionInputEvent) {
        const { action, pressed, echo } = action_input_event;
        if (pressed || echo) {
            this.action_map.set(action, echo);
        }
        else {
            this.action_map.delete(action);
        }
    }
}

export class ViewportMouseInputEventManager {
    private readonly viewport: Viewport;
    private get canvas() { return this.viewport.canvas; }
    private get canvas_size() {
        return this.viewport.size;
    }
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
    private _mouse_position: Vector2 = new Vector2(0, 0);
    private _mouse_position_normalized: Vector2 = new Vector2(0, 0);
    public get mouse_position() { return this._mouse_position.clone(); }
    public get mouse_position_normalized() { return this._mouse_position_normalized.clone(); }

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

    private get_MouseInputEventBaseParamaters(event: MouseEvent): [viewport: Viewport, position: Vector2, position_normalized: Vector2, ctrl: boolean, shift: boolean, alt: boolean, meta: boolean] {
        return [
            this.viewport,
            this.mouse_position, this.mouse_position_normalized,
            event.ctrlKey, event.shiftKey, event.altKey, event.metaKey
        ];
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
        const { x, y } = this.canvas_size;
        const { offsetX, offsetY } = event;
        this._mouse_position.set(offsetX, offsetY);
        this._mouse_position_normalized.set(
            x === 0 ? 0 : (offsetX / x * 2 - 1),
            y === 0 ? 0 : (1 - offsetY / y * 2),
        );
    }

    private update_MouseKey(event: MouseEvent, down: boolean) {
        // event.preventDefault();
        this.mouse_button_map.set(this.get_MouseButton(event), down);
    }

    private _on_MouseEntered = this.on_MouseEntered.bind(this);
    private on_MouseEntered(event: MouseEvent) {
        this.is_mouse_inside = true;
        this.update_MousePosition(event);
        this.signal_mouse_event.trigger(
            new MouseEnterLeaveInputEvent(true, this.viewport)
        );
    }

    private _on_MouseLeaved = this.on_MouseLeaved.bind(this);
    private on_MouseLeaved(event: MouseEvent) {
        this.is_mouse_inside = false;
        this.signal_mouse_event.trigger(
            new MouseEnterLeaveInputEvent(false, this.viewport)
        );
    }

    private _on_MouseMoved = this.on_MouseMoved.bind(this);
    private on_MouseMoved(event: MouseEvent) {
        const last_mouse_position = this.mouse_position;
        const last_mouse_position_normalized = this.mouse_position_normalized;
        this.update_MousePosition(event);
        const new_mouse_position = this.mouse_position;
        const new_mouse_position_normalized = this.mouse_position_normalized;
        const relative = new_mouse_position.sub(last_mouse_position);
        // console.log(`>>> relative ${relative.length()}`);
        const relative_normalized = new_mouse_position_normalized.sub(last_mouse_position_normalized);
        this.signal_mouse_event.trigger(
            new MouseMotionInputEvent(
                relative, relative_normalized,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_MouseDown = this.on_MouseDown.bind(this);
    private on_MouseDown(event: MouseEvent) {
        this.update_MouseKey(event, true);
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                this.get_MouseButton(event), true, false, false,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_MouseUp = this.on_MouseUp.bind(this);
    private on_MouseUp(event: MouseEvent) {
        this.update_MouseKey(event, false);
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                this.get_MouseButton(event), false, false, false,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_Click = this.on_Click.bind(this);
    private on_Click(event: MouseEvent) {
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                MouseButton.Left, false, true, false,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_DoubleClick = this.on_DoubleClick.bind(this);
    private on_DoubleClick(event: MouseEvent) {
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                MouseButton.Left, false, false, true,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_RightClick = this.on_RightClick.bind(this);
    private on_RightClick(event: MouseEvent) {
        event.preventDefault();
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                MouseButton.Right, false, true, false,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
        );
    }

    private _on_Wheel = this.on_Wheel.bind(this);
    private on_Wheel(event: WheelEvent) {
        event.preventDefault();
        const button = event.deltaY < 0 ? MouseButton.WheelUp : MouseButton.WheelDown;
        this.signal_mouse_event.trigger(
            new MouseButtonInputEvent(
                button, true, false, false,
                ...this.get_MouseInputEventBaseParamaters(event)
            )
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

export class ViewportKeyInputEventManager {
    private readonly viewport: Viewport;
    private get is_viewport_active() { return this.viewport.get_Input().is_mouse_inside; }

    private key_map: Map<string, boolean> = new Map();

    public is_KeyPressed(key: string, echo: boolean = true) {
        return this.key_map.has(key) && (echo || this.key_map.get(key) === false);
    }

    public is_KeyEcho(key: string) {
        return this.key_map.has(key) && this.key_map.get(key) === true;
    }

    // signals
    public readonly signal_key_event: SignalEmitter<(event: KeyInputEvent) => void> = new SignalEmitter();

    constructor(viewport: Viewport) {
        this.viewport = viewport;
        window.addEventListener('keydown', this._on_KeyDown);
        window.addEventListener('keyup', this._on_KeyUp);
    }

    private update_Key(event: KeyboardEvent, pressed: boolean) {
        event.preventDefault();
        const key = event.key;
        const echo = event.repeat;
        if (pressed || echo) {
            this.key_map.set(key, echo);
        }
        else {
            this.key_map.delete(key);
        }
    }

    private _on_KeyDown = this.on_KeyDown.bind(this);
    private on_KeyDown(event: KeyboardEvent) {
        if (this.is_viewport_active) {
            this.update_Key(event, true);
            this.signal_key_event.trigger(
                new KeyInputEvent(
                    event.key, event.code, true, event.repeat,
                    this.viewport, event.ctrlKey, event.shiftKey, event.altKey, event.metaKey
                )
            );
        }
    }

    private _on_KeyUp = this.on_KeyUp.bind(this);
    private on_KeyUp(event: KeyboardEvent) {
        if (this.is_viewport_active) {
            this.update_Key(event, false);
            this.signal_key_event.trigger(
                new KeyInputEvent(
                    event.key, event.code, false, event.repeat,
                    this.viewport, event.ctrlKey, event.shiftKey, event.altKey, event.metaKey
                )
            );
        }
    }

    public dispose() {
        window.removeEventListener('keydown', this._on_KeyDown);
        window.removeEventListener('keyup', this._on_KeyUp);
        this.signal_key_event.clear();
    }
}