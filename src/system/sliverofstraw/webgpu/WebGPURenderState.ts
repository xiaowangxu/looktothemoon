import type { Result } from "@/system/utils/Result";
import { RenderState, RenderStatePrimitiveType } from "../RenderState";
import type { RenderStateBufferDataType, RenderStateBuffer } from "../render_state_objects/buffer/RenderStateBuffer";
import type { RenderStateFrameBuffer } from "../render_state_objects/frame_buffer/RenderStateFrameBuffer";
import type { RenderStatePassCollection } from "../render_state_objects/pass/RenderStatePassCollection";
import type { RenderStateAttributeLayout } from "../render_state_objects/pipeline/RenderStateAttributeLayout";
import type { RenderStateComputePipeline } from "../render_state_objects/pipeline/RenderStateComputePipeline";
import type { RenderStateProgram } from "../render_state_objects/pipeline/RenderStateProgram";
import type { RenderStateProgramState, RenderStateDepthCompareFunc } from "../render_state_objects/pipeline/RenderStateProgramState";
import type { RenderStateRenderPipeline } from "../render_state_objects/pipeline/RenderStateRenderPipeline";
import type { RenderStateShaderType, RenderStateShader } from "../render_state_objects/pipeline/RenderStateShader";
import type { RenderStateMultiSampleTexture } from "../render_state_objects/texture/RenderStateMultiSampleTexture";
import type { RenderStateTextureUsage, RenderStateTextureFormat, RenderStateTextureDimension, RenderStateTexture } from "../render_state_objects/texture/RenderStateTexture";
import type { RenderStateTextureWrap, RenderStateTextureFilter, RenderStateTextureSampler } from "../render_state_objects/texture/RenderStateTextureSampler";
import type { RenderStateTextureView } from "../render_state_objects/texture/RenderStateTextureView";
import type { RenderStateUniformGroup } from "../render_state_objects/uniform/RenderStateUniformGroup";
import type { RenderStateUniformLayout } from "../render_state_objects/uniform/RenderStateUniformLayout";
import type { RenderStateVertexArray } from "../render_state_objects/vertex_array/RenderStateVertexArray";

export class WebGPURenderState extends RenderState<WebGPURenderState> {

    
    public create_Shader(type: RenderStateShaderType, source: string, defines?: { [key: string]: string; } | undefined): Result<RenderStateShader<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_Shader(shader: RenderStateShader<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_Program(vertex_or_compute_shader: RenderStateShader<WebGPURenderState>, frag_shader: RenderStateShader<WebGPURenderState> | undefined): Result<RenderStateProgram<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_Program(program: RenderStateProgram<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_ProgramState(): RenderStateProgramState<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }
    public create_ComputePipeline(program: RenderStateProgram<WebGPURenderState>, uniform_layouts: Iterable<RenderStateUniformLayout<WebGPURenderState>>): Result<RenderStateRenderPipeline<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public create_RenderPipeline(program: RenderStateProgram<WebGPURenderState>, program_state: RenderStateProgramState<WebGPURenderState>, uniform_layouts: Iterable<RenderStateUniformLayout<WebGPURenderState>>, attribute_layouts: Iterable<RenderStateAttributeLayout>): Result<RenderStateRenderPipeline<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_RenderPipeline(pipeline: RenderStateRenderPipeline<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public delete_ComputePipeline(pipeline: RenderStateComputePipeline<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_Buffer(type: number, usage: number, data_type: RenderStateBufferDataType, element_size: number, size: number): Result<RenderStateBuffer<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public get_BufferDataTypeBytes(format: RenderStateBufferDataType): number {
        throw new Error("Method not implemented.");
    }
    public delete_Buffer(buffer: RenderStateBuffer<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number): Result<RenderStateVertexArray<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_VertexArray(vertex_array: RenderStateVertexArray<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_PassCollection(): RenderStatePassCollection<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }
    public submit_PassCollections(pass_collections: Iterable<RenderStatePassCollection<WebGPURenderState>>): void {
        throw new Error("Method not implemented.");
    }
    public create_FrameBuffer(): Result<RenderStateFrameBuffer<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_FrameBuffer(frame_buffer: RenderStateFrameBuffer<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_TextureSampler(wrap_u: RenderStateTextureWrap, wrap_v: RenderStateTextureWrap, wrap_w: RenderStateTextureWrap, min_filter: RenderStateTextureFilter, mag_filter: RenderStateTextureFilter, mipmap_filter: RenderStateTextureFilter, compare: RenderStateDepthCompareFunc | undefined, min_lod: number, max_lod: number, anisotropy: number): Result<RenderStateTextureSampler<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_TextureSampler(sampler: RenderStateTextureSampler<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_Texture(usage: RenderStateTextureUsage, format: RenderStateTextureFormat, dimension: RenderStateTextureDimension, width: number, height: number, depth: number, mipmap_level_count: number): Result<RenderStateTexture<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public get_TextureFormatTexelBytes(format: RenderStateTextureFormat): number {
        throw new Error("Method not implemented.");
    }
    public delete_Texture(texture: RenderStateTexture<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public delete_TextureView(texture: RenderStateTextureView<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_MultiSampleTexture(usage: RenderStateTextureUsage, format: RenderStateTextureFormat, width: number, height: number, sample_count: number): Result<RenderStateMultiSampleTexture<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_MultiSampleTexture(render_buffer: RenderStateMultiSampleTexture<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_UniformLayout(): RenderStateUniformLayout<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }
    public delete_UniformGroup(group: RenderStateUniformGroup<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    
}