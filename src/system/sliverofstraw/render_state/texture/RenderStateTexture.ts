import type { Result } from "@/system/utils/Result";
import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateBufferData } from "../buffer/RenderStateBuffer";
import type { RenderStateTextureView } from "./RenderStateTextureView";

export enum RenderStateTextureDimension {
    D1, // 1d
    D2, D2Array, CubeMap, CubeMapArray, // 2d
    D3, // 3d
}

export enum RenderStateTextureFormat {
    RGBA32F,
    RGBA16F,
    R32U,
    RGBA32U,

    RGBA8, // rgba8unorm
    BGRA8,
    SRGBA8, // rgba8unorm-srgb
    SBGRA8,

    D24,
    D24S8,
    D32F,
    D32FS8
}

export enum RenderStateTextureUsage {
    CopySrc = 0x01,
    CopyDst = 0x02,
    Uniform = 0x04,
    Storage = 0x08,
    Attchment = 0x16,
}

export enum RendetStateTextureDestination {
    All, Depth, Stencil,
}

export abstract class RenderStateTexture<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public readonly usage: RenderStateTextureUsage;
    public readonly dimension: RenderStateTextureDimension;
    public readonly format: RenderStateTextureFormat;

    public readonly width: number;
    public readonly height: number;
    public readonly depth: number;

    public readonly mipmap_level_count: number = 1;

    constructor(
        render_state: T,
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        dimension: RenderStateTextureDimension, width: number, height: number, depth: number,
        mipmap_level_count: number = 1,
    ) {
        super(render_state);
        this.usage = usage;
        this.dimension = dimension;
        this.format = format;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.mipmap_level_count = mipmap_level_count;
    }

    /**
     * update a portion of this texture, but the size of the buffer can not be altered, use RenderState.create_Texture() instead
     * @throw do as much data check as you can
     * @param dst_destination an enumerated value defining which aspects of the texture to write the data to, mainly for depth stencil texture, if omitted isRendetStateTextureDestination.All
     * @param dst_mipmap_level the mip-map level of the texture to write the data to, if omitted is 0
     * @param dst_x the texture origin x to copy in, if omitted is 0
     * @param dst_y the texture origin y to copy in, if omitted is 0, ignored in D1 texture
     * @param dst_z the texture origin z to copy in, if omitted is 0, ignored in D1, D2 texture
     * @param dst_w the texture region width to copy in, if omitted is (width - dst_x)
     * @param dst_h the texture region height to copy in, if omitted is (height - dst_y), ignored in D1 texture
     * @param dst_d the texture region depth to copy in, if omitted is (depth - dst_z), ignored in D1, D2 texture
     * @param data an ArrayBuffer, TypedArray, or DataView
     * @param data_w use to specify data's dimension, required in D2, D3 texture, in D2, D3 texture this needs to be bigger than the dst_w
     * @param data_h use to specify data's dimension, required in D2 texture, in D3 texture this needs to be bigger than the dst_h
     * @param data_offset data offset in bytes, if omitted is 0
     */
    public abstract update_Data(
        dst_destination: RendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined,
        data: RenderStateBufferData,
        data_w: number | undefined, data_h: number | undefined, data_offset: number | undefined,
    ): void;

    public dispose() {
        this.render_state.delete_Texture(this);
    }
}