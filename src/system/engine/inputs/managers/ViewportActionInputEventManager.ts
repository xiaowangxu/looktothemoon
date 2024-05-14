import type { Viewport } from "../../nodes/Node";
import { ActionInputEvent } from "../events/ActionInputEvent";
import { InputEvent } from "../InputEvent";

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
        const action_input_events = this.viewport.get_SceneTree()?.get_InputActionMap()?.parse_ActionInputEvent(event);
        if (action_input_events !== undefined) {
            for (const action_input_event of action_input_events) {
                this.update_Action(action_input_event);
            }
        }
        return action_input_events;
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
