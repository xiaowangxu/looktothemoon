import { type RefCounted } from "../../utils/RefCounted";
import type { RenderState } from "./RenderState";

let id = 0;

export abstract class RenderStateObject<T extends RenderState<T>> {

    public readonly id: number = id++;
    public readonly render_state: T;

    constructor(render_state: T) {
        this.render_state = render_state;
    }
}

export abstract class RenderStateObjectRefCounted<T extends RenderState<T>> extends RenderStateObject<T> implements RefCounted {

    private _ref_count: number = 0;
    public get ref_count() { return this._ref_count; }
    public ref() { this._ref_count++; }
    public unref() {
        if (this._ref_count === 0) return;
        this._ref_count--;
        if (this._ref_count === 0) {
            this.dispose();
        }
    }

    public abstract dispose(): void;

}