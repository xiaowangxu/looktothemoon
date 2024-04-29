import type { WebGPURenderStateDepthCompareFunc } from "../pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";

export enum WebGPURenderStateTextureWrap {
    Clamp,
    Repeat,
    MirrorRepeat,
}

export enum WebGPURenderStateTextureFilter {
    Nearest,
    Linear,
}

export class WebGPURenderStateTextureSampler extends WebGPURenderObjectRefCounted {

    public readonly sampler: GPUSampler;

    public readonly wrap_u: WebGPURenderStateTextureWrap;
    public readonly wrap_v: WebGPURenderStateTextureWrap;
    public readonly wrap_w: WebGPURenderStateTextureWrap;
    public readonly min_filter: WebGPURenderStateTextureFilter;
    public readonly mag_filter: WebGPURenderStateTextureFilter;
    public readonly mipmap_filter: WebGPURenderStateTextureFilter;
    public readonly compare: WebGPURenderStateDepthCompareFunc | undefined;
    public readonly min_lod: number = 1;
    public readonly max_lod: number = 32;
    public readonly anisotropy: number = 1;

    constructor(
        render_state: WebGPURenderState,
        wrap_u: WebGPURenderStateTextureWrap, wrap_v: WebGPURenderStateTextureWrap, wrap_w: WebGPURenderStateTextureWrap,
        min_filter: WebGPURenderStateTextureFilter, mag_filter: WebGPURenderStateTextureFilter, mipmap_filter: WebGPURenderStateTextureFilter,
        compare: WebGPURenderStateDepthCompareFunc | undefined = undefined,
        min_lod: number = 1, max_lod: number = 32,
        anisotropy: number = 1,
        sampler: GPUSampler,
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
        this.sampler = sampler;
    }

    public dispose() {
        this.render_state.delete_TextureSampler(this);
    }
}