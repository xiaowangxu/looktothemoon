import type { WebGPURenderStateMultiSampleCount } from "../texture/WebGPURenderStateMultiSampleTexture";
import type { WebGPURenderStateTextureFormat } from "../texture/WebGPURenderStateTexture";

export enum WebGPURenderStateBlendFactor {
    Constant = 'constant',
    Zero = 'zero',
    Dst = 'dst',
    DstAlpha = 'dst-alpha',
    One = 'one',
    OneMinusDst = 'one-minus-dst',
    OneMinusSrc = 'one-minus-src',
    OneMinusSrcAlpha = 'one-minus-src-alpha',
    OneMinusDstAlpha = 'one-minus-dst-alpha',
    OneMinusConstant = 'one-minus-constant',
    Src = 'src',
    SrcAlpha = 'src-alpha',
    SrcAlphaSaturated = 'src-alpha-saturated',
}

export enum WebGPURenderStateBlendOperator {
    Add = 'add',
    Subtract = 'subtract',
    ReverseSubtract = 'reverse-subtract',
    Max = 'max',
    Min = 'min',
}

interface WebGPURenderStateProgramOutputState {
    format: WebGPURenderStateTextureFormat,
    blend: boolean,
    color_src_factor?: WebGPURenderStateBlendFactor,
    color_dst_factor?: WebGPURenderStateBlendFactor,
    alpha_src_factor?: WebGPURenderStateBlendFactor,
    alpha_dst_factor?: WebGPURenderStateBlendFactor,
    color_operator?: WebGPURenderStateBlendOperator,
    alpha_operator?: WebGPURenderStateBlendOperator,
}

export interface WebGPURenderStateOutputState {
    depth_stencil_format: WebGPURenderStateTextureFormat,
    multi_sample_count: WebGPURenderStateMultiSampleCount,
    alpha_to_coverage?: boolean,
    attachments: WebGPURenderStateProgramOutputState[],
}