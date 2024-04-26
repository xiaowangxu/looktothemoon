import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";
import { WebGPURenderStateTextureDimension, type WebGPURenderStateTextureFormat, type WebGPURenderStateTextureUsage } from "./WebGPURenderStateTexture";

export class WebGPURenderStateMultiSampleTexture extends WebGPURenderStateObjectRefCounted {

    public readonly texture: GPUTexture;

    public readonly usage: WebGPURenderStateTextureUsage;
    public get dimension(): WebGPURenderStateTextureDimension { return WebGPURenderStateTextureDimension.D2 };
    public readonly format: WebGPURenderStateTextureFormat;

    public readonly width: number;
    public readonly height: number;
    public get depth() { return 1; };

    public get mipmap_level_count(): number { return 1; }
    public readonly sample_count: number;

    constructor(
        render_state: WebGPURenderState,
        usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat,
        width: number, height: number, sample_count: number,
        multi_sample_texture: GPUTexture,
    ) {
        super(render_state);
        this.usage = usage;
        this.format = format;
        this.width = width;
        this.height = height;
        this.sample_count = sample_count;
        this.texture = multi_sample_texture;
    }

    public dispose(): void {
        this.render_state.delete_MultiSampleTexture(this);
    }
}