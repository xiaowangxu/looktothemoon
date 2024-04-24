import type { RenderState } from "../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateShaderType } from "../pipeline/RenderStateShader";
import type { RenderStateUniformGroup } from "./RenderStateUniformGroup";

export enum RenderStateBufferUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4, Matrix2, Matrix3, Matrix4,
}

export enum RenderStateTextureUniformType {
    Tex1D, 
    Tex2D, Tex2DArray, 
    Tex3D, 
    TexCubeMap, TexCubeMapArray,
}

export enum RenderStateTextureUniformSampleType {
    Depth,
    Float, Int, Uint,
    NonFilterFloat,
}

export enum RenderStateSamplerUniformType {
    Compare, Filter, NonFilter
}

export type RenderStateUniformType = RenderStateBufferUniformType | RenderStateTextureUniformType;

export abstract class RenderStateUniformLayout<T extends RenderState<T>> extends RenderStateObject<T> {

    public abstract add_Storage(name: string, readonly: boolean, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract add_BufferUniform(name: string, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract add_Uniform(name: string, type: RenderStateBufferUniformType, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract add_Texture(name: string, type: RenderStateTextureUniformType, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract add_MultiSampleTexture(name: string, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract add_Sampler(name: string, type: RenderStateSamplerUniformType, visibility: RenderStateShaderType, location: number | undefined): void;

    public abstract create_Group(): RenderStateUniformGroup<T>;
}