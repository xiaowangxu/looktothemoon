import type { Viewport } from "../../nodes/Node";

export class ViewportInputManager {
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
