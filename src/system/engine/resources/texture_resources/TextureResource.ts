import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { RenderServerTexture } from "../../render_server/texture/RenderServerTexture";
import type { WebGPURenderStateTextureSampler } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";
import type { WebGPURenderElementTextureSamplerCacheHash } from "@/system/sliverofstraw/render_element_object/texture_sampler/WebGPURenderElementTextureSamplerCache";
import { RenderServer } from "../../render_server/RenderServer";

export abstract class TextureResource extends Resource {

    protected render_server_texture_ref: Ref<RenderServerTexture> = new Ref();
    public get render_server_texture() { return this.render_server_texture_ref.expect; }

    //#region sampler

    private _default_sampler_hash: WebGPURenderElementTextureSamplerCacheHash | undefined;
    public get default_sampler_hash() { return this._default_sampler_hash; }
    public set default_sampler_hash(default_sampler_hash: WebGPURenderElementTextureSamplerCacheHash | undefined) {
        if (this._default_sampler_hash !== default_sampler_hash) {
            this._default_sampler_hash = default_sampler_hash;
            if (this._default_sampler_hash === undefined) {
                this._default_sampler = undefined;
            }
            else {
                this._default_sampler = RenderServer.get_TextureSamplerByHash(this._default_sampler_hash);
            }
            this.trigger_Changed();
        }
    }

    protected _default_sampler: WebGPURenderStateTextureSampler | undefined;
    public get default_sampler() { return this._default_sampler; }

    //#endregion

    public get has_mipmap() { return this.render_server_texture_ref.expect.mipmap_level_count > 1; };

    protected dispose(): void {
        this.render_server_texture_ref.clear();
        super.dispose();
    }
}