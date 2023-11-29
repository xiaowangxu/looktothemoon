import type { RenderState } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";

export abstract class RenderStateTexture<T extends RenderState<T>> extends RenderStateObject<T> {
    public width: number = 0;
    public height: number = 0;
    
    public readonly type: number;
    public readonly format: number;

    public readonly wrap_s: number;
    public readonly wrap_t: number;
    public readonly min_filter: number;
    public readonly mag_filter: number;

    constructor(render_state: RenderState<T>, type: number, format: number, wrap_s: number, wrap_t: number, min_filter: number, mag_filter: number) {
        super(render_state);
        this.type = type;
        this.format = format;
        this.wrap_s = wrap_s;
        this.wrap_t = wrap_t;
        this.min_filter = min_filter;
        this.mag_filter = mag_filter;
    }

    public dispose() {
        console.log(">>> dispsoe <RenderStateTexture>");
        this.render_state.delete_Texture(this);
    }
}