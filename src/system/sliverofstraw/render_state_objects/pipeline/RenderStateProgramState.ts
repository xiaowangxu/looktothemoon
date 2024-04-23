import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { type RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import { RenderStatePrimitiveType } from "../vertex_array/RenderStateVertexArray";
import { RenderStateTextureFormat } from "../texture/RenderStateTexture";

export enum RenderStateCullMode {
    Front, Back, None,
}

export enum RenderStateFacing {
    Clockwise, CounterClockwise,
}

export enum RenderStateDepthCompareFunc {
    Never, Always,
    Less, Equal, Greater, NotEqual,
    LessEqual, GreaterEqual,
}

export class RenderStateProgramState<T extends RenderState<T>> extends RenderStateObject<T> {

    //#region primitive

    public primitive: RenderStatePrimitiveType = RenderStatePrimitiveType.Triangles;
    public cull_mode: RenderStateCullMode = RenderStateCullMode.None;
    public facing: RenderStateFacing = RenderStateFacing.CounterClockwise;

    //#endregion

    //#region depth

    public depth_bias: number = 0.0;
    public depth_bias_slope_scale: number = 0.0;
    public depth_compare_func: RenderStateDepthCompareFunc = RenderStateDepthCompareFunc.LessEqual;
    public depth_write: boolean = true;

    //#endregion

    public dispose(): void { }
}