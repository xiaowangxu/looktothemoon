import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { RenderServerTexture } from "../../render_server/texture/RenderServerTexture";
import type { WebGPURenderStateTextureSampler } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTextureSampler";

export abstract class TextureResource extends Resource {

    protected render_server_texture_ref: Ref<RenderServerTexture> = new Ref();
    public get render_server_texture() { return this.render_server_texture_ref.expect; }

    public get default_sampler(): WebGPURenderStateTextureSampler | undefined { return undefined; }

    public get has_mipmap() { return this.render_server_texture_ref.expect.mipmap_level_count > 1; };

    protected dispose(): void {
        this.render_server_texture_ref.clear();
        super.dispose();
    }
}