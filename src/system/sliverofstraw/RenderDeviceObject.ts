import { RefCountedBase } from "../utils/RefCounted";
import type { RenderDevice } from "./RenderDevice";
import type { RenderState } from "./RenderState";

let id = 0;

export abstract class RenderDeviceObject<T extends RenderState<T>> extends RefCountedBase {
    public readonly id: number = id++;
    public readonly render_device: RenderDevice<T>;

    public get render_state(): T { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>) {
        super();
        this.render_device = render_device;
    }

    public abstract dispose(): void;
}