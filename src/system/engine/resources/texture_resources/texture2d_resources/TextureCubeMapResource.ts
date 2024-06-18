import { TextureResource } from "../TextureResource";

export abstract class TextureCubeMapResource extends TextureResource {
    public get width() { return this.render_server_texture_ref.expect.width; };
    public get height() { return this.render_server_texture_ref.expect.height; };
    public get depth() { return this.render_server_texture_ref.expect.depth; };
    public get format() { return this.render_server_texture_ref.expect.format; };
}