import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export type TextureSourceType = ArrayBufferView | ImageData | HTMLCanvasElement;

export class Texture implements RefCounted {
    private readonly rd: RenderingDevice;

    public width: number = 0;
    public height: number = 0;

    public levels: (TextureSourceType | undefined)[] = [];

    public internal_format: number = 0;
    public type: number = 0;
    public format: number = 0;

    public wrap_s: number = 0;
    public wrap_t: number = 0;
    public min_filter: number = 0;
    public mag_filter: number = 0;

    public mipmap: boolean = true;

    private _texture: WebGLTexture | undefined = undefined;
    public get texture() { return this._texture; }
    public set texture(texture: WebGLTexture | undefined) { this._texture = texture; }

    public get compiled() { return this.texture !== undefined; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice,
        levels: (TextureSourceType | undefined)[],
        internal_format: number, format: number, type: number,
        width: number, height: number,
        wrap_s: number, wrap_t: number, min_filter: number, mag_filter: number,
        mipmap: boolean
    ) {
        this.rd = rd;
        this.levels = levels;
        this.internal_format = internal_format;
        this.format = format;
        this.type = type;
        if (this.levels[0] instanceof ImageData) {
            this.width = this.levels[0].width;
            this.height = this.levels[0].height;
        }
        else {
            this.width = width;
            this.height = height;
        }
        this.wrap_s = wrap_s;
        this.wrap_t = wrap_t;
        this.min_filter = min_filter;
        this.mag_filter = mag_filter;
        this.mipmap = mipmap;
    }

    public free() {
        console.log(">>>>> free texture");
        this.rd.state.free_Texture(this);
    }
}