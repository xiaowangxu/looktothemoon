import { Ref } from "@/system/utils/RefCounted";
import { Resource } from "../Resource";
import type { Config } from "../../ConfiguredObject";
import type { WebGL2RenderStateTexture } from "@/system/sliverofstraw/webgl2/webgl2_render_state_objects/WebGL2RenderStateTexture";
import { RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureWrap } from "@/system/sliverofstraw/render_state/RenderState";

export abstract class TextureResource extends Resource {
    protected readonly texture_ref: Ref<WebGL2RenderStateTexture> = new Ref();

    public get texture() { return this.texture_ref.expect; }
    public get width() { return this.texture.width; }
    public get height() { return this.texture.height; }
    public get depth() { return this.texture.depth; }

    protected _wrap_s: RenderStateTextureWrap = RenderStateTextureWrap.Clamp;
    public get wrap_s() { return this._wrap_s; }

    protected _wrap_t: RenderStateTextureWrap = RenderStateTextureWrap.Clamp;
    public get wrap_t() { return this._wrap_t; }

    protected _wrap_r: RenderStateTextureWrap = RenderStateTextureWrap.Clamp;
    public get wrap_r() { return this._wrap_r; }

    protected _min_filter: RenderStateTextureMinFilter = RenderStateTextureMinFilter.Linear;
    public get min_filter() { return this._min_filter; }

    protected _mag_filter: RenderStateTextureMagFilter = RenderStateTextureMagFilter.Linear;
    public get mag_filter() { return this._mag_filter; }

    public get render_server() { return this.config.render_server; }

    constructor(config: Config) {
        super(config);
    }

    protected dispose(): void {
        console.log(">>> dispose <TextureResource>", this.rid);
        this.texture_ref.clear();
    }
}

export abstract class ParameterMutableTextureResource extends TextureResource {
    public set wrap_s(val: RenderStateTextureWrap) {
        if (this._wrap_s !== val) {
            this._wrap_s = val;
            this.render_server.render_state.set_TextureParameters(this.texture, this._wrap_s);
        }
    }
    public set wrap_t(val: RenderStateTextureWrap) {
        if (this._wrap_t !== val) {
            this._wrap_t = val;
            this.render_server.render_state.set_TextureParameters(this.texture, undefined, this._wrap_t);
        }
    }
    public set wrap_r(val: RenderStateTextureWrap) {
        if (this._wrap_r !== val) {
            this._wrap_r = val;
            this.render_server.render_state.set_TextureParameters(this.texture, undefined, undefined, this._wrap_r);
        }
    }
    public set min_filter(val: RenderStateTextureMinFilter) {
        if (this._min_filter !== val) {
            this._min_filter = val;
            this.render_server.render_state.set_TextureParameters(this.texture, undefined, undefined, undefined, this._min_filter);
        }
    }
    public set mag_filter(val: RenderStateTextureMagFilter) {
        if (this._mag_filter !== val) {
            this._mag_filter = val;
            this.render_server.render_state.set_TextureParameters(this.texture, undefined, undefined, undefined, undefined, this.mag_filter);
        }
    }
}