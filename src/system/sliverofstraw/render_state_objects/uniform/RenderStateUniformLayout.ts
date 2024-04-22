import type { RenderState } from "../../RenderState";
import { RenderStateObject } from "../RenderStateObject";
import type { RenderStateUniformGroup } from "./RenderStateUniformGroup";

export enum RenderStateBufferUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4, Matrix2, Matrix3, Matrix4,
}

export enum RenderStateTextureUniformType {
    Tex2D, Tex2DArray, Tex3D, TexCubeMap,
}

export type RenderStateUniformType = RenderStateBufferUniformType | RenderStateTextureUniformType;

export abstract class RenderStateUniformLayout<T extends RenderState<T>> extends RenderStateObject<T> {

    public abstract add_Storage(name: string, readonly: boolean, location: number | undefined): void;

    public abstract add_BufferUniform(name: string, location: number | undefined): void;

    public abstract add_Uniform(name: string, type: RenderStateBufferUniformType, location: number | undefined): void;

    public abstract add_Texture(name: string, type: RenderStateTextureUniformType, location: number | undefined): void;

    public abstract add_Sampler(name: string, location: number | undefined): void;

    public abstract create_Group(): RenderStateUniformGroup<T>;
}