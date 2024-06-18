import { WebGPURenderStateTextureDimension, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination, type WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerTexture } from "../../../render_server/texture/RenderServerTexture";
import { Texture2DResource } from "./Texture2DResource";
import type { WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import { TextureCubeMapResource } from "./TextureCubeMapResource";

export class ImageTextureCubeMapResource extends TextureCubeMapResource {

    static create(format: WebGPURenderStateTextureFormat, width: number, height: number, mipmap_level_count: number = 1) {
        const texture = RenderServerTexture.create(
            WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst | WebGPURenderStateTextureUsage.Attchment,
            format, WebGPURenderStateTextureDimension.D2, width, height, 6, mipmap_level_count,
        );
        const image_texture_2d_resource = new ImageTextureCubeMapResource();
        image_texture_2d_resource.render_server_texture_ref.value = texture;
        return image_texture_2d_resource;
    }

    static create_Images(image_options: { image: GPUImageCopyExternalImageSource, width: number, height: number }[], mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Images(image_options, mipmap_level_count, generate_mipmap, WebGPURenderStateTextureDimension.CubeMap);
        const image_texture_2d_resource = new ImageTextureCubeMapResource();
        image_texture_2d_resource.render_server_texture_ref.value = texture;
        return image_texture_2d_resource;
    }

    public update_Data(
        dst_destination: WebGPURendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined,
        dst_layer: number,
        data: WebGPURenderStateBufferData,
        data_w: number | undefined,
        data_h: number | undefined,
        data_offset?: number | undefined,
    ) {
        this.render_server_texture_ref.expect.update_Data(dst_destination, dst_mipmap_level, dst_x, dst_y, dst_layer, dst_w, dst_h, undefined, data, data_w, data_h, data_offset);
    }

    public set_Images(image_options: { image: GPUImageCopyExternalImageSource, width: number, height: number }[], mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Images(image_options, mipmap_level_count, generate_mipmap, WebGPURenderStateTextureDimension.CubeMap);
        this.render_server_texture_ref.value = texture;
        this.trigger_Changed();
    }
}