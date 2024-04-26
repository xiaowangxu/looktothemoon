import { WebGPURenderStateObject } from "../WebGPURenderStateObject";
import { WebGPURenderStatePrimitiveType } from "../vertex_array/WebGPURenderStateVertexArray";

export enum WebGPURenderStateCullMode {
    Front = 'front',
    Back = 'back',
    None = 'none',
}

export enum WebGPURenderStateFacing {
    Clockwise = 'cw',
    CounterClockwise = 'ccw',
}

export enum WebGPURenderStateDepthCompareFunc {
    Never = 'never',
    Always = 'always',
    Less = 'less',
    Equal = 'equal',
    Greater = 'greater',
    NotEqual = 'not-equal',
    LessEqual = 'less-equal',
    GreaterEqual = 'greater-equal',
}

export class WebGPURenderStateProgramState extends WebGPURenderStateObject {

    //#region primitive

    public primitive: WebGPURenderStatePrimitiveType = WebGPURenderStatePrimitiveType.Triangles;
    public cull_mode: WebGPURenderStateCullMode = WebGPURenderStateCullMode.None;
    public facing: WebGPURenderStateFacing = WebGPURenderStateFacing.CounterClockwise;

    //#endregion

    //#region depth

    public depth_bias: number = 0.0;
    public depth_bias_slope_scale: number = 0.0;
    public depth_compare_func: WebGPURenderStateDepthCompareFunc = WebGPURenderStateDepthCompareFunc.LessEqual;
    public depth_write: boolean = true;

    //#endregion
}