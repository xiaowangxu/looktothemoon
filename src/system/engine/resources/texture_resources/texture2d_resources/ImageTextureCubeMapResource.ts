import { WebGPURenderStateTextureDimension, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination, type WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerTexture, type RenderServerTextureImageOption } from "../../../render_server/texture/RenderServerTexture";
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

    static create_Images(image_options: RenderServerTextureImageOption[], mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Images(image_options, mipmap_level_count, generate_mipmap, WebGPURenderStateTextureDimension.CubeMap);
        const image_texture_2d_resource = new ImageTextureCubeMapResource();
        image_texture_2d_resource.render_server_texture_ref.value = texture;
        return image_texture_2d_resource;
    }

    /**
     *      +----+
     *      | y+ |
     * +----+----+----+----+
     * | x- | z- | x+ | z+ |
     * +----+----+----+----+
     *      | y- |
     *      +----+
     * x+, x-, y+, y-, z+, z-
     */
    private static create_CubeMapImages_from_Single(image: GPUImageCopyExternalImageSource, width: number, height: number): RenderServerTextureImageOption[] {
        if (width % 4 !== 0) throw new Error('<ImageTextureCubeMapResource> create_Images_from_Single: cubemap image has width not multiple of 4');
        if (height % 3 !== 0) throw new Error('<ImageTextureCubeMapResource> create_Images_from_Single: cubemap image has height not multiple of 3');
        if (width / 4 !== height / 3) throw new Error('<ImageTextureCubeMapResource> create_Images_from_Single: cubemap view is not square');
        const size = width / 4;
        return [
            { image, width: size, height: size, src_x: size * 2, src_y: size }, // x+
            { image, width: size, height: size, src_x: 0, src_y: size }, // x-
            { image, width: size, height: size, src_x: size, src_y: 0 }, // y+
            { image, width: size, height: size, src_x: size, src_y: size * 2 }, // y-
            { image, width: size, height: size, src_x: size * 3, src_y: size }, // z+
            { image, width: size, height: size, src_x: size, src_y: size }, // z-
        ];
    }

    static create_Image(image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count?: number, generate_mipmap?: boolean) {
        const images = ImageTextureCubeMapResource.create_CubeMapImages_from_Single(image, width, height);
        return ImageTextureCubeMapResource.create_Images(images, mipmap_level_count, generate_mipmap);
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

    public set_Images(image_options: RenderServerTextureImageOption[], mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Images(image_options, mipmap_level_count, generate_mipmap, WebGPURenderStateTextureDimension.CubeMap);
        this.render_server_texture_ref.value = texture;
        this.trigger_Changed();
    }

    public set_Image(image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count?: number, generate_mipmap?: boolean) {
        const images = ImageTextureCubeMapResource.create_CubeMapImages_from_Single(image, width, height);
        const texture = RenderServerTexture.create_Images(images, mipmap_level_count, generate_mipmap, WebGPURenderStateTextureDimension.CubeMap);
        this.render_server_texture_ref.value = texture;
        this.trigger_Changed();
    }
}