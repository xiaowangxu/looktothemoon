import { Result } from "../utils/Result";
import type { RenderDevice } from "./RenderDevice";
import { RenderStateBuffer, RenderStateBufferView } from "./render_state_objects/RenderStateBuffer";
import { RenderStateProgram } from "./render_state_objects/RenderStateProgram";
import type { RenderStateShader } from "./render_state_objects/RenderStateShader";
import type { RenderStateTexture } from "./render_state_objects/RenderStateTexture";
import type { RenderStateVertexArray, RenderStateVertexArrayView } from "./render_state_objects/RenderStateVertexArray";

export enum RenderStateShaderType {
    Vertex, Fragment,
}

export enum RenderStateBufferType {
    Index, Array, Uniform
}

export enum RenderStateBufferUsage {
    StaticCopy, StaticDraw, StaticRead,
    DynamicCopy, DynamicDraw, DynamicRead,
}

export enum RenderStatePrimitiveType {
    Triangles, LineStrip, Lines, LineLoop
}

export enum RenderStateDataType {
    Float, Int, Byte, Short,
    UnsignedInt, UnsignedByte, UnsignedShort,
}

export enum RenderStateValueType {
    Int, Float, Vec2, Vec3, Vec4, Mat3, Mat4, Tex2D,
}

export enum RenderStateTextureType {
    Tex2D, CubeMap, Tex3D, Tex2DArray
}

export enum RenderStateTextureFormat {
    RGBA8, RGBA32F,
    R32UI,
    D32F, D32FS8,
}

export enum RenderStateTextureWrap { Clamp, Repeat, MirrorRepeat }

export enum RenderStateTextureMagFilter { Linear, Nearest }

export enum RenderStateTextureMinFilter { Linear, Nearest, NearestMipmapNearest, LinearMipmapNearest, NearestMipmapLinear, LinearMipmapLinear }

export type RenderStateUniformVectorType = Uint16Array | Int16Array | Uint8Array | Int8Array | Uint32Array | Int32Array | Float32Array | Float64Array;

export abstract class RenderState<T extends RenderState<T>> {
    public readonly render_device: RenderDevice<T>;
    public get render_state() { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>) {
        this.render_device = render_device;
    }

    // Shader

    public abstract create_Shader(type: RenderStateShaderType, source: string):
        Result<RenderStateShader<T>, Error>;

    public abstract delete_Shader(shader: RenderStateShader<T>): void;

    public abstract create_Program(vert_shader: RenderStateShader<T>, frag_shader: RenderStateShader<T>):
        Result<RenderStateProgram<T>, Error>;

    public abstract delete_Program(program: RenderStateProgram<T>): void;

    // Buffer

    public abstract create_Buffer(type: RenderStateBufferType, usage: RenderStateBufferUsage, data_size: number, data_type: RenderStateDataType, data_normalize: boolean, divisor: number):
        Result<RenderStateBuffer<T>, Error>;

    public abstract alloc_Buffer(buffer: RenderStateBuffer<T>, size: number, data?: ArrayBufferView): void;

    public abstract update_Buffer(buffer: RenderStateBuffer<T>, data: ArrayBufferView, offset: number, src_offset?: number, length?: number): void;

    public abstract delete_Buffer(buffer: RenderStateBuffer<T>): void;

    public abstract create_BufferView(buffer: RenderStateBuffer<T>, data_size: number, data_stride: number, data_offset: number, divisor: number):
        Result<RenderStateBufferView<T>, Error>;

    // Vertex Array

    public abstract create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number, instance_count: number):
        Result<RenderStateVertexArray<T>, Error>;

    public abstract delete_VertexArray(vertex_array: RenderStateVertexArray<T>): void;

    public abstract create_VertexArrayView(vertex_array: RenderStateVertexArray<T>, offset: number, count: number, instance_count: number):
        Result<RenderStateVertexArrayView<T>, Error>;

    public abstract set_VertexArrayAttribute(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enabled: boolean): void;

    public abstract set_VertexArrayAttributeBuffer(vertex_array: RenderStateVertexArray<T>,
        attribute_location: number, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    public abstract set_VertexArrayIndexBuffer(vertex_array: RenderStateVertexArray<T>, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    // texture

    public abstract create_Texture(type: RenderStateTextureType, format: RenderStateTextureFormat,
        wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap,
        min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter
    ): Result<RenderStateTexture<T>, Error>;

    // uniform

    public abstract set_ProgramUniform(program: RenderStateProgram<T>, uniform_location: WebGLUniformLocation, uniform_type: RenderStateValueType, data: RenderStateUniformVectorType): void;

    // draw

    public abstract drawArrays(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>): void;

    public abstract drawElements(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>, index_data_type: RenderStateDataType): void;
}