import { type RefCounted } from "../utils/RefCounted";
import type { WebGPURenderState } from "./WebGPURenderState";

let id = 0;

export abstract class WebGPURenderObject {

    public readonly id: number = id++;
    public readonly render_state: WebGPURenderState;

    constructor(render_state: WebGPURenderState) {
        this.render_state = render_state;
    }
}

export abstract class WebGPURenderObjectRefCounted extends WebGPURenderObject implements RefCounted {

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

    public abstract dispose(): void;
}