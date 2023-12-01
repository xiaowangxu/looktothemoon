import { texture } from "three/examples/jsm/nodes/Nodes.js";
import { RenderStateTexture, RenderStateTextureSampler } from "../../render_state_objects/RenderStateTexture";
import type { WebGL2RenderState } from "../WebGL2RenderState";
import { Ref } from "@/system/utils/RefCounted";

export class WebGL2RenderStateTexture extends RenderStateTexture<WebGL2RenderState> {
    public readonly texture: WebGLTexture;

    public active_slot: number | undefined = undefined;

    public readonly texel_format: number;
    public readonly data_type: number;

    constructor(render_state: WebGL2RenderState, texture: WebGLTexture, type: number, constant: boolean, format: number, texel_format: number, levels: number, data_type: number, wrap_s: number, wrap_t: number,  wrap_r: number, min_filter: number, mag_filter: number) {
        super(render_state, type, constant, format, levels, wrap_s, wrap_t, wrap_r, min_filter, mag_filter);
        this.texture = texture;
        this.texel_format = texel_format;
        this.data_type = data_type;
    }
}

export class WebGL2RenderStateTextureSampler extends RenderStateTextureSampler<WebGL2RenderState> {
    public readonly sampler: WebGLSampler;

    constructor(render_state: WebGL2RenderState, sampler: WebGLSampler, wrap_s: number, wrap_t: number, min_filter: number, mag_filter: number) {
        super(render_state, wrap_s, wrap_t, min_filter, mag_filter);
        this.sampler = sampler;
    }
}