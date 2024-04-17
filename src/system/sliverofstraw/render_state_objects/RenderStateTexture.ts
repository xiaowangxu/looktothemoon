import type { RenderState } from "../RenderState";
import { RenderStateObject } from "./RenderStateObject";

export abstract class RenderStateTexture<T extends RenderState<T>> extends RenderStateObject<T> {
    public width: number = 0;
    public height: number = 0;
    public depth: number = 0;

    public readonly type: number;
    public readonly constant: boolean;
    public levels: number;
    public format: number;

    public wrap_s: number;
    public wrap_t: number;
    public wrap_r: number;
    public min_filter: number;
    public mag_filter: number;

    constructor(render_state: T, type: number, constant: boolean, format: number, levels: number, wrap_s: number, wrap_t: number, wrap_r: number, min_filter: number, mag_filter: number) {
        super(render_state);
        this.type = type;
        this.constant = constant;
        this.format = format;
        this.levels = levels;
        this.wrap_s = wrap_s;
        this.wrap_t = wrap_t;
        this.wrap_r = wrap_r;
        this.min_filter = min_filter;
        this.mag_filter = mag_filter;
    }

    public dispose() {
        this.render_state.delete_Texture(this);
    }
}

export abstract class RenderStateTextureSampler<T extends RenderState<T>> extends RenderStateObject<T> {
    public wrap_s: number;
    public wrap_t: number;
    public wrap_r: number;
    public min_filter: number;
    public mag_filter: number;

    constructor(render_state: T, wrap_s: number, wrap_t: number, wrap_r: number, min_filter: number, mag_filter: number) {
        super(render_state);
        this.wrap_s = wrap_s;
        this.wrap_t = wrap_t;
        this.wrap_r = wrap_r;
        this.min_filter = min_filter;
        this.mag_filter = mag_filter;
    }

    public dispose() {
        this.render_state.delete_TextureSampler(this);
    }
}