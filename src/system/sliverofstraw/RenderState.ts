import { Result } from "../utils/Result";
import type { RenderDevice } from "./RenderDevice";
import type { RenderStateFrameBuffer } from "./render_state_objects/frame_buffer/RenderStateFrameBuffer";
import type { RenderStateShader, RenderStateShaderType } from "./render_state_objects/pipeline/RenderStateShader";
import type { RenderStateTexture, RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTextureUsage } from "./render_state_objects/texture/RenderStateTexture";
import type { RenderStateTextureFilter, RenderStateTextureSampler, RenderStateTextureWrap } from "./render_state_objects/texture/RenderStateTextureSampler";
import type { RenderStateUniform, RenderStateUniformSlot, RenderStateUniformTypeMap } from "./render_state_objects/uniform/RenderStateUniformSlot";
import type { RenderStateVertexArray } from "./render_state_objects/vertex_array/RenderStateVertexArray";
import type { RenderStateVertexArrayView } from "./render_state_objects/vertex_array/RenderStateVertexArrayView";
import type { RenderStateProgram } from "./render_state_objects/pipeline/RenderStateProgram";
import type { RenderStateBuffer, RenderStateBufferDataType, RenderStateBufferType, RenderStateBufferUsage } from "./render_state_objects/buffer/RenderStateBuffer";
import type { RenderStateMultiSampleTexture } from "./render_state_objects/texture/RenderStateMultiSampleTexture";
import type { RenderStateDepthCompareFunc, RenderStateProgramState } from "./render_state_objects/pipeline/RenderStateProgramState";
import type { RenderStatePipeline } from "./render_state_objects/pipeline/RenderStatePipeline";
import type { RenderStatePassCollection } from "./render_state_objects/pass/RenderStatePassCollection";

//#region options

export interface RenderStateInitOption { }

//#endregion

//#region enum and constansts

export enum RenderStatePrimitiveType {
    Triangles, TriangleStrip, TriangleFan, LineStrip, Lines, LineLoop
}

export enum RenderStateUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4, Matrix2, Matrix3, Matrix4,
    Tex2D, Tex2DArray, Tex3D, TexCubeMap
}

export enum RenderStateTextureType {
    Tex2D, TexCubeMap, Tex3D, Tex2DArray
}



export enum RenderStateTextureDataFormat {
    RGB, RGBA, RInt, Red,
    Alpha,
    Luminance, LuminanceAlpha,
    Depth, DepthStencil,
}

//#endregion

export abstract class RenderState<T extends RenderState<T>> {

    public readonly render_device: RenderDevice<T>;
    public get render_state() { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>, option: RenderStateInitOption) {
        this.render_device = render_device;
    }

    //#region pipeline

    public abstract create_Shader(type: RenderStateShaderType, source: string): Result<RenderStateShader<T>, Error>;

    public abstract delete_Shader(shader: RenderStateShader<T>): void;

    public abstract create_Program(vertex_or_compute_shader: RenderStateShader<T>, frag_shader: RenderStateShader<T> | undefined, option: any): Result<RenderStateProgram<T>, Error>;

    public abstract delete_Program(program: RenderStateProgram<T>): void;

    public abstract create_ProgramState(): RenderStateProgramState<T>;

    public abstract create_Pipeline(program: RenderStateProgram<T>, program_state?: RenderStateProgramState<T>): Result<RenderStatePipeline<T>, Error>;

    public abstract delete_Pipeline(pipeline: RenderStatePipeline<T>): void;

    //#endregion

    //#region buffer

    public abstract create_Buffer(type: number, usage: number, data_type: RenderStateBufferDataType, element_size: number, size: number): Result<RenderStateBuffer<T>, Error>;

    public abstract get_BufferDataTypeBytes(format: RenderStateBufferDataType): number;

    public abstract delete_Buffer(buffer: RenderStateBuffer<T>): void;

    //#endregion

    //#region vertex array

    public abstract create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number): Result<RenderStateVertexArray<T>, Error>;

    public abstract delete_VertexArray(vertex_array: RenderStateVertexArray<T>): void;

    //#endregion

    //#region pass / pass collection

    public abstract create_PassCollection(): RenderStatePassCollection<T>;

    public abstract submit_PassCollections(pass_collections: Iterable<RenderStatePassCollection<T>>): void;

    //#endregion

    //#region frame buffer

    public abstract create_FrameBuffer(): Result<RenderStateFrameBuffer<T>, Error>;

    public abstract delete_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T>): void;

    //#endregion

    //#region texture sampler

    public abstract create_TextureSampler(
        wrap_u: RenderStateTextureWrap, wrap_v: RenderStateTextureWrap, wrap_w: RenderStateTextureWrap,
        min_filter: RenderStateTextureFilter, mag_filter: RenderStateTextureFilter, mipmap_filter: RenderStateTextureFilter,
        compare: RenderStateDepthCompareFunc | undefined,
        min_lod: number, max_lod: number,
        anisotropy: number
    ): Result<RenderStateTextureSampler<T>, Error>;

    public abstract delete_TextureSampler(sampler: RenderStateTextureSampler<T>): void;

    //#endregion

    //#region texture

    public abstract create_Texture(
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        dimension: RenderStateTextureDimension, width: number, height: number, depth: number,
        mipmap_level_count: number
    ): Result<RenderStateTexture<T>, Error>;

    public abstract get_TextureFormatTexelBytes(format: RenderStateTextureFormat): number;

    public abstract delete_Texture(texture: RenderStateTexture<T>): void;

    //#endregion

    //#region multi sample texture

    public abstract create_MultiSampleTexture(
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        width: number, height: number, sample_count: number
    ): Result<RenderStateMultiSampleTexture<T>, Error>;


    public abstract delete_MultiSampleTexture(render_buffer: RenderStateMultiSampleTexture<T>): void;

    //#endregion



    //#region uniform

    public abstract create_ProgramUniform<VT extends RenderStateUniformType>(program: RenderStateProgram<T>, name: string, type: VT, default_value: RenderStateUniformTypeMap<T, VT>, option: any): Result<RenderStateUniform<T, VT>, Error>;

    public abstract delete_ProgramUniform(uniform: RenderStateUniformSlot<T, RenderStateProgram<T>, RenderStateUniformType>): void;

    //#endregion

}

//#region type helper

export type RenderStateProgramOptionParameterType<T extends RenderState<T>> =
    T extends {
        create_Program(vert_shader: RenderStateShader<T>, frag_shader: RenderStateShader<T> | undefined, option: infer R): Result<RenderStateProgram<T>, Error>
    } ? R : never;

export type RenderStateProgramUniformOptionParameterType<T extends RenderState<T>> =
    T extends {
        create_ProgramUniform<VT extends RenderStateUniformType>(program: RenderStateProgram<T>, name: string, type: VT, default_value: RenderStateUniformTypeMap<T, VT>, option: infer R): Result<RenderStateUniform<T, VT>, Error>
    } ? R : never;

// import { type WebGL2RenderState } from "./webgl2/WebGL2RenderState";
// const a: RenderStateProgramAttributesParameterType<WebGL2RenderState>;

//#endregion