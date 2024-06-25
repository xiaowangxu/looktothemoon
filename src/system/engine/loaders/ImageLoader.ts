import { Result } from "@/system/utils/Result";
import { ClassSaver } from "../classes/saver_loader/ClassSaverLoader";
import { ImageTexture2DResource } from "../resources/texture_resources/texture2d_resources/ImageTexture2DResource";
import { WebGPURenderState } from "@/system/sliverofstraw/WebGPURenderState";

export class ImageLoader {
    private readonly canvas: HTMLCanvasElement = document.createElement('canvas');
    private readonly ctx: CanvasRenderingContext2D | null;

    constructor() {
        this.ctx = this.canvas.getContext('2d');
        if (this.ctx === null) {
            throw new Error('fail to create canvas 2d context');
        }
    }

    private get_ImageData(image: HTMLImageElement) {
        const { naturalWidth: w, naturalHeight: h } = image;
        if (this.ctx === null) throw new Error('no canvas 2d context');
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(image, 0, 0);
        return this.ctx.getImageData(0, 0, w, h, { colorSpace: 'srgb' });
    }

    public async parse(url: string, mipmap: boolean, mipmap_count?: number): Promise<Result<ClassSaver, Error>> {
        try {
            const image = await new Promise((resolve: (img: HTMLImageElement) => void, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = () => reject();
            });
            const { width, height, data } = this.get_ImageData(image);
            const class_saver = new ClassSaver();
            const refid = ImageTexture2DResource.dump_Data(
                class_saver, 0,
                new Uint8Array(data),
                width,
                height,
                mipmap,
                mipmap_count ?? WebGPURenderState.get_MipmapCount(width, height),
            );
            class_saver.set_Root(refid);
            return Result.Ok(class_saver);
        }
        catch (err) {
            return Result.Error(new Error('fail to load image'));
        }
    }
}