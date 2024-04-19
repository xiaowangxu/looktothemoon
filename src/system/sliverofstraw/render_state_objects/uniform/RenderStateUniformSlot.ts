import { Ref } from "@/system/utils/RefCounted";
import type { RenderState, RenderStateUniformType } from "../../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateProgram } from "../pipeline/RenderStateProgram";
import type { RenderStateTexture } from "../texture/RenderStateTexture";
import type { RenderStateTextureSampler } from "../texture/RenderStateTextureSampler";
import type { Matrix3 } from "@/system/fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "@/system/fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "@/system/fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "@/system/fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "@/system/fivepebble/linear_algebra/Vector4";
import type { Matrix2 } from "@/system/fivepebble/linear_algebra/Matrix2";

export type RenderStateValueUniformType =
    RenderStateUniformType.Bool | RenderStateUniformType.Uint | RenderStateUniformType.Int | RenderStateUniformType.Float |
    RenderStateUniformType.Vector2 | RenderStateUniformType.Vector3 | RenderStateUniformType.Vector4 |
    RenderStateUniformType.Matrix2 | RenderStateUniformType.Matrix3 | RenderStateUniformType.Matrix4;

export type RenderStateTextureUniformType = RenderStateUniformType.Tex2D | RenderStateUniformType.Tex2DArray | RenderStateUniformType.Tex3D | RenderStateUniformType.TexCubeMap;

export interface RenderStateUniformTypeSlotMap<RS extends RenderState<RS>> {
    Bool: [
        boolean,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Bool, boolean>
    ],
    Uint: [
        number,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Uint, number>
    ],
    Int: [
        number,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Int, number>
    ],
    Float: [
        number,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Float, number>
    ],
    Vector2: [
        Vector2,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Vector2, Vector2>
    ],
    Vector3: [
        Vector3,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Vector3, Vector3>
    ],
    Vector4: [
        Vector4,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Vector4, Vector4>
    ],
    Matrix2: [
        Matrix3,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Matrix2, Matrix2>
    ],
    Matrix3: [
        Matrix3,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Matrix3, Matrix3>
    ],
    Matrix4: [
        Matrix4,
        RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Matrix4, Matrix4>
    ],
    Tex2D: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Tex2D, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
    Tex2DArray: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Tex2DArray, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
    Tex3D: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.Tex3D, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
    TexCubeMap: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateProgram<RS>, RenderStateUniformType.TexCubeMap, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
}

type ValueOf<T> = T[keyof T];
export type RenderStateUniformTypeMap<RS extends RenderState<RS>, T extends RenderStateUniformType> = RenderStateUniformTypeSlotMap<RS>[Extract<ValueOf<{
    [K in keyof typeof RenderStateUniformType]: [K, typeof RenderStateUniformType[K]]
}>, [any, T]>[0]][0];

export type RenderStateUniform<RS extends RenderState<RS>, VT extends RenderStateUniformType = RenderStateUniformType> =
    VT extends RenderStateTextureUniformType ?
    RenderStateTextureUniformSlot<RS, RenderStateProgram<RS>, VT, RenderStateTexture<RS>, RenderStateTextureSampler<RS>> :
    RenderStateValueUniformSlot<RS, RenderStateProgram<RS>, VT, RenderStateUniformTypeMap<RS, VT>>;

export abstract class RenderStateUniformSlot<RS extends RenderState<RS>, P extends RenderStateProgram<RS>, VT extends RenderStateUniformType> extends RenderStateObjectRefCounted<RS> {
    protected readonly name: string;
    protected readonly type: VT;

    protected readonly program_ref: Ref<P> = new Ref();
    protected get program() { return this.program_ref.expect; }

    constructor(render_state: RS, program: P, type: VT, name: string) {
        super(render_state);
        this.name = name;
        this.type = type;
        this.program_ref.value = program;
    }

    public abstract commit(): void;

    public dispose(): void {
        this.program_ref.clear();
    }
}

export abstract class RenderStateValueUniformSlot<RS extends RenderState<RS>, P extends RenderStateProgram<RS>, VT extends RenderStateUniformType, V> extends RenderStateUniformSlot<RS, P, VT> {
    protected abstract get default_value(): V;

    public abstract get value(): V;

    public abstract set_Value(value: V | undefined, commit?: boolean): void;

    constructor(render_state: RS, program: P, type: VT, name: string) {
        super(render_state, program, type, name);
    }
}

export abstract class RenderStateTextureUniformSlot<RS extends RenderState<RS>, P extends RenderStateProgram<RS>, VT extends RenderStateTextureUniformType, TT extends RenderStateTexture<RS>, ST extends RenderStateTextureSampler<RS>> extends RenderStateUniformSlot<RS, P, VT> {

    protected abstract get default_texture(): TT | undefined;
    public abstract get texture(): TT | undefined;

    protected abstract get default_sampler(): ST | undefined;
    public abstract get sampler(): ST | undefined;

    public abstract set_Texture(value: TT | undefined, commit?: boolean): void;
    public abstract set_Sampler(value: ST | undefined, commit?: boolean): void;

    public set_Value(value: { texture: TT | undefined, sampler: ST | undefined } | undefined, commit?: boolean): void {
        const tex = value?.texture;
        const sam = value?.sampler;
        this.set_Texture(tex, false);
        this.set_Sampler(sam, commit);
    }

    constructor(render_state: RS, program: P, type: VT, name: string) {
        super(render_state, program, type, name);
    }
}