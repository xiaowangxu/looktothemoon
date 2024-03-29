import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import type { Config } from "../../ConfiguredObject";
import { TextureResource } from "./TextureResource";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";

export class RenderTextureResource extends TextureResource {
    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty);
    }

    public set_Texture(texture: WebGL2RenderStateTexture | undefined) {
        this.texture_ref.value = texture ?? this.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty);
    }
}