import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderStateTextureDimension, WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination, type WebGPURenderStateTexture } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import type { WebGPURenderStateTextureView } from "../../../sliverofstraw/render_state_object/texture/WebGPURenderStateTextureView";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import { RenderServer } from "../RenderServer";
import type { WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";

export class RenderServerTexture extends RenderServerObjectRefCounted {

    public readonly texture_ref: ReadonlyRef<WebGPURenderStateTexture>;
    public readonly texture_view_ref: ReadonlyRef<WebGPURenderStateTextureView>;

    public get usage() { return this.texture_ref.expect.usage; }
    public get format() { return this.texture_ref.expect.format; }
    public get dimension() { return this.texture_ref.expect.dimension; }
    public get width() { return this.texture_ref.expect.width; }
    public get height() { return this.texture_ref.expect.height; }
    public get depth() { return this.texture_ref.expect.depth; }
    public get mipmap_level_count() { return this.texture_ref.expect.mipmap_level_count; }

    constructor(texture: WebGPURenderStateTexture, texture_view: WebGPURenderStateTextureView) {
        super();
        this.texture_ref = new ReadonlyRef(texture);
        this.texture_view_ref = new ReadonlyRef(texture_view);
    }

    public update_Data(
        dst_destination: WebGPURendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined, dst_z: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined, dst_d: number | undefined,
        data: WebGPURenderStateBufferData,
        data_w: number | undefined,
        data_h: number | undefined,
        data_offset?: number | undefined,
    ) {
        this.texture_ref.expect.update_Data(dst_destination, dst_mipmap_level, dst_x, dst_y, dst_z, dst_w, dst_h, dst_d,
            data, data_w, data_h, data_offset);
    }

    static create(
        usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat, dimension: WebGPURenderStateTextureDimension, width: number, height: number, depth: number, mipmap_level_count: number = 1,
        view_dimension?: WebGPURenderStateTextureDimension, part?: WebGPURendetStateTextureDestination, base_layer?: number, layer_count?: number, base_mipmap?: number, mipmap_count?: number,
    ) {
        const texture = RenderServer.render_state.create_Texture(
            usage, format, dimension,
            width, height, depth, mipmap_level_count,
        ).expect();
        return new RenderServerTexture(texture, RenderServer.render_state.create_TextureView(texture, view_dimension, part, base_layer, layer_count, base_mipmap, mipmap_count).expect());
    }

    static create_Image(
        image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count: number = 1, generate_mipmap: boolean = false,
        view_dimension?: WebGPURenderStateTextureDimension, part?: WebGPURendetStateTextureDestination, base_layer?: number, layer_count?: number, base_mipmap?: number, mipmap_count?: number,
    ) {
        const texture = RenderServer.render_state.create_Texture(
            WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst | WebGPURenderStateTextureUsage.Attchment,
            WebGPURenderStateTextureFormat.RGBA8,
            WebGPURenderStateTextureDimension.D2,
            width, height, 1, mipmap_level_count,
        ).expect();
        RenderServer.render_state.device.queue.copyExternalImageToTexture(
            { source: image, flipY: true },
            { texture: texture.texture },
            { width, height, depthOrArrayLayers: 1 },
        );
        if (generate_mipmap && texture.mipmap_level_count > 1) {
            RenderServer.render_state.generate_Mipmap(texture);
        }
        return new RenderServerTexture(texture, RenderServer.render_state.create_TextureView(texture, view_dimension, part, base_layer, layer_count, base_mipmap, mipmap_count).expect());
    }

    public dispose(): void {
        this.texture_ref.clear();
        this.texture_view_ref.clear();
    }
}