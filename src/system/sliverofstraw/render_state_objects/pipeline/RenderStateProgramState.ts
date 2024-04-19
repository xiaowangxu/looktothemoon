import { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import { RenderStatePrimitiveType, type RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";

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
    blend: boolean,
    color_src_factor: RenderStateBlendFactor,
    color_dst_factor: RenderStateBlendFactor,
    alpha_src_factor: RenderStateBlendFactor,
    alpha_dst_factor: RenderStateBlendFactor,
    color_operator: RenderStateBlendOperator,
    alpha_operator: RenderStateBlendOperator,
    constant: Vector4,
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

    //#region outputs

    public readonly override_output_state: RenderStateProgramOutputState = {
        blend: false,
        color_src_factor: RenderStateBlendFactor.One,
        color_dst_factor: RenderStateBlendFactor.Zero,
        alpha_src_factor: RenderStateBlendFactor.One,
        alpha_dst_factor: RenderStateBlendFactor.Zero,
        color_operator: RenderStateBlendOperator.Add,
        alpha_operator: RenderStateBlendOperator.Add,
        constant: new Vector4(),
    };
    public readonly outputs: RenderStateProgramOutputState[] = [];

    //#endregion

    public dispose(): void {
        this.render_state.delete_ProgramState(this);
    }
}