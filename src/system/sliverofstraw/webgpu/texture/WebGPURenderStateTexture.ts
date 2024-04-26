import type { RenderStateBufferData } from "../../render_state/buffer/RenderStateBuffer";
import { RenderStateTextureUsage, RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTexture, RendetStateTextureDestination } from "../../render_state/texture/RenderStateTexture";
import { WebGPURenderState } from "../WebGPURenderState";

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

    public update_Data(dst_destination: RendetStateTextureDestination | undefined, dst_mipmap_level: number | undefined, dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined, dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined, data: RenderStateBufferData, data_w: number | undefined, data_h: number | undefined, data_offset: number | undefined): void {
        this.render_state.device.queue.writeTexture(
            {
                texture: this.texture,
                mipLevel: dst_mipmap_level,
                origin: { x: dst_x, y: dst_y, z: dst_z },
                aspect: WebGPURenderState.RendetStateTextureDestination(dst_destination ?? RendetStateTextureDestination.All),
            },
            data,
            {
                offset: data_offset,
                bytesPerRow: data_w === undefined ? undefined : data_w * this.render_state.get_TextureFormatTexelBytes(this.format),
                rowsPerImage: data_h,
            },
            {
                width: dst_w ?? this.width,
                height: dst_h ?? this.height,
                depthOrArrayLayers: dst_d ?? this.depth,
            }
        );
    }
}