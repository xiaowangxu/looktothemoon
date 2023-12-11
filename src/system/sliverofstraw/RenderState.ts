import type { Matrix3 } from "../fivepebble/linear_algebra/Matrix3";
import type { Matrix4 } from "../fivepebble/linear_algebra/Matrix4";
import type { Vector2 } from "../fivepebble/linear_algebra/Vector2";
import type { Vector3 } from "../fivepebble/linear_algebra/Vector3";
import type { Vector4 } from "../fivepebble/linear_algebra/Vector4";
import type { RenderDevice } from "./RenderDevice";
import type { FrameBufferAttachment, RenderStateFrameBuffer } from "./render_state_objects/RenderStateFrameBuffer";
import type { RenderStateShader } from "./render_state_objects/RenderStateShader";
import type { RenderStateTexture, RenderStateTextureSampler } from "./render_state_objects/RenderStateTexture";
import type { RenderStateTextureUniformSlot, RenderStateValueUniformSlot } from "./render_state_objects/RenderStateUniformSlot";
import type { RenderStateVertexArray, RenderStateVertexArrayView } from "./render_state_objects/RenderStateVertexArray";
import type { RenderStateProgram } from "./render_state_objects/RenderStateProgram";
import type { RenderStateBuffer, RenderStateBufferView } from "./render_state_objects/RenderStateBuffer";
import { Result } from "../utils/Result";

export interface RenderStateInitOption { }

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
    Triangles, TriangleStrip, LineStrip, Lines, LineLoop
}

export enum RenderStateDataType {
    Float, Int, Byte, Short,
    UnsignedInt, UnsignedByte, UnsignedShort,
}

export enum RenderStateUniformType {
    Uint, Int, Float, Vec2, Vec3, Vec4, Mat3, Mat4, Tex2D, Tex2DArray, Tex3D
}

export type RenderStateValueUniformType = RenderStateUniformType.Uint | RenderStateUniformType.Int | RenderStateUniformType.Float | RenderStateUniformType.Vec2 | RenderStateUniformType.Vec3 | RenderStateUniformType.Vec4 | RenderStateUniformType.Mat3 | RenderStateUniformType.Mat4;
export type RenderStateTextureUniformType = RenderStateUniformType.Tex2D | RenderStateUniformType.Tex2DArray | RenderStateUniformType.Tex3D;

export interface RenderStateUniformTypeSlotMap<RS extends RenderState<RS>> {
    Uint: [number, RenderStateValueUniformSlot<RS, RenderStateUniformType.Uint, number, Uint32Array>],
    Int: [number, RenderStateValueUniformSlot<RS, RenderStateUniformType.Int, number, Int32Array>],
    Float: [number, RenderStateValueUniformSlot<RS, RenderStateUniformType.Float, number, Float32Array>],
    Vec2: [Vector2, RenderStateValueUniformSlot<RS, RenderStateUniformType.Vec2, Vector2, Float32Array>],
    Vec3: [Vector3, RenderStateValueUniformSlot<RS, RenderStateUniformType.Vec3, Vector3, Float32Array>],
    Vec4: [Vector4, RenderStateValueUniformSlot<RS, RenderStateUniformType.Vec4, Vector4, Float32Array>],
    Mat3: [Matrix3, RenderStateValueUniformSlot<RS, RenderStateUniformType.Mat3, Matrix3, Float32Array>],
    Mat4: [Matrix4, RenderStateValueUniformSlot<RS, RenderStateUniformType.Mat4, Matrix4, Float32Array>],
    Tex2D: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateUniformType.Tex2D, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
    Tex2DArray: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateUniformType.Tex2DArray, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
    Tex3D: [
        { texture?: RenderStateTexture<RS> | undefined, sampler?: RenderStateTextureSampler<RS> | undefined },
        RenderStateTextureUniformSlot<RS, RenderStateUniformType.Tex3D, RenderStateTexture<RS>, RenderStateTextureSampler<RS>>
    ],
}

type ValueOf<T> = T[keyof T];
export type RenderStateUniformTypeMap<RS extends RenderState<RS>, T extends RenderStateUniformType> = RenderStateUniformTypeSlotMap<RS>[Extract<ValueOf<{
    [K in keyof typeof RenderStateUniformType]: [K, typeof RenderStateUniformType[K]]
}>, [any, T]>[0]][0];
export type RenderStateUniformSlotTypeMap<RS extends RenderState<RS>, T extends RenderStateUniformType> = RenderStateUniformTypeSlotMap<RS>[Extract<ValueOf<{
    [K in keyof typeof RenderStateUniformType]: [K, typeof RenderStateUniformType[K]]
}>, [any, T]>[0]][1];

export enum RenderStateTextureType {
    Tex2D, CubeMap, Tex3D, Tex2DArray
}

export enum RenderStateTextureFormat {
    RGBA8, RGBA32F,
    R32UI,
    D24,
    D32F, D32FS8,
}

export enum RenderStateTextureWrap { Clamp, Repeat, MirrorRepeat }

export enum RenderStateTextureMagFilter { Linear, Nearest }

export enum RenderStateTextureMinFilter { Linear, Nearest, NearestMipmapNearest, LinearMipmapNearest, NearestMipmapLinear, LinearMipmapLinear }

export type RenderStateUniformVectorType = Uint16Array | Uint32Array | Int16Array | Uint8Array | Int8Array | Uint32Array | Int32Array | Float32Array | Float64Array;

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

    public abstract toggle_VertexArrayAttribute(vertex_array: RenderStateVertexArray<T>, attribute_location: number, enabled: boolean): void;

    public abstract set_VertexArrayInstanceCount(vertex_array: RenderStateVertexArray<T>, instance_count: number): void;

    public abstract set_VertexArrayAttributeBuffer(vertex_array: RenderStateVertexArray<T>,
        attribute_location: number, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    public abstract set_VertexArrayIndexBuffer(vertex_array: RenderStateVertexArray<T>, buffer: RenderStateBuffer<T> | RenderStateBufferView<T>): void;

    // texture

    public abstract create_Texture(type: RenderStateTextureType, constant: boolean, format: RenderStateTextureFormat, levels: number,
        wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, wrap_r: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter
    ): Result<RenderStateTexture<T>, Error>;

    public abstract alloc_Texture2D(texture: RenderStateTexture<T>, width: number, height: number, level: number, data?: ArrayBufferView): void;

    public abstract update_Texture2D(texture: RenderStateTexture<T>, level: number, data: ArrayBufferView, width: number, height: number, offset_x?: number, offset_y?: number, src_offset?: number): void;

    public abstract alloc_Texture3D(texture: RenderStateTexture<T>, width: number, height: number, depth: number, level: number, data?: ArrayBufferView): void;

    public abstract update_Texture3D(texture: RenderStateTexture<T>, level: number, data: ArrayBufferView, width: number, height: number, depth: number, offset_x?: number, offset_y?: number, offset_z?: number, src_offset?: number): void;

    public abstract set_TextureParameters(texture: RenderStateTexture<T>, wrap_s?: RenderStateTextureWrap, wrap_t?: RenderStateTextureWrap, wrap_r?: RenderStateTextureWrap, min_filter?: RenderStateTextureMinFilter, mag_filter?: RenderStateTextureMagFilter): void;

    public abstract delete_Texture(texture: RenderStateTexture<T>): void;

    // texture sampler

    public abstract create_TextureSampler(wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, wrap_r: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter):
        Result<RenderStateTextureSampler<T>, Error>;

    public abstract set_TextureSamplerParameters(sampler: RenderStateTextureSampler<T>, wrap_s?: RenderStateTextureWrap, wrap_t?: RenderStateTextureWrap, wrap_r?: RenderStateTextureWrap, min_filter?: RenderStateTextureMinFilter, mag_filter?: RenderStateTextureMagFilter): void;

    public abstract delete_TextureSampler(sampler: RenderStateTextureSampler<T>): void;

    // frame buffer

    public abstract create_FrameBuffer(): Result<RenderStateFrameBuffer<T>, Error>;

    public abstract set_FrameBufferAttachment(frame_buffer: RenderStateFrameBuffer<T>, target: any, attachment: FrameBufferAttachment<T> | undefined): void;

    public abstract delete_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T>): void;

    // uniform

    public abstract set_ProgramUniform<VT extends RenderStateUniformType>(program: RenderStateProgram<T>, uniform_location: any, uniform_type: VT, data: RenderStateUniformSlotTypeMap<T, VT>): void;

    // draw

    public abstract use_FrameBuffer(frame_buffer: RenderStateFrameBuffer<T> | undefined): void;

    public abstract draw_Arrays(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>): void;

    public abstract draw_Elements(program: RenderStateProgram<T>, vertex_array: RenderStateVertexArray<T> | RenderStateVertexArrayView<T>, index_data_type: RenderStateDataType): void;
}