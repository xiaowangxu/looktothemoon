import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import { type RenderStateTextureUsage, RenderStateTextureDimension, type RenderStateTextureFormat, RendetStateTextureDestination } from "./RenderStateTexture";
import type { RenderStateTextureView } from "./RenderStateTextureView";

export abstract class RenderStateMultiSampleTexture<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly usage: RenderStateTextureUsage;
    public get dimension(): RenderStateTextureDimension { return RenderStateTextureDimension.D2 };
    public readonly format: RenderStateTextureFormat;

    public readonly width: number;
    public readonly height: number;
    public get depth() { return 1; };

    public get mipmap_level_count(): number { return 1; }
    public readonly sample_count: number;

    constructor(
        render_state: T,
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        width: number, height: number, sample_count: number,
    ) {
        super(render_state);
        this.usage = usage;
        this.format = format;
        this.width = width;
        this.height = height;
        this.sample_count = sample_count;
    }

    public dispose(): void {
        this.render_state.delete_MultiSampleTexture(this);
    }
}