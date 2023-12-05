import { Resource } from '@/system/engine/resources/Resource';
import type { RefCounted } from '@/system/utils/RefCounted';
import { Texture } from 'three';

declare module 'three' {
    interface Texture extends RefCounted {
        isRefCounted: boolean;
        ref_count(): number;
        ref(): void;
        unref(): void;
    }
}

Texture.prototype.isRefCounted = true;
Texture.prototype.ref = function () {
    this.userData.ref_count++;
}
Texture.prototype.ref_count = function () {
    return this.userData.ref_count;
}
Texture.prototype.unref = function () {
    if (this.ref_count() === 0) return;
    const ref_count = --this.userData.ref_count;
    if (ref_count <= 0) {
        this.dispose();
    }
}

export class TextureResource extends Resource {
    public static readonly class_name: string = "TextureResource";

    constructor() {
        super();
    }

    protected init_RefCount() {
        Object.defineProperty(
            this.get_Texture().userData,
            'ref_count',
            {
                value: 0,
                enumerable: false,
                writable: true,
            }
        );
    }

    public get_Texture(): Texture {
        throw new Error('abstract method');
    }

    protected dispose(): void { }
}