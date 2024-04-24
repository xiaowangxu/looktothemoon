import type { Config } from "../../ConfiguredObject";
import { RenderStateTextureDataFormat, RenderStateTextureFormat, RenderStateTextureMagFilter, RenderStateTextureMinFilter, RenderStateTextureType, RenderStateTextureWrap } from "@/system/sliverofstraw/render_state/RenderState";
import { ParameterMutableTextureResource } from "./TextureResource";
import type { ClassReader, ClassWriter } from "../../classes/saver_loader/ClassWriterReader";
import type { ClassSaver } from "../../classes/saver_loader/ClassSaverLoader";
import type { Rid } from "../../Rid";

export type ImageTextureArray = {
    level: number,
    width: number,
    height: number,
    data: Float32Array | Uint8Array | Uint8ClampedArray,
    y_flip?: boolean,
}[];

type ImageBitDepth = 8 | 32;

type ImageSrc = ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas;

export class ImageTextureResource extends ParameterMutableTextureResource {
    public static class_name: string = 'ImageTextureResource';

    constructor(config: Config) {
        super(config);
        this.texture_ref.value = this.render_server.render_state.create_Texture(RenderStateTextureType.Tex2D, false, RenderStateTextureFormat.RGBA8, 0, this.wrap_s, this.wrap_t, this.wrap_r, this.min_filter, this.mag_filter).expect();
    }

    /**
     * set images data from typed arrays
     */
    public set_ImageData(levels: number, array: ImageTextureArray, bit_depth: ImageBitDepth = 8, is_srgb: boolean = true, y_flip: boolean = true) {
        const render_state = this.render_server.render_state;
        if (bit_depth === 32 && is_srgb) throw new Error("<ImageTextureResource> set_Image: srgb image cannot use 32bit float data");
        const texture = this.texture;
        render_state.set_TextureLevels(texture, levels);
        render_state.set_TextureFormat(texture, is_srgb ? RenderStateTextureFormat.SRGBA8 : (bit_depth === 8 ? RenderStateTextureFormat.RGBA8 : RenderStateTextureFormat.RGBA32F));
        render_state.set_PixelStoreColorspaceConversion(is_srgb);
        for (const { level, width, height, data, y_flip: _y_filp = y_flip } of array) {
            if (level >= levels) continue;
            if ((bit_depth === 8 && !(data instanceof Uint8Array || data instanceof Uint8ClampedArray)) || (bit_depth === 32 && !(data instanceof Float32Array))) throw new Error(`<ImageTextureResource> set_Image: ${bit_depth}bit image has invalid data type`);
            render_state.set_PixelStoreYFlip(y_flip);
            render_state.alloc_Texture2D(texture, width, height, level, RenderStateTextureDataFormat.RGBA, data);
        }
    }

    public generate_Mipmap() {
        this.render_server.render_state.generate_Mipmap(this.texture);
    }

    /**
     * load image data
     */
    public set_Image(image: ImageSrc, levels: number = 1) {
        const render_state = this.render_server.render_state;
        const texture = this.texture;
        render_state.set_TextureLevels(texture, levels);
        render_state.set_TextureFormat(texture, RenderStateTextureFormat.SRGBA8);
        render_state.set_PixelStoreColorspaceConversion(true);
        render_state.set_PixelStoreYFlip(true);
        const width = image.width, height = image.height;
        render_state.alloc_Texture2D(texture, width, height, 0, RenderStateTextureDataFormat.RGBA);
        render_state.load_Image2D(texture, 0, RenderStateTextureDataFormat.RGBA, image);
    }

    // save / load
    public dump(writer: ClassWriter): void {
        throw new Error('<ImageTextureResource> dump: better not use ImageTextureResource\'s dump method for data generation, use ImageTextureResource.dump_Data instead');
    }

    public load(reader: ClassReader): void {
        const levels = reader.get<number>('levels') ?? 1;
        const gen_mipmap = reader.get<boolean>('gen_mipmap') ?? false;
        const is_srgb = reader.get<boolean>('is_srgb') ?? true;
        const bit_depth = reader.get<ImageBitDepth>('bit_depth') ?? 8;

        const arr_lwh = reader.get<number[]>('arr_lwh');
        const arr_data = reader.get<(Float32Array | Uint8Array | Uint8ClampedArray)[]>('arr_data');
        const arr_yflip = reader.get<boolean[]>('arr_yflip');
        if (arr_lwh !== undefined && arr_data !== undefined && arr_yflip !== undefined) {
            const array: ImageTextureArray = [];
            let i = 0;
            for (const data of arr_data) {
                array.push({
                    level: arr_lwh[i * 3 + 0],
                    width: arr_lwh[i * 3 + 1],
                    height: arr_lwh[i * 3 + 2],
                    data: data,
                    y_flip: arr_yflip[i],
                });
                i++;
            }
            this.set_ImageData(levels, array, bit_depth, is_srgb);
            if (gen_mipmap) this.generate_Mipmap();
        }

        const wrap_s = reader.get<number>('wrap_s');
        const wrap_t = reader.get<number>('wrap_t');
        const wrap_r = reader.get<number>('wrap_r');
        const min_filter = reader.get<number>('min_filter');
        const mag_filter = reader.get<number>('mag_filter');

        if (wrap_s) this.wrap_s = wrap_s;
        if (wrap_t) this.wrap_t = wrap_t;
        if (wrap_r) this.wrap_r = wrap_r;
        if (min_filter) this.min_filter = min_filter;
        if (mag_filter) this.mag_filter = mag_filter;
    }

    public static dump_Data(
        class_saver: ClassSaver,
        rid: Rid,
        levels: number,
        array: ImageTextureArray,
        gen_mipmap: boolean,
        wrap_s: RenderStateTextureWrap,
        wrap_t: RenderStateTextureWrap,
        wrap_r: RenderStateTextureWrap,
        min_filter: RenderStateTextureMinFilter,
        mag_filter: RenderStateTextureMagFilter,
        bit_depth: ImageBitDepth = 8,
        is_srgb: boolean = true,
        unique?: boolean,
        external?: string,
    ) {
        const refid = class_saver.create_Data(rid, ImageTextureResource.class_name, unique, external);
        class_saver.add_Property(refid, 'levels', levels);
        class_saver.add_Property(refid, 'gen_mipmap', gen_mipmap);
        class_saver.add_Property(refid, 'is_srgb', is_srgb);
        class_saver.add_Property(refid, 'bit_depth', bit_depth);

        const array_lwh: number[] = [];
        const array_data: (Float32Array | Uint8Array | Uint8ClampedArray)[] = [];
        const array_yflip: boolean[] = [];
        for (const { level, width, height, data, y_flip = true } of array) {
            array_lwh.push(level, width, height);
            array_data.push(data);
            array_yflip.push(y_flip);
        }
        class_saver.add_Property(refid, 'arr_lwh', array_lwh);
        class_saver.add_Property(refid, 'arr_data', array_data);
        class_saver.add_Property(refid, 'arr_yflip', array_yflip);
        class_saver.add_Property(refid, 'wrap_s', wrap_s);
        class_saver.add_Property(refid, 'wrap_t', wrap_t);
        class_saver.add_Property(refid, 'wrap_r', wrap_r);
        class_saver.add_Property(refid, 'min_filter', min_filter);
        class_saver.add_Property(refid, 'mag_filter', mag_filter);

        return refid;
    }
}