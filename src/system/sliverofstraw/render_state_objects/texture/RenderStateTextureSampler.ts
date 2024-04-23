import type { RenderState } from "../../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateDepthCompareFunc } from "../pipeline/RenderStateProgramState";

export enum RenderStateTextureWrap {
    Clamp, Repeat, MirrorRepeat,
}

export enum RenderStateTextureFilter {
    Nearest, Linear,
}

export abstract class RenderStateTextureSampler<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {
    
    public readonly wrap_u: RenderStateTextureWrap;
    public readonly wrap_v: RenderStateTextureWrap;
    public readonly wrap_w: RenderStateTextureWrap;
    public readonly min_filter: RenderStateTextureFilter;
    public readonly mag_filter: RenderStateTextureFilter;
    public readonly mipmap_filter: RenderStateTextureFilter;
    public readonly compare: RenderStateDepthCompareFunc | undefined;
    public readonly min_lod: number = 1;
    public readonly max_lod: number = 32;
    public readonly anisotropy: number = 1;

    constructor(
        render_state: T,
        wrap_u: RenderStateTextureWrap, wrap_v: RenderStateTextureWrap, wrap_w: RenderStateTextureWrap,
        min_filter: RenderStateTextureFilter, mag_filter: RenderStateTextureFilter, mipmap_filter: RenderStateTextureFilter,
        compare: RenderStateDepthCompareFunc | undefined = undefined,
        min_lod: number = 1, max_lod: number = 32,
        anisotropy: number = 1,
    ) {
        super(render_state);
        this.wrap_u = wrap_u;
        this.wrap_v = wrap_v;
        this.wrap_w = wrap_w;
        this.min_filter = min_filter;
        this.mag_filter = mag_filter;
        this.mipmap_filter = mipmap_filter;
        this.compare = compare;
        this.min_lod = min_lod;
        this.max_lod = max_lod;
        this.anisotropy = anisotropy;
    }

    public dispose() {
        this.render_state.delete_TextureSampler(this);
    }
}
