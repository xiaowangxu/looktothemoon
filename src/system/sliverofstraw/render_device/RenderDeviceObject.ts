import { type RefCounted } from "../../utils/RefCounted";
import type { RenderDevice } from "./RenderDevice";
import type { RenderState } from "../render_state/RenderState";

let id = 0;

export abstract class RenderDeviceObject<T extends RenderState<T>> implements RefCounted {
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
    public readonly render_device: RenderDevice<T>;

    public get render_state(): T { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>) {
        this.render_device = render_device;
    }

    public abstract dispose(): void;
}