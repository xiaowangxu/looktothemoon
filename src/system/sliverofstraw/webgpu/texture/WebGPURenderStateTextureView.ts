import type { RenderStateTextureDimension } from "../../render_state/texture/RenderStateTexture";
import { RenderStateTextureView } from "../../render_state/texture/RenderStateTextureView";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateMultiSampleTexture } from "./WebGPURenderStateMultiSampleTexture";
import type { WebGPURenderStateTexture } from "./WebGPURenderStateTexture";

export class WebGPURenderStateTextureView extends RenderStateTextureView<WebGPURenderState> {

    public readonly texture_view: GPUTextureView;

    constructor(render_state: WebGPURenderState, texture: WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture, dimension: RenderStateTextureDimension, texture_view: GPUTextureView) {
        super(render_state, texture, dimension);
        this.texture_view = texture_view;
    }
}