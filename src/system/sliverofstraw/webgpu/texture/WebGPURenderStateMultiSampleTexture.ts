import { RenderStateMultiSampleTexture } from "../../render_state_objects/texture/RenderStateMultiSampleTexture";
import { RenderStateTextureUsage, RenderStateTextureDimension, RenderStateTextureFormat } from "../../render_state_objects/texture/RenderStateTexture";
import type { RenderStateTextureView } from "../../render_state_objects/texture/RenderStateTextureView";
import type { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateMultiSampleTexture extends RenderStateMultiSampleTexture<WebGPURenderState> {

    public readonly multi_sample_texture: GPUTexture;

    constructor(
        render_state: WebGPURenderState,
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        width: number, height: number, sample_count: number,
        multi_sample_texture: GPUTexture,
    ) {
        super(render_state, usage, format, width, height, sample_count);
        this.multi_sample_texture = multi_sample_texture;
    }

    public create_View(): RenderStateTextureView<WebGPURenderState> {
        throw new Error();
    }
}