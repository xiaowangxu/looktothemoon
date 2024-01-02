import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { Config } from "../../ConfiguredObject";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";
import { RenderServerPlainColorTexture } from "../../render_server/RenderServer";

export abstract class TextureResource extends Resource {
    protected readonly texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    public get texture() { return this.texture_ref.expect; }
    public get width() { return this.texture.width; }
    public get height() { return this.texture.height; }
    public get depth() { return this.texture.depth; }

    public get render_server() { return this.config.render_server; }

    constructor(config: Config) {
        super(config);
    }

    protected dispose(): void {
        console.log(">>> dispose <TextureResource>", this.rid);
        this.texture_ref.clear();
    }
}

export class PlaceholderTextureResource extends TextureResource {
    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.get_PlainColorTexture(RenderServerPlainColorTexture.Empty);
    }
}

export class ImageTextureResource extends TextureResource {
    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA8, 0, undefined, undefined, undefined, RenderStateTextureMinFilter.LinearMipmapLinear, RenderStateTextureMagFilter.Linear).expect();
    }

    public static is_SRGB(format: RenderStateTextureFormat) {
        return format === RenderStateTextureFormat.SRGB8 || format === RenderStateTextureFormat.SRGBA8;
    }

    public static get_TextureDataFormat(format: RenderStateTextureFormat) {
        switch (format) {
            case RenderStateTextureFormat.RGB8:
            case RenderStateTextureFormat.SRGB8: {
                return RenderStateTextureDataFormat.RGB;
            }
            case RenderStateTextureFormat.RGBA32F:
            case RenderStateTextureFormat.RGBA8:
            case RenderStateTextureFormat.SRGBA8: {
                return RenderStateTextureDataFormat.RGBA;
            }
            default: {
                throw new Error('<ImageTextureResource> get_TextureDataFormat: unknown image format');
            }
        }
    }

    set_Image(image: ImageData, format: RenderStateTextureFormat = RenderStateTextureFormat.SRGBA8, levels: number, y_flip: boolean = true) {
        this.render_server.render_state.set_PixelStoreYFlip(y_flip);
        this.render_server.render_state.set_TextureFormat(this.texture, format);
        this.render_server.render_state.set_TextureLevels(this.texture, levels);
        this.render_server.render_state.alloc_Texture2D(this.texture, image.width, image.height, 0, ImageTextureResource.get_TextureDataFormat(format), image.data);
        this.render_server.render_state.generate_Mipmap(this.texture);
    }
}