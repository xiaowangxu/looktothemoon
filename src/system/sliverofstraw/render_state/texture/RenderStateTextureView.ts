import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateTexture, RenderStateTextureDimension } from "./RenderStateTexture";
import type { RenderStateMultiSampleTexture } from "./RenderStateMultiSampleTexture";
import { Ref } from "@/system/utils/RefCounted";

export abstract class RenderStateTextureView<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly dimension: RenderStateTextureDimension;
    public readonly texture_ref: Ref<RenderStateTexture<T> | RenderStateMultiSampleTexture<T>> = new Ref();

    constructor(render_state: T, texture: RenderStateTexture<T> | RenderStateMultiSampleTexture<T>, dimension: RenderStateTextureDimension) {
        super(render_state);
        this.texture_ref.value = texture;
        this.dimension = dimension;
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.render_state.delete_TextureView(this);
    }
}