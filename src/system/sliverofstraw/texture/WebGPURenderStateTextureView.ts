import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";
import type { WebGPURenderStateMultiSampleTexture } from "./WebGPURenderStateMultiSampleTexture";
import type { WebGPURenderStateTexture, WebGPURenderStateTextureDimension } from "./WebGPURenderStateTexture";

export class WebGPURenderStateTextureView extends WebGPURenderStateObjectRefCounted {

    private _texture_view: GPUTextureView;
    public get texture_view() { return this._texture_view };

    public readonly dimension: WebGPURenderStateTextureDimension;
    public readonly texture_ref: Ref<WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture> = new Ref();

    constructor(render_state: WebGPURenderState, texture: WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture, dimension: WebGPURenderStateTextureDimension, texture_view: GPUTextureView) {
        super(render_state);
        this.texture_ref.value = texture;
        this.dimension = dimension;
        this._texture_view = texture_view;
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.render_state.delete_TextureView(this);
    }
}