import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateMultiSampleCount, WebGPURenderStateMultiSampleTexture } from "./WebGPURenderStateMultiSampleTexture";
import { WebGPURenderStateTexture, type WebGPURenderStateTextureDimension } from "./WebGPURenderStateTexture";

export class WebGPURenderStateTextureView extends WebGPURenderObjectRefCounted {

    private _texture_view: GPUTextureView;
    public get texture_view() { return this._texture_view };

    public readonly multi_sample_count: WebGPURenderStateMultiSampleCount;

    public readonly dimension: WebGPURenderStateTextureDimension;
    public readonly texture_ref: Ref<WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture> = new Ref();

    constructor(render_state: WebGPURenderState, texture: WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture, dimension: WebGPURenderStateTextureDimension, multi_sample_count: WebGPURenderStateMultiSampleCount, texture_view: GPUTextureView) {
        super(render_state);
        this.texture_ref.value = texture;
        this.multi_sample_count = multi_sample_count;
        this.dimension = dimension;
        this._texture_view = texture_view;
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.render_state.delete_TextureView(this);
    }
}