import { TextureResource } from "../TextureResource";

export abstract class Texture2DResource extends TextureResource {
    public get width() { return this.render_server_texture_ref.expect.width; };
    public get height() { return this.render_server_texture_ref.expect.height; };
    public get format() { return this.render_server_texture_ref.expect.format; };
}