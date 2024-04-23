import type { RenderStateDepthCompareFunc } from "../../render_state_objects/pipeline/RenderStateProgramState";
import { RenderStateTextureFilter, RenderStateTextureSampler, RenderStateTextureWrap } from "../../render_state_objects/texture/RenderStateTextureSampler";
import type { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateTextureSampler extends RenderStateTextureSampler<WebGPURenderState> {

    public readonly sampler: GPUSampler;

    constructor(
        render_state: WebGPURenderState,
        wrap_u: RenderStateTextureWrap, wrap_v: RenderStateTextureWrap, wrap_w: RenderStateTextureWrap,
        min_filter: RenderStateTextureFilter, mag_filter: RenderStateTextureFilter, mipmap_filter: RenderStateTextureFilter,
        compare: RenderStateDepthCompareFunc | undefined = undefined,
        min_lod: number = 1, max_lod: number = 32,
        anisotropy: number = 1,
        sampler: GPUSampler,
    ) {
        super(render_state, wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare, min_lod, max_lod, anisotropy);
        this.sampler = sampler;
    }
}