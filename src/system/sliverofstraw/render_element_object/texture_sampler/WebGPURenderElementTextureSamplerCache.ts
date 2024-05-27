import { RefMap } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureWrap, type WebGPURenderStateTextureSampler } from "../../render_state_object/texture/WebGPURenderStateTextureSampler";
import { bitmask_bitset, bitmask_check, bitmask_disable, bitmask_enable, bitmask_get, bitmask_set } from "@/system/utils/BitMask";
import type { WebGPURenderStateDepthCompareFunc } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";

export enum WebGPURenderElementTextureSamplerCacheHash {
    
    /*                */WrapUClamp = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*               */WrapURepeat = 0b00_0_00000_000000_000000_000_0_0_0_00_00_01,
    /*         */WrapUMirrorRepeat = 0b00_0_00000_000000_000000_000_0_0_0_00_00_10,
    
    /*                */WrapVClamp = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*               */WrapVRepeat = 0b00_0_00000_000000_000000_000_0_0_0_00_01_00,
    /*         */WrapVMirrorRepeat = 0b00_0_00000_000000_000000_000_0_0_0_00_10_00,
    
    /*                */WrapWClamp = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*               */WrapWRepeat = 0b00_0_00000_000000_000000_000_0_0_0_01_00_00,
    /*         */WrapWMirrorRepeat = 0b00_0_00000_000000_000000_000_0_0_0_10_00_00,

    /*                 */WrapClamp = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*                */WrapRepeat = 0b00_0_00000_000000_000000_000_0_0_0_01_01_01,
    /*          */WrapMirrorRepeat = 0b00_0_00000_000000_000000_000_0_0_0_10_10_10,

    /*          */MinFilterNearest = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*           */MinFilterLinear = 0b00_0_00000_000000_000000_000_0_0_1_00_00_00,

    /*          */MagFilterNearest = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*           */MagFilterLinear = 0b00_0_00000_000000_000000_000_0_1_0_00_00_00,

    /*       */MipmapFilterNearest = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*        */MipmapFilterLinear = 0b00_0_00000_000000_000000_000_1_0_0_00_00_00,

    /*             */FilterNearest = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*              */FilterLinear = 0b00_0_00000_000000_000000_000_1_1_1_00_00_00,

    /*      */DepthCompareDisabled = 0b00_1_00000_000000_000000_000_0_0_0_00_00_00,
    /*         */DepthCompareNever = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*        */DepthCompareAlways = 0b00_0_00000_000000_000000_001_0_0_0_00_00_00,
    /*          */DepthCompareLess = 0b00_0_00000_000000_000000_010_0_0_0_00_00_00,
    /*         */DepthCompareEqual = 0b00_0_00000_000000_000000_011_0_0_0_00_00_00,
    /*       */DepthCompareGreater = 0b00_0_00000_000000_000000_100_0_0_0_00_00_00,
    /*      */DepthCompareNotEqual = 0b00_0_00000_000000_000000_101_0_0_0_00_00_00,
    /*     */DepthCompareLessEqual = 0b00_0_00000_000000_000000_110_0_0_0_00_00_00,
    /*  */DepthCompareGreaterEqual = 0b00_0_00000_000000_000000_111_0_0_0_00_00_00,

    /*                   */MinLod0 = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*                   */MinLod1 = 0b00_0_00000_000000_000001_000_0_0_0_00_00_00,
    /*                   */MinLod2 = 0b00_0_00000_000000_000010_000_0_0_0_00_00_00,
    /*                   */MinLod3 = 0b00_0_00000_000000_000011_000_0_0_0_00_00_00,
    /*                   */MinLod4 = 0b00_0_00000_000000_000100_000_0_0_0_00_00_00,
    /*                   */MinLod5 = 0b00_0_00000_000000_000101_000_0_0_0_00_00_00,
    /*                   */MinLod6 = 0b00_0_00000_000000_000110_000_0_0_0_00_00_00,
    /*                   */MinLod7 = 0b00_0_00000_000000_000111_000_0_0_0_00_00_00,
    /*                   */MinLod8 = 0b00_0_00000_000000_001000_000_0_0_0_00_00_00,
    /*                   */MinLod9 = 0b00_0_00000_000000_001001_000_0_0_0_00_00_00,
    /*                  */MinLod10 = 0b00_0_00000_000000_001010_000_0_0_0_00_00_00,
    /*                  */MinLod11 = 0b00_0_00000_000000_001011_000_0_0_0_00_00_00,
    /*                  */MinLod12 = 0b00_0_00000_000000_001100_000_0_0_0_00_00_00,
    /*                  */MinLod13 = 0b00_0_00000_000000_001101_000_0_0_0_00_00_00,
    /*                  */MinLod14 = 0b00_0_00000_000000_001110_000_0_0_0_00_00_00,
    /*                  */MinLod15 = 0b00_0_00000_000000_001111_000_0_0_0_00_00_00,
    /*                  */MinLod16 = 0b00_0_00000_000000_010000_000_0_0_0_00_00_00,
    /*                  */MinLod17 = 0b00_0_00000_000000_010001_000_0_0_0_00_00_00,
    /*                  */MinLod18 = 0b00_0_00000_000000_010010_000_0_0_0_00_00_00,
    /*                  */MinLod19 = 0b00_0_00000_000000_010011_000_0_0_0_00_00_00,
    /*                  */MinLod20 = 0b00_0_00000_000000_010100_000_0_0_0_00_00_00,
    /*                  */MinLod21 = 0b00_0_00000_000000_010101_000_0_0_0_00_00_00,
    /*                  */MinLod22 = 0b00_0_00000_000000_010110_000_0_0_0_00_00_00,
    /*                  */MinLod23 = 0b00_0_00000_000000_010111_000_0_0_0_00_00_00,
    /*                  */MinLod24 = 0b00_0_00000_000000_011000_000_0_0_0_00_00_00,
    /*                  */MinLod25 = 0b00_0_00000_000000_011001_000_0_0_0_00_00_00,
    /*                  */MinLod26 = 0b00_0_00000_000000_011010_000_0_0_0_00_00_00,
    /*                  */MinLod27 = 0b00_0_00000_000000_011011_000_0_0_0_00_00_00,
    /*                  */MinLod28 = 0b00_0_00000_000000_011100_000_0_0_0_00_00_00,
    /*                  */MinLod29 = 0b00_0_00000_000000_011101_000_0_0_0_00_00_00,
    /*                  */MinLod30 = 0b00_0_00000_000000_011110_000_0_0_0_00_00_00,
    /*                  */MinLod31 = 0b00_0_00000_000000_011111_000_0_0_0_00_00_00,
    /*                  */MinLod32 = 0b00_0_00000_000000_100000_000_0_0_0_00_00_00,

    /*                   */MaxLod0 = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod1 = 0b00_0_00000_000001_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod2 = 0b00_0_00000_000010_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod3 = 0b00_0_00000_000011_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod4 = 0b00_0_00000_000100_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod5 = 0b00_0_00000_000101_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod6 = 0b00_0_00000_000110_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod7 = 0b00_0_00000_000111_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod8 = 0b00_0_00000_001000_000000_000_0_0_0_00_00_00,
    /*                   */MaxLod9 = 0b00_0_00000_001001_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod10 = 0b00_0_00000_001010_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod11 = 0b00_0_00000_001011_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod12 = 0b00_0_00000_001100_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod13 = 0b00_0_00000_001101_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod14 = 0b00_0_00000_001110_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod15 = 0b00_0_00000_001111_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod16 = 0b00_0_00000_010000_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod17 = 0b00_0_00000_010001_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod18 = 0b00_0_00000_010010_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod19 = 0b00_0_00000_010011_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod20 = 0b00_0_00000_010100_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod21 = 0b00_0_00000_010101_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod22 = 0b00_0_00000_010110_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod23 = 0b00_0_00000_010111_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod24 = 0b00_0_00000_011000_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod25 = 0b00_0_00000_011001_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod26 = 0b00_0_00000_011010_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod27 = 0b00_0_00000_011011_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod28 = 0b00_0_00000_011100_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod29 = 0b00_0_00000_011101_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod30 = 0b00_0_00000_011110_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod31 = 0b00_0_00000_011111_000000_000_0_0_0_00_00_00,
    /*                  */MaxLod32 = 0b00_0_00000_100000_000000_000_0_0_0_00_00_00,

    /*                    */AllLod = 0b00_0_00000_100000_000000_000_0_0_0_00_00_00,

    /*            */AnisotropyLod1 = 0b00_0_00000_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod2 = 0b00_0_00001_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod3 = 0b00_0_00010_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod4 = 0b00_0_00011_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod5 = 0b00_0_00100_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod6 = 0b00_0_00101_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod7 = 0b00_0_00110_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod8 = 0b00_0_00111_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLod9 = 0b00_0_01000_000000_000000_000_0_0_0_00_00_00,
    /*            */AnisotropyLo10 = 0b00_0_01001_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod11 = 0b00_0_01010_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod12 = 0b00_0_01011_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod13 = 0b00_0_01100_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod14 = 0b00_0_01101_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod15 = 0b00_0_01110_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod16 = 0b00_0_01111_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod17 = 0b00_0_10000_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod18 = 0b00_0_10001_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod19 = 0b00_0_10010_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod20 = 0b00_0_10011_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod21 = 0b00_0_10100_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod22 = 0b00_0_10101_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod23 = 0b00_0_10110_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod24 = 0b00_0_10111_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod25 = 0b00_0_11000_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod26 = 0b00_0_11001_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod27 = 0b00_0_11010_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod28 = 0b00_0_11011_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod29 = 0b00_0_11100_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod30 = 0b00_0_11101_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod31 = 0b00_0_11110_000000_000000_000_0_0_0_00_00_00,
    /*           */AnisotropyLod32 = 0b00_0_11111_000000_000000_000_0_0_0_00_00_00,

    /*             */AllAnisotropy = 0b00_0_11111_000000_000000_000_0_0_0_00_00_00,
}

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
//    || depth_compare_disabled
//    || 
//    perserved
// 

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

    public get_ByHash(hash: WebGPURenderElementTextureSamplerCacheHash) {
        // remove perserved
        let bitmask = bitmask_disable(hash, 31);
        if (this.texture_sampler_refs.has(bitmask)) {
            return this.texture_sampler_refs.get(bitmask)!;
        }
        else {
            // wrap_u
            const wrap_u = bitmask_get(bitmask, 0, 2);
            // wrap_v
            const wrap_v = bitmask_get(bitmask, 2, 2);
            // wrap_w
            const wrap_w = bitmask_get(bitmask, 4, 2);
            // min_filter
            const min_filter = bitmask_check(bitmask, 6) ? 1 : 0;
            // mag_filter
            const mag_filter = bitmask_check(bitmask, 7) ? 1 : 0;
            // mipmap_filter
            const mipmap_filter = bitmask_check(bitmask, 8) ? 1 : 0;
            // compare
            const depth_compare_disabled = bitmask_check(bitmask, 29);
            let compare: WebGPURenderStateDepthCompareFunc | undefined = undefined;
            if (!depth_compare_disabled) { compare = bitmask_get(bitmask, 9, 3); }
            // min_lod
            const min_lod = bitmask_get(bitmask, 12, 6);
            // max_lod
            const max_lod = bitmask_get(bitmask, 18, 6);
            // anisotropy
            const anisotropy = bitmask_get(bitmask, 24, 5) + 1;

            return this.get(wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare, min_lod, max_lod, anisotropy);
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
