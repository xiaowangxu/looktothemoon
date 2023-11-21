import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export type TextureSourceType = ArrayBufferView | ImageData | HTMLCanvasElement;

export class RenderTexture implements RefCounted {
    private readonly rd: RenderingDevice;

    public width: number = 0;
    public height: number = 0;

    public internal_format: number = 0;
    public samples: number = 1;

    private _renderbuffer: WebGLRenderbuffer | undefined = undefined;
    public get renderbuffer() { return this._renderbuffer; }
    public set renderbuffer(renderbuffer: WebGLRenderbuffer | undefined) { this._renderbuffer = renderbuffer; }

    public get compiled() { return this.renderbuffer !== undefined; }

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

    constructor(rd: RenderingDevice, internal_format: number, samples: number, width: number, height: number) {
        this.rd = rd;
        this.internal_format = internal_format;
        this.samples = samples;
        this.width = width;
        this.height = height;
    }

    public free() {
        console.log(">>>>> free render texture");
        this.rd.state.free_RenderTexture(this);
    }
}