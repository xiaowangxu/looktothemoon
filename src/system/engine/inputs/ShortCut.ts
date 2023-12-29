import { Resource } from "../resources/Resource";
import { InputEvent } from "./InputEvent";

export class ShortCut extends Resource {
    public static readonly class_name: string = "ShortCut";

    static #empty_events = [];
    public events: InputEvent[] = ShortCut.#empty_events;

    public set(events: InputEvent[]) {
        this.events = events;
        return this;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return this.events.some(e => e.match(event, with_pressed));
    }

    protected dispose(): void { }
}
