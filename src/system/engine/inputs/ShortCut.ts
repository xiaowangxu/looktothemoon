import { Resource } from "../resources/Resource";
import { InputEvent } from "./InputEvent";

export class ShortCut extends Resource {
    public static readonly class_name: string = "ShortCut";

    public readonly events: InputEvent[];

    constructor(events: InputEvent[]) {
        super();
        this.events = events;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return this.events.some(e => e.match(event, with_pressed));
    }

    protected dispose(): void { }
}
