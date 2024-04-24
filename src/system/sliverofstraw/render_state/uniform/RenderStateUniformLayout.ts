import type { RenderState } from "../RenderState";
import { RenderStateObjectRefCounted } from "../RenderStateObject";
import type { RenderStateShaderType } from "../pipeline/RenderStateShader";

export enum RenderStateBufferUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4,
    Matrix2, Matrix3, Matrix4,
    IVector2, IVector3, IVector4,
    UVector2, UVector3, UVector4,
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

export enum RenderStateUniformBindingType {
    StorageBuffer, Buffer, Texture, Sampler,
}

export abstract class RenderStateUniformLayout<T extends RenderState<T>> extends RenderStateObjectRefCounted<T> {

    public abstract add_Storage(readonly: boolean, visibility: RenderStateShaderType, binding: number | undefined): void;

    public abstract add_BufferUniform(size: number, visibility: RenderStateShaderType, binding: number | undefined): void;

    public abstract add_Texture(type: RenderStateTextureUniformType, sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, binding: number | undefined): void;

    public abstract add_MultiSampleTexture(sample: RenderStateTextureUniformSampleType, visibility: RenderStateShaderType, binding: number | undefined): void;

    public abstract add_Sampler(type: RenderStateSamplerUniformType, visibility: RenderStateShaderType, binding: number | undefined): void;

    public dispose(): void {
        this.render_state.delete_UniformLayout(this);
    }
}