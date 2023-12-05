import type { Viewport } from "../../nodes/Node";
import { SignalEmitter } from "../../../utils/SignalEmitter";
import { KeyInputEvent } from "../events/KeyInputEvent";

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
