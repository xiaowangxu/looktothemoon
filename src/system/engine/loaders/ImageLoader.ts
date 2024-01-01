import { Result } from "@/system/utils/Result";

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
        return this.ctx.getImageData(0, 0, w, h);
    }

    public async parse(url: string): Promise<Result<ImageData, Error>> {
        try {
            const image = await new Promise((resolve: (img: HTMLImageElement) => void, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = () => reject();
            });
            const image_data = this.get_ImageData(image);
            return Result.Ok(image_data);
        }
        catch (err) {
            console.log(err);
            return Result.Error(new Error('fail to load image'));
        }
    }
}