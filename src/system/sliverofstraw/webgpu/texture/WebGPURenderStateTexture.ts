import type { RenderStateBufferData } from "../../render_state/buffer/RenderStateBuffer";
import { RenderStateMultiSampleTexture } from "../../render_state/texture/RenderStateMultiSampleTexture";
import { RenderStateTextureUsage, RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTexture, RendetStateTextureDestination } from "../../render_state/texture/RenderStateTexture";
import type { RenderStateTextureView } from "../../render_state/texture/RenderStateTextureView";
import type { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateTexture extends RenderStateTexture<WebGPURenderState> {

    public readonly texture: GPUTexture;

    constructor(
        render_state: WebGPURenderState,
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        dimension: RenderStateTextureDimension, width: number, height: number, depth: number,
        mipmap_level_count: number = 1,
        texture: GPUTexture,
    ) {
        super(render_state, usage, format, dimension, width, height, depth, mipmap_level_count);
        this.texture = texture;
    }

    public create_View(part: RendetStateTextureDestination | undefined, dimension: RenderStateTextureDimension, base_layer: number, layer_count: number, base_mipmap: number, mipmap_count: number): RenderStateTextureView<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }

    public update_Data(dst_destination: RendetStateTextureDestination | undefined, dst_mipmap_level: number | undefined, dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined, dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined, data: RenderStateBufferData, data_w: number | undefined, data_h: number | undefined, data_offset: number | undefined): void {
        throw new Error("Method not implemented.");
    }
}