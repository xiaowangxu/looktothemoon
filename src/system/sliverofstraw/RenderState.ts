import { Result } from "../utils/Result";
import type { RenderDevice } from "./RenderDevice";
import type { RenderStateFrameBuffer } from "./render_state_objects/frame_buffer/RenderStateFrameBuffer";
import { RenderStateShaderType, type RenderStateShader } from "./render_state_objects/pipeline/RenderStateShader";
import type { RenderStateTexture, RenderStateTextureDimension, RenderStateTextureFormat, RenderStateTextureUsage } from "./render_state_objects/texture/RenderStateTexture";
import type { RenderStateTextureFilter, RenderStateTextureSampler, RenderStateTextureWrap } from "./render_state_objects/texture/RenderStateTextureSampler";
import type { RenderStateVertexArray } from "./render_state_objects/vertex_array/RenderStateVertexArray";
import type { RenderStateProgram } from "./render_state_objects/pipeline/RenderStateProgram";
import type { RenderStateBuffer, RenderStateBufferDataType, RenderStateBufferType, RenderStateBufferUsage } from "./render_state_objects/buffer/RenderStateBuffer";
import type { RenderStateMultiSampleTexture } from "./render_state_objects/texture/RenderStateMultiSampleTexture";
import type { RenderStateDepthCompareFunc, RenderStateProgramState } from "./render_state_objects/pipeline/RenderStateProgramState";
import type { RenderStatePassCollection } from "./render_state_objects/pass/RenderStatePassCollection";
import type { RenderStateUniformLayout } from "./render_state_objects/uniform/RenderStateUniformLayout";
import type { RenderStateTextureView } from "./render_state_objects/texture/RenderStateTextureView";
import type { RenderStateUniformGroup } from "./render_state_objects/uniform/RenderStateUniformGroup";
import type { RenderStateAttributeLayout } from "./render_state_objects/pipeline/RenderStateAttributeLayout";
import type { RenderStateComputePipeline } from "./render_state_objects/pipeline/RenderStateComputePipeline";
import type { RenderStateRenderPipeline } from "./render_state_objects/pipeline/RenderStateRenderPipeline";
import { RenderStatePrimitiveType } from "./render_state_objects/vertex_array/RenderStateVertexArray";
import type { RenderStateOutputState } from "./render_state_objects/pipeline/RenderStateOutputState";

//#region options

export interface RenderStateInitOption { }

//#endregion

export abstract class RenderState<T extends RenderState<T>> {

    public readonly render_device: RenderDevice<T>;
    public get render_state() { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>, option: RenderStateInitOption) {
        this.render_device = render_device;
    }

    public async init(): Promise<boolean> {
        return true;
    }

    //#region pipeline

    public static is_VertexShader(type: RenderStateShaderType) { return (type & RenderStateShaderType.Vertex) !== 0; }

    public static is_FragmentShader(type: RenderStateShaderType) { return (type & RenderStateShaderType.Vertex) !== 0; }

    public static is_ComputeShader(type: RenderStateShaderType) { return (type & RenderStateShaderType.Vertex) !== 0; }

    public static is_StripPrimitiveType(type: RenderStatePrimitiveType) { return type === RenderStatePrimitiveType.LineStrip || type === RenderStatePrimitiveType.TriangleStrip || type === RenderStatePrimitiveType.TriangleFan; }

    public abstract create_Shader(type: RenderStateShaderType, source: string, defines?: { [key: string]: string }): Result<RenderStateShader<T>, Error>;

    public abstract delete_Shader(shader: RenderStateShader<T>): void;

    public abstract create_Program(vertex_or_compute_shader: RenderStateShader<T>, frag_shader: RenderStateShader<T> | undefined): Result<RenderStateProgram<T>, Error>;

    public abstract delete_Program(program: RenderStateProgram<T>): void;

    public abstract create_ProgramState(): RenderStateProgramState<T>;

    public abstract create_ComputePipeline(program: RenderStateProgram<T>, uniform_layouts: Iterable<RenderStateUniformLayout<T>>): Result<RenderStateRenderPipeline<T>, Error>;

    public abstract create_RenderPipeline(program: RenderStateProgram<T>, program_state: RenderStateProgramState<T>, output_state: RenderStateOutputState, uniform_layouts: Iterable<RenderStateUniformLayout<T>>, attribute_layouts: Iterable<RenderStateAttributeLayout>): Result<RenderStateRenderPipeline<T>, Error>;

    public abstract delete_RenderPipeline(pipeline: RenderStateRenderPipeline<T>): void;

    public abstract delete_ComputePipeline(pipeline: RenderStateComputePipeline<T>): void;

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


    public abstract delete_TextureView(texture: RenderStateTextureView<T>): void;

    //#endregion

    //#region multi sample texture

    public abstract create_MultiSampleTexture(
        usage: RenderStateTextureUsage, format: RenderStateTextureFormat,
        width: number, height: number, sample_count: number
    ): Result<RenderStateMultiSampleTexture<T>, Error>;

    public abstract delete_MultiSampleTexture(render_buffer: RenderStateMultiSampleTexture<T>): void;

    //#endregion

    // #region uniform

    public abstract create_UniformLayout(): RenderStateUniformLayout<T>;

    public abstract delete_UniformGroup(group: RenderStateUniformGroup<T>): void;

    //#endregion
}