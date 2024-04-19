import type { WebGL2RenderState } from "../WebGL2RenderState";
import { RenderStateTexture } from "../../render_state_objects/texture/RenderStateTexture";
import { RenderStateTextureSampler } from "../../render_state_objects/texture/RenderStateTextureSampler";
import { RenderStateObjectRefCounted } from "../../render_state_objects/RenderStateObject";
import { Ref } from "@/system/utils/RefCounted";

export class WebGL2RenderStateTexture extends RenderStateTexture<WebGL2RenderState> {
    public readonly texture: WebGLTexture;

    public active_slot: number | undefined = undefined;

    public data_type: number;

    constructor(render_state: WebGL2RenderState, texture: WebGLTexture, type: number, constant: boolean, format: number, levels: number, data_type: number, wrap_s: number, wrap_t: number, wrap_r: number, min_filter: number, mag_filter: number) {
        super(render_state, type, constant, format, levels, wrap_s, wrap_t, wrap_r, min_filter, mag_filter);
        this.texture = texture;
        this.data_type = data_type;
    }
}

export class WebGL2RenderStateTextureSampler extends RenderStateTextureSampler<WebGL2RenderState> {
    public readonly sampler: WebGLSampler;

    constructor(render_state: WebGL2RenderState, sampler: WebGLSampler, wrap_s: number, wrap_t: number, wrap_r: number, min_filter: number, mag_filter: number) {
        super(render_state, wrap_s, wrap_t, wrap_r, min_filter, mag_filter);
        this.sampler = sampler;
    }
}

export class WebGL2RenderStateSampledTexture extends RenderStateObjectRefCounted<WebGL2RenderState> {
    public slot: number | undefined = undefined;

    private readonly texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();
    private readonly sampler_ref: Ref<WebGL2RenderStateTextureSampler> = new Ref();

    public get texture() { return this.texture_ref.value; }
    public get sampler() { return this.sampler_ref.value; }

    constructor(render_state: WebGL2RenderState, texture: WebGL2RenderStateTexture | undefined, sampler: WebGL2RenderStateTextureSampler | undefined) {
        super(render_state);
        this.texture_ref.value = texture;
        this.sampler_ref.value = sampler;
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.sampler_ref.clear();
    }
}