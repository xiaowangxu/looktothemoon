import type { RenderState } from "../../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateTexture, RenderStateTextureDimension } from "./RenderStateTexture";
import type { RenderStateMultiSampleTexture } from "./RenderStateMultiSampleTexture";
import { Ref } from "@/system/utils/RefCounted";

export abstract class RenderStateTextureView<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly dimension: RenderStateTextureDimension;
    public readonly texture_ref: Ref<RenderStateTexture<T> | RenderStateMultiSampleTexture<T>> = new Ref();
    public readonly is_multi_sampled: boolean;

    constructor(render_state: T, texture: RenderStateTexture<T> | RenderStateMultiSampleTexture<T>, dimension: RenderStateTextureDimension, is_multi_sampled: boolean) {
        super(render_state);
        this.texture_ref.value = texture;
        this.dimension = dimension;
        this.is_multi_sampled = is_multi_sampled;
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.render_state.delete_TextureView(this);
    }
}