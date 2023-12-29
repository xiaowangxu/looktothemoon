import { type RefCounted } from "../utils/RefCounted";
import type { RenderState } from "./RenderState";

let id = 0;

export abstract class RenderStateObject<T extends RenderState<T>> implements RefCounted {
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

    public readonly id: number = id++;
    public readonly render_state: T;

    constructor(render_state: T) {
        this.render_state = render_state;
    }

    public abstract dispose(): void;
}
