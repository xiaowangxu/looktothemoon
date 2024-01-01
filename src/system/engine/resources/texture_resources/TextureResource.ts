import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { Config } from "../../ConfiguredObject";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureType } from "@/system/sliverofstraw/RenderState";

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
        this.texture_ref.value = this.render_server.empty_texture;
    }
}

export class ImageTextureResource extends TextureResource {
    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA8, 0).expect();
    }

    set_Image(image: ImageData) {
        this.render_server.render_state.gl.pixelStorei(this.render_server.render_state.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.render_server.render_state.alloc_Texture2D(this.texture, image.width, image.height, 0, RenderStateTextureDataFormat.RGBA, image.data);
        this.render_server.render_state.gl.pixelStorei(this.render_server.render_state.gl.UNPACK_FLIP_Y_WEBGL, false);
    }
}