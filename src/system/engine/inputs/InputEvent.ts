import { ResourceBase } from "../resources/Resource";

export class InputEvent extends ResourceBase {
    public static readonly class_name: string = "InputEvent";

    private _cancelled: boolean = false;
    public get cancelled() {
        return this._cancelled;
    }

    public mark_Cancelled() {
        this._cancelled = true;
    }

    public match(event: InputEvent, with_pressed: boolean): boolean {
        return false;
    }

    protected dispose(): void { }
}