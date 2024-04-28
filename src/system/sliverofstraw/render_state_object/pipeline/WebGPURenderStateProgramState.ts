import { WebGPURenderObject } from "../../WebGPURenderObject";
import { WebGPURenderStatePrimitiveType } from "../vertex_array/WebGPURenderStateVertexArray";

export enum WebGPURenderStateCullMode {
    Front,
    Back,
    None,
}

export enum WebGPURenderStateFacing {
    Clockwise = 'cw',
    CounterClockwise = 'ccw',
}

export enum WebGPURenderStateDepthCompareFunc {
    Never,
    Always,
    Less,
    Equal,
    Greater,
    NotEqual,
    LessEqual,
    GreaterEqual,
}

export interface WebGPURenderStateProgramState {
    //#region primitive
    primitive_type: WebGPURenderStatePrimitiveType;
    cull_mode: WebGPURenderStateCullMode;
    facing: WebGPURenderStateFacing;
    //#endregion
    //#region depth
    depth_bias: number;
    depth_bias_slope_scale: number;
    depth_compare_func: WebGPURenderStateDepthCompareFunc;
    depth_write: boolean;
    //#endregion
}