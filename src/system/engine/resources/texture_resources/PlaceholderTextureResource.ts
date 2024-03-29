import type { Config } from "../../ConfiguredObject";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";
import { TextureResource } from "./TextureResource";


export class PlaceholderTextureResource extends TextureResource {
    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty);
    }
}
