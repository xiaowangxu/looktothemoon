import { RenderStateTexture } from "../../render_state_objects/RenderStateTexture";
import type { WebGL2RenderState } from "../WebGL2RenderState";

export class WebGL2RenderStateTexture extends RenderStateTexture<WebGL2RenderState> {
    public readonly texture: WebGLTexture;

    public readonly texel_format: number;
    public readonly data_type: number;

    constructor(render_state: WebGL2RenderState, texture: WebGLTexture, type: number, format: number, texel_format: number, data_type: number, wrap_s: number, wrap_t: number, min_filter: number, mag_filter: number) {
        super(render_state, type, format, wrap_s, wrap_t, min_filter, mag_filter);
        this.texture = texture;
        this.texel_format = texel_format;
        this.data_type = data_type;
    }
}