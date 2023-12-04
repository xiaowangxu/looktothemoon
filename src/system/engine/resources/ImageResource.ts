import { Resource } from "../Resource";
import { ClassReader, ClassWriter } from "../classes/ClassWriterReader";
import { compressToBase64 as compress_String, decompressFromBase64 as decompress_String } from 'lz-string';

function convert_ArrayBuffer_to_Base64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function convert_Base64_to_ArrayBuffer(base64: string) {
    const chars = atob(base64);
    const array = chars.split('');
    const bytes = array.map(c => c.codePointAt(0)!);
    return new Uint8Array(bytes);
}

export class ImageResource extends Resource {
    public static readonly class_name: string = "ImageResource";
    public static readonly use_custom_instantiater: boolean = true;

    public readonly image_data: ImageData;

    public get width() { return this.image_data.width; }
    public get height() { return this.image_data.height; }

    constructor(data: ImageData) {
        super();
        this.image_data = data;
    }

    protected dispose(): void { }

    // save / load

    public dump(writer: ClassWriter): void {
        const buffer = this.image_data.data
        const str = convert_ArrayBuffer_to_Base64(buffer.buffer);
        const compress_str = compress_String(str);
        writer.initialization('width', this.width);
        writer.initialization('height', this.height);
        writer.initialization('data', compress_str);
    }

    public load(reader: ClassReader): void { }

    public static instantiate(data: any | ClassReader): ImageResource {
        if (data instanceof ClassReader) {
            const image_data = data.get<string>('data');
            const width = data.get<number>('width');
            const height = data.get<number>('height');
            if (image_data === undefined || width === undefined || height === undefined) throw new Error('can not instantiate ImageResource');
            const str = decompress_String(image_data);
            const buffer = convert_Base64_to_ArrayBuffer(str);
            return new ImageResource(new ImageData(new Uint8ClampedArray(buffer), width, height));
        }
        else {
            throw new Error('can not instantiate ThreeGeometryResource from raw data');
        }
    }
}