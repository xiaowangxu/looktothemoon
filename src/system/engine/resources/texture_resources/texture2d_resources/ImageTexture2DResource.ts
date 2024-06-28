import { WebGPURenderStateTextureDimension, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination, type WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerTexture } from "../../../render_server/texture/RenderServerTexture";
import { Texture2DResource } from "./Texture2DResource";
import type { WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { ClassSaver } from "@/system/engine/classes/saver_loader/ClassSaverLoader";
import type { Rid } from "@/system/engine/Rid";
import type { ClassReader } from "@/system/engine/classes/saver_loader/ClassWriterReader";

export class ImageTexture2DResource extends Texture2DResource {

    public static class_name: string = 'ImageTexture2DResource';

    static create(format: WebGPURenderStateTextureFormat, width: number, height: number, mipmap_level_count: number = 1) {
        const texture = RenderServerTexture.create(
            WebGPURenderStateTextureUsage.Uniform | WebGPURenderStateTextureUsage.CopyDst | WebGPURenderStateTextureUsage.Attchment,
            format, WebGPURenderStateTextureDimension.D2, width, height, 1, mipmap_level_count,
        );
        const image_texture_2d_resource = new ImageTexture2DResource();
        image_texture_2d_resource.render_server_texture_ref.value = texture;
        return image_texture_2d_resource;
    }

    static create_Image(image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Image(image, width, height, mipmap_level_count, generate_mipmap, undefined, undefined, undefined, undefined, undefined, WebGPURenderStateTextureDimension.D2);
        const image_texture_2d_resource = new ImageTexture2DResource();
        image_texture_2d_resource.render_server_texture_ref.value = texture;
        return image_texture_2d_resource;
    }

    public update_Data(
        dst_destination: WebGPURendetStateTextureDestination | undefined,
        dst_mipmap_level: number | undefined,
        dst_x: number | undefined, dst_y: number | undefined,
        dst_w: number | undefined, dst_h: number | undefined,
        data: WebGPURenderStateBufferData,
        data_w: number | undefined,
        data_h: number | undefined,
        data_offset?: number | undefined,
    ) {
        this.render_server_texture_ref.expect.update_Data(dst_destination, dst_mipmap_level, dst_x, dst_y, undefined, dst_w, dst_h, undefined, data, data_w, data_h, data_offset);
    }

    private set_ImageInternal(image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count?: number, generate_mipmap?: boolean) {
        const texture = RenderServerTexture.create_Image(image, width, height, mipmap_level_count, generate_mipmap, undefined, undefined, undefined, undefined, undefined, WebGPURenderStateTextureDimension.D2);
        this.render_server_texture_ref.value = texture;
    }

    public set_Image(image: GPUImageCopyExternalImageSource, width: number, height: number, mipmap_level_count?: number, generate_mipmap?: boolean) {
        this.set_ImageInternal(image, width, height, mipmap_level_count, generate_mipmap);
        this.trigger_Changed();
    }

    // saver loader

    public static dump_Data(
        class_saver: ClassSaver,
        rid: Rid,
        data: Uint8Array,
        width: number,
        height: number,
        mipmap: boolean,
        mipmap_count: number | undefined,
        unique?: boolean,
        external?: string,
    ) {
        const refid = class_saver.create_Data(rid, ImageTexture2DResource.class_name, unique, external);
        class_saver.add_Property(refid, 'data', data);
        class_saver.add_Property(refid, 'width', width);
        class_saver.add_Property(refid, 'height', height);
        class_saver.add_Property(refid, 'mipmap', mipmap);
        class_saver.add_Property(refid, 'mipmap_count', mipmap_count);
        return refid;
    }

    public load(reader: ClassReader): void {
        const data = reader.get<Uint8Array>('data');
        const width = reader.get<number>('width');
        const height = reader.get<number>('height');
        const mipmap = reader.get<boolean>('mipmap');
        const mipmap_count = reader.get<number>('mipmap_count');

        if (data === undefined || width === undefined || height === undefined || mipmap === undefined) throw new Error(`<ImageTexture2DResource> load: ImageTexture's data is not complete`);

        const image = new ImageData(new Uint8ClampedArray(data), width, height, { colorSpace: 'srgb' });
        this.set_ImageInternal(image, width, height, mipmap_count, mipmap);
    }
}