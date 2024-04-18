import type { RenderDevice } from "./RenderDevice";
import type { FrameBufferAttachment, RenderStateFrameBuffer } from "./render_state_objects/RenderStateFrameBuffer";
import type { RenderStateShader } from "./render_state_objects/RenderStateShader";
import type { RenderStateTexture, RenderStateTextureSampler } from "./render_state_objects/RenderStateTexture";
import type { RenderStateUniform, RenderStateUniformSlot, RenderStateUniformTypeMap } from "./render_state_objects/RenderStateUniformSlot";
import type { RenderStateVertexArray, RenderStateVertexArrayView } from "./render_state_objects/RenderStateVertexArray";
import type { RenderStateProgram } from "./render_state_objects/RenderStateProgram";
import type { RenderStateBuffer, RenderStateBufferView } from "./render_state_objects/RenderStateBuffer";
import { Result } from "../utils/Result";
import type { RenderStateRenderBuffer } from "./render_state_objects/RenderStateRenderBuffer";

export interface RenderStateInitOption { }

export enum RenderStateShaderType {
    Vertex, Fragment,
}

export enum RenderStateBufferType {
    Index, Array, Uniform
}

export enum RenderStateFrameBufferPart {
    Color = 0b001,
    Depth = 0b010,
    Stencil = 0b100,
}

export enum RenderStateBufferUsage {
    StaticCopy, StaticDraw, StaticRead,
    DynamicCopy, DynamicDraw, DynamicRead,
    StreamCopy, StreamDraw, StreamRead,
}

export enum RenderStatePrimitiveType {
    Triangles, TriangleStrip, TriangleFan, LineStrip, Lines, LineLoop
}

export enum RenderStateDataType {
    Float, Int, Byte, Short,
    UnsignedInt, UnsignedByte, UnsignedShort,
}

export enum RenderStateUniformType {
    Bool, Uint, Int, Float,
    Vector2, Vector3, Vector4, Matrix2, Matrix3, Matrix4,
    Tex2D, Tex2DArray, Tex3D, TexCubeMap
}

export enum RenderStateTextureType {
    Tex2D, TexCubeMap, Tex3D, Tex2DArray
}

export enum RenderStateTextureFormat {
    SRGBA8, SRGB8,
    RGB8, RGBA8, RGB32F, RGBA32F,
    R32F, R32UI,
    D24,
    D32F, D32FS8,
}

export enum RenderStateTextureDataFormat {
    RGB, RGBA, RInt, Red,
    Alpha,
    Luminance, LuminanceAlpha,
    Depth, DepthStencil,
}

export enum RenderStateTextureWrap {
    Clamp,
    Repeat,
    MirrorRepeat
}

export enum RenderStateTextureMagFilter {
    Linear,
    Nearest
}

export enum RenderStateTextureMinFilter {
    Linear,
    Nearest,
    NearestMipmapNearest,
    LinearMipmapNearest,
    NearestMipmapLinear,
    LinearMipmapLinear
}

export abstract class RenderState<T extends RenderState<T>> {
    public readonly render_device: RenderDevice<T>;
    public get render_state() { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>, option: RenderStateInitOption) {
        this.render_device = render_device;
    }

    // Shader

    public abstract create_Shader(type: RenderStateShaderType, source: string):
        Result<RenderStateShader<T>, Error>;

    public abstract delete_Shader(shader: RenderStateShader<T>): void;

    public abstract create_Program(vert_shader: RenderStateShader<T>, frag_shader?: RenderStateShader<T>):
        Result<RenderStateProgram<T>, Error>;

    public abstract delete_Program(program: RenderStateProgram<T>): void;

    // Buffer

    public abstract create_Buffer(type: RenderStateBufferType, usage: RenderStateBufferUsage, data_size: number, data_type: RenderStateDataType, data_normalize: boolean, divisor: number):
        Result<RenderStateBuffer<T>, Error>;

    public abstract alloc_Buffer(buffer: RenderStateBuffer<T>, byte_count: number, data?: ArrayBufferView): void;

    public abstract update_Buffer(buffer: RenderStateBuffer<T>, data: ArrayBufferView, offset: number, src_offset?: number, length?: number): void;

    public abstract delete_Buffer(buffer: RenderStateBuffer<T>): void;

    public abstract create_BufferView(buffer: RenderStateBuffer<T>, data_size: number, data_stride: number, data_offset: number, divisor: number | undefined):
        Result<RenderStateBufferView<T>, Error>;

    // Vertex Array

    public abstract create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number):
        Result<RenderStateVertexArray<T>, Error>;

    public abstract delete_VertexArray(vertex_array: RenderStateVertexArray<T>): void;

    public abstract create_VertexArrayView(vertex_array: RenderStateVertexArray<T>, offset: number, count: number):
        Result<RenderStateVertexArrayView<T>, Error>;

    public abstract toggle_VertexArrayAttribute(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enabled: boolean): void;

    public abstract set_VertexArrayAttributeBuffer(vertex_array: RenderStateVertexArray<T>,
        attribute_location: number, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    public abstract set_VertexArrayIndexBuffer(vertex_array: RenderStateVertexArray<T>, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    public abstract set_VertexArrayVertexCount(vertex_array: RenderStateVertexArray<T>, count: number): void;

    // texture

    public abstract create_Texture(type: RenderStateTextureType, constant: boolean, format: RenderStateTextureFormat, levels: number,
        wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, wrap_r: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter
    ): Result<RenderStateTexture<T>, Error>;

    public abstract alloc_Texture2D(texture: RenderStateTexture<T>, width: number, height: number, level: number, format: RenderStateTextureDataFormat, data?: ArrayBufferView): void;

    public abstract update_Texture2D(texture: RenderStateTexture<T>, level: number, format: RenderStateTextureDataFormat, data: ArrayBufferView, width: number, height: number, offset_x?: number, offset_y?: number, src_offset?: number): void;

    public abstract alloc_Texture3D(texture: RenderStateTexture<T>, width: number, height: number, depth: number, level: number, format: RenderStateTextureDataFormat, data?: ArrayBufferView): void;

    public abstract update_Texture3D(texture: RenderStateTexture<T>, level: number, format: RenderStateTextureDataFormat, data: ArrayBufferView, width: number, height: number, depth: number, offset_x?: number, offset_y?: number, offset_z?: number, src_offset?: number): void;

    public abstract set_TextureParameters(texture: RenderStateTexture<T>, wrap_s?: RenderStateTextureWrap, wrap_t?: RenderStateTextureWrap, wrap_r?: RenderStateTextureWrap, min_filter?: RenderStateTextureMinFilter, mag_filter?: RenderStateTextureMagFilter): void;

    public abstract delete_Texture(texture: RenderStateTexture<T>): void;

    // texture sampler

    public abstract create_TextureSampler(wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, wrap_r: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter):
        Result<RenderStateTextureSampler<T>, Error>;

    public abstract set_TextureSamplerParameters(sampler: RenderStateTextureSampler<T>, wrap_s?: RenderStateTextureWrap, wrap_t?: RenderStateTextureWrap, wrap_r?: RenderStateTextureWrap, min_filter?: RenderStateTextureMinFilter, mag_filter?: RenderStateTextureMagFilter): void;

    public abstract delete_TextureSampler(sampler: RenderStateTextureSampler<T>): void;

    // render buffer

    public abstract create_RenderBuffer(format: RenderStateTextureFormat, samples: number): Result<RenderStateRenderBuffer<T>, Error>;

    public abstract alloc_RenderBuffer(render_buffer: RenderStateRenderBuffer<T>, width: number, height: number): void;

    public abstract delete_RenderBuffer(render_buffer: RenderStateRenderBuffer<T>): void;

    // frame buffer

    public abstract create_FrameBuffer(): Result<RenderStateFrameBuffer<T>, Error>;

    public abstract set_FrameBufferAttachment(frame_buffer: RenderStateFrameBuffer<T>, target: any, attachment: FrameBufferAttachment<T> | undefined, level: number, layer?: number): void;

    public abstract blit_FrameBuffer(src: RenderStateFrameBuffer<T>, dst: RenderStateFrameBuffer<T>,
        parts: RenderStateFrameBufferPart, filter: RenderStateTextureMagFilter,
        src_x: number, src_y: number, src_w: number, src_h: number,
        dst_x?: number, dst_y?: number, dst_w?: number, dst_h?: number,
    ): void;

    public abstract delete_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T>): void;

    // uniform

    public abstract create_ProgramUniform<VT extends RenderStateUniformType>(program: RenderStateProgram<T>, name: string, type: VT, default_value: RenderStateUniformTypeMap<T, VT>, location?: number): Result<RenderStateUniform<T, VT>, Error>;

    public abstract set_ProgramUniform(uniform: RenderStateUniformSlot<T, RenderStateProgram<T>, RenderStateUniformType>): void;

    public abstract delete_ProgramUniform(uniform: RenderStateUniformSlot<T, RenderStateProgram<T>, RenderStateUniformType>): void;

    // draw

    public abstract use_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T> | undefined): void;

    public abstract clear_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T> | undefined, mask: RenderStateFrameBufferPart): void;

    public abstract draw_Arrays(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>, instance_count: number): void;

    public abstract draw_Elements(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>, index_data_type: RenderStateDataType, instance_count: number): void;
}