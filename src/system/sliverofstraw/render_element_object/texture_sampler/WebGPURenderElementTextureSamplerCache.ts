import { RefMap } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureWrap, type WebGPURenderStateTextureSampler } from "../../render_state_object/texture/WebGPURenderStateTextureSampler";
import { bitmask_bitset, bitmask as bitmask_create, bitmask_enable, bitmask_set } from "@/system/utils/BitMask";
import type { WebGPURenderStateDepthCompareFunc } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";

// hash bitmask 32bit uint
// 
// 0b 00 0 00000 000000 000000 000 0 0 0 00 00 00
//    ^^ ^ ^^^^^ ^^^^^^ ^^^^^^ ^^^ ^ ^ ^ ^^ ^^ ^^
//    || | ||||| |||||| |||||| ||| | | | || || ||
//    || | ||||| |||||| |||||| ||| | | | || || wrap_u
//    || | ||||| |||||| |||||| ||| | | | || || 
//    || | ||||| |||||| |||||| ||| | | | || wrap_v
//    || | ||||| |||||| |||||| ||| | | | ||  
//    || | ||||| |||||| |||||| ||| | | | wrap_w
//    || | ||||| |||||| |||||| ||| | | |
//    || | ||||| |||||| |||||| ||| | | min_filter
//    || | ||||| |||||| |||||| ||| | |
//    || | ||||| |||||| |||||| ||| | mag_filter
//    || | ||||| |||||| |||||| ||| | 
//    || | ||||| |||||| |||||| ||| mipmap_filter
//    || | ||||| |||||| |||||| |||       
//    || | ||||| |||||| |||||| compare
//    || | ||||| |||||| ||||||
//    || | ||||| |||||| min_lod
//    || | ||||| ||||||
//    || | ||||| max_lod
//    || | |||||
//    || | anisotropy
//    || |
//    || depth_compare_enabled
//    || 
//    perserved
type WebGPURenderElementTextureSamplerCacheHash = number;

export class WebGPURenderElementTextureSamplerCache extends WebGPURenderObjectRefCounted {

    protected readonly texture_sampler_refs: RefMap<WebGPURenderElementTextureSamplerCacheHash, WebGPURenderStateTextureSampler> = new RefMap();

    public get(
        wrap_u: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        wrap_v: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        wrap_w: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        min_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        mag_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        mipmap_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        compare: WebGPURenderStateDepthCompareFunc | undefined = undefined,
        min_lod: number = 0,
        max_lod: number = 32,
        anisotropy: number = 1,
    ): WebGPURenderStateTextureSampler {

        // wrap_u
        let bitmask = bitmask_set(0, wrap_u, 0, 2);
        // wrap_v
        bitmask = bitmask_set(bitmask, wrap_v, 2, 2);
        // wrap_w
        bitmask = bitmask_set(bitmask, wrap_w, 4, 2);
        // min_filter
        bitmask = bitmask_bitset(bitmask, 6, min_filter === WebGPURenderStateTextureFilter.Linear);
        // mag_filter
        bitmask = bitmask_bitset(bitmask, 7, mag_filter === WebGPURenderStateTextureFilter.Linear);
        // mipmap_filter
        bitmask = bitmask_bitset(bitmask, 8, mipmap_filter === WebGPURenderStateTextureFilter.Linear);
        // compare
        if (compare !== undefined) {
            bitmask = bitmask_set(bitmask, compare, 9, 3);
        }
        else {
            bitmask = bitmask_enable(bitmask, 29);
        }
        // min_lod
        bitmask = bitmask_set(bitmask, min_lod, 12, 6);
        // max_lod
        bitmask = bitmask_set(bitmask, max_lod, 18, 6);
        // anisotropy
        bitmask = bitmask_set(bitmask, anisotropy - 1, 24, 5);

        if (this.texture_sampler_refs.has(bitmask)) {
            return this.texture_sampler_refs.get(bitmask)!;
        }
        else {
            const texture_sampler = this.render_state.create_TextureSampler(
                wrap_u, wrap_v, wrap_w,
                min_filter, mag_filter, mipmap_filter,
                compare,
                min_lod, max_lod,
                anisotropy
            ).expect();
            this.texture_sampler_refs.set(bitmask, texture_sampler);
            return texture_sampler;
        }
    }

    public dispose(): void {
        this.texture_sampler_refs.clear();
    }
}

/*
const s = new Set<number>();
function test(
    wrap_u: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
    wrap_v: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
    wrap_w: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
    min_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
    mag_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
    mipmap_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
    compare: WebGPURenderStateDepthCompareFunc | undefined = undefined,
    min_lod: number = 0,
    max_lod: number = 32,
    anisotropy: number = 1,
): void {

    // wrap_u
    let bitmask = bitmask_set(0, wrap_u, 0, 2);
    // wrap_v
    bitmask = bitmask_set(bitmask, wrap_v, 2, 2);
    // wrap_w
    bitmask = bitmask_set(bitmask, wrap_w, 4, 2);
    // min_filter
    bitmask = bitmask_bitset(bitmask, 6, min_filter === WebGPURenderStateTextureFilter.Linear);
    // mag_filter
    bitmask = bitmask_bitset(bitmask, 7, mag_filter === WebGPURenderStateTextureFilter.Linear);
    // mipmap_filter
    bitmask = bitmask_bitset(bitmask, 8, mipmap_filter === WebGPURenderStateTextureFilter.Linear);
    // compare
    if (compare !== undefined) {
        bitmask = bitmask_set(bitmask, compare, 9, 3);
    }
    else {
        bitmask = bitmask_enable(bitmask, 29);
    }
    // min_lod
    bitmask = bitmask_set(bitmask, min_lod, 12, 6);
    // max_lod
    bitmask = bitmask_set(bitmask, max_lod, 18, 6);
    // anisotropy
    bitmask = bitmask_set(bitmask, anisotropy, 24, 5);

    if (s.has(bitmask)) {
        throw new Error(`
        wrap_u = ${wrap_u}
        wrap_v = ${wrap_v}
        wrap_w = ${wrap_w}
        min_filter = ${min_filter}
        mag_filter = ${mag_filter}
        mipmap_filter = ${mipmap_filter}
        compare = ${compare}
        min_lod = ${min_lod}
        max_lod = ${max_lod}
        anisotropy = ${anisotropy}
        `);
    }
    else {
        s.add(bitmask);
    }
}

console.log(s);

for (let wrap_u = 0; wrap_u < 3; wrap_u++)
    for (let wrap_v = 0; wrap_v < 3; wrap_v++)
        for (let wrap_w = 0; wrap_w < 3; wrap_w++)
            for (let min_filter = 0; min_filter < 1; min_filter++)
                for (let mag_filter = 0; mag_filter < 1; mag_filter++)
                    for (let mipmap_filter = 0; mipmap_filter < 1; mipmap_filter++)
                        for (let compare_enable = 0; compare_enable < 1; compare_enable++)
                            for (let compare = 0; compare < 8; compare++)
                                for (let lod_min = 0; lod_min < 32; lod_min++)
                                    for (let lod_max = 0; lod_max < 32; lod_max++)
                                        for (let anisotropy = 1; anisotropy <= 32; anisotropy++)
                                            test(wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare_enable === 0 ? compare : undefined, lod_min, lod_max, anisotropy);
*/
