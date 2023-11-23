import { RefCountedBase } from "../utils/RefCounted";
import type { RenderState } from "./RenderState";

let id = 0;

export abstract class RenderStateObject<T extends RenderState<T>> extends RefCountedBase {
    public readonly id: number = id++;
    public readonly render_state: RenderState<T>;

    constructor(render_state: RenderState<T>) {
        super();
        this.render_state = render_state;
    }

    public abstract dispose(): void;
}
