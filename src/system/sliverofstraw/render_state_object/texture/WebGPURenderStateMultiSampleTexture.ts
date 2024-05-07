import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import { WebGPURenderStateTextureDimension, type WebGPURenderStateTextureFormat, type WebGPURenderStateTextureUsage } from "./WebGPURenderStateTexture";

export enum WebGPURenderStateMultiSampleCount {
    None = 1,
    MS2 = 2,
    MS4 = 4,
    MS8 = 8,
}

export class WebGPURenderStateMultiSampleTexture extends WebGPURenderObjectRefCounted {

    public readonly texture: GPUTexture;

    public readonly usage: WebGPURenderStateTextureUsage;
    public get dimension(): WebGPURenderStateTextureDimension { return WebGPURenderStateTextureDimension.D2 };
    public readonly format: WebGPURenderStateTextureFormat;

    public readonly width: number;
    public readonly height: number;
    public get depth() { return 1; };

    public get mipmap_level_count(): number { return 1; }
    public readonly multi_sample_count: WebGPURenderStateMultiSampleCount;

    constructor(
        render_state: WebGPURenderState,
        usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat,
        width: number, height: number, multi_sample_count: WebGPURenderStateMultiSampleCount,
        multi_sample_texture: GPUTexture,
    ) {
        super(render_state);
        this.usage = usage;
        this.format = format;
        this.width = width;
        this.height = height;
        this.multi_sample_count = multi_sample_count;
        this.texture = multi_sample_texture;
    }

    public dispose(): void {
        this.render_state.delete_MultiSampleTexture(this);
    }
}