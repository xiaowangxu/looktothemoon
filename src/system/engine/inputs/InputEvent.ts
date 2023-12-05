import { Resource } from "../resources/Resource";

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