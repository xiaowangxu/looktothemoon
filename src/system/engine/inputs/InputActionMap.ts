import { Resource } from "../resources/Resource";
import { ActionInputEvent } from "./events/ActionInputEvent";
import { KeyInputEvent } from "./events/KeyInputEvent";
import { MouseButtonInputEvent } from "./events/mouse_events/MouseButtonInputEvent";
import { InputEvent } from "./InputEvent";
import { ShortCut } from "./ShortCut";

export class ShortCutActionMap extends Resource {
    public static readonly class_name: string = "InputActionMap";

    private input_action_map: Map<string, ShortCut> = new Map();

    private is_InputEventPressed(event: InputEvent) {
        if (event instanceof MouseButtonInputEvent) return event.pressed;
        if (event instanceof KeyInputEvent) return event.pressed;
        return false;
    }

    private is_InputEventEcho(event: InputEvent) {
        if (event instanceof KeyInputEvent) return event.echo;
        return false;
    }

    public parse_ActionInputEvent(event: InputEvent): ActionInputEvent[] {
        const action_input_events: ActionInputEvent[] = []
        for (const [action, shortcut] of this.input_action_map.entries()) {
            if (shortcut.match(event, false)) {
                const pressed = this.is_InputEventPressed(event);
                const echo = this.is_InputEventEcho(event);
                action_input_events.push(new ActionInputEvent().set_Action(action, pressed, echo));
                continue;
            }
        }
        return action_input_events;
    }

    public add_Action(action: string, shortcut: ShortCut) {
        this.input_action_map.set(action, shortcut);
    }

    protected dispose(): void { }
}