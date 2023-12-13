import type { RenderState } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";

export abstract class RenderStateRenderBuffer<T extends RenderState<T>> extends RenderStateObject<T> {
    public width: number = 0;
    public height: number = 0;

    public readonly format: number;
    public readonly samples: number;

    constructor(render_state: T, format: number, samples: number,) {
        super(render_state);
        this.format = format;
        this.samples = samples;
    }
}