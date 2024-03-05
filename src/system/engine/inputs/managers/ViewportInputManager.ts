import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Viewport } from "../../nodes/Node";

export class ViewportInputManager {
    private readonly viewport: Viewport;
    public get is_mouse_inside() { return this.viewport.mouse_event_manager.is_mouse_inside; }
    public get mouse_position() { return this.viewport.mouse_event_manager.mouse_position; }
    public get_MousePosition(target: Vector2) { return this.viewport.mouse_event_manager.get_MousePosition(target); }

    public get mouse_position_normalized() { return this.viewport.mouse_event_manager.mouse_position_normalized; }
    public get_MousePositionNormalized(target: Vector2) { return this.viewport.mouse_event_manager.get_MousePositionNormalized(target); }

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
