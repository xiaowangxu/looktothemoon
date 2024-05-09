import { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBufferData } from "../buffer/WebGPURenderStateBuffer";

export enum WebGPURenderStateTextureDimension {
    D1 = '1d',
    D2 = '2d',
    D2Array = '2d-array',
    CubeMap = 'cube',
    CubeMapArray = 'cube-array',
    D3 = '3d',
}

export enum WebGPURenderStateTextureFormat {
    RGBA32F = 'rgba32float',
    RGBA16F = 'rgba16float',
    R32U = 'r32uint',
    R16F = 'r16float',
    R32F = 'r32float',
    RGBA32U = 'rgba32uint',
    RGBA8 = 'rgba8unorm', // rgba8unorm
    BGRA8 = 'bgra8unorm',
    SRGBA8 = 'rgba8unorm-srgb', // rgba8unorm-srgb
    SBGRA8 = 'bgra8unorm-srgb',
    D24 = 'depth24plus',
    D24S8 = 'depth24plus-stencil8',
    D32F = 'depth32float',
    D32FS8 = 'depth32float-stencil8'
}

export enum WebGPURenderStateTextureUsage {
    CopySrc = 0x01,
    CopyDst = 0x02,
    Uniform = 0x04,
    Storage = 0x08,
    Attchment = 0x16,
}

export enum WebGPURendetStateTextureDestination {
    All = 'all',
    Depth = 'depth-only',
    Stencil = 'stencil-only',
}

export class WebGPURenderStateTexture extends WebGPURenderObjectRefCounted {

    public readonly texture: GPUTexture;

    public readonly usage: WebGPURenderStateTextureUsage;
    public readonly dimension: WebGPURenderStateTextureDimension;
    public readonly format: WebGPURenderStateTextureFormat;
    public readonly width: number;
    public readonly height: number;
    public readonly depth: number;
    public readonly mipmap_level_count: number = 1;

    constructor(
        render_state: WebGPURenderState,
        usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat,
        dimension: WebGPURenderStateTextureDimension, width: number, height: number, depth: number,
        mipmap_level_count: number = 1,
        texture: GPUTexture,
    ) {
        super(render_state);
        this.usage = usage;
        this.dimension = dimension;
        this.format = format;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.mipmap_level_count = mipmap_level_count;
        this.texture = texture;
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
    public update_Data(dst_destination: WebGPURendetStateTextureDestination | undefined, dst_mipmap_level: number | undefined, dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined, dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined, data: WebGPURenderStateBufferData, data_w: number | undefined, data_h: number | undefined, data_offset: number | undefined): void {
        this.render_state.device.queue.writeTexture(
            {
                texture: this.texture,
                mipLevel: dst_mipmap_level,
                origin: { x: dst_x, y: dst_y, z: dst_z },
                aspect: dst_destination ?? WebGPURendetStateTextureDestination.All,
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

    public dispose() {
        this.render_state.delete_Texture(this);
    }
}