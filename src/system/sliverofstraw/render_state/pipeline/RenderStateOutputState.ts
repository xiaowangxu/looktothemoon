import type { RenderStateTextureFormat } from "../texture/RenderStateTexture";

export enum RenderStateBlendFactor {
    Constant, Zero,
    Dst, DstAlpha,
    One, OneMinusDst, OneMinusSrc, OneMinusSrcAlpha, OneMinusDstAlpha, OneMinusConstant,
    Src, SrcAlpha, SrcAlphaSaturated,
}

export enum RenderStateBlendOperator {
    Add, Subtract, ReverseSubtract,
    Max, Min,
}

interface RenderStateProgramOutputState {
    format: RenderStateTextureFormat,
    blend: boolean,
    color_src_factor?: RenderStateBlendFactor,
    color_dst_factor?: RenderStateBlendFactor,
    alpha_src_factor?: RenderStateBlendFactor,
    alpha_dst_factor?: RenderStateBlendFactor,
    color_operator?: RenderStateBlendOperator,
    alpha_operator?: RenderStateBlendOperator,
}

export interface RenderStateOutputState {
    depth_stencil_format: RenderStateTextureFormat,
    multi_sample_count: 1 | 4,
    alpha_to_coverage?: boolean,
    attachments: RenderStateProgramOutputState[],
}