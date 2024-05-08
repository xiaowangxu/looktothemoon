import { type RefCounted } from "../../utils/RefCounted";

let id = 1;

export abstract class RenderServerObject {

    public readonly id = id++;

}

export abstract class RenderServerObjectRefCounted extends RenderServerObject implements RefCounted {

    private _ref_count: number = 0;

    public get ref_count() { return this._ref_count; }

    public ref() {
        this._ref_count++;
    }

    public unref() {
        if (this._ref_count === 0) return;
        this._ref_count--;
        if (this._ref_count === 0) this.dispose();
    }

    public release() {
        if (this._ref_count === 0) this.dispose();
    }

    public abstract dispose(): void;
}