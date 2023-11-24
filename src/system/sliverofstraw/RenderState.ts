import { Result } from "../utils/Result";
import type { RenderDevice } from "./RenderDevice";
import { RenderStateBuffer, RenderStateBufferView } from "./render_state_objects/RenderStateBuffer";
import { RenderStateProgram } from "./render_state_objects/RenderStateProgram";
import type { RenderStateShader } from "./render_state_objects/RenderStateShader";
import type { RenderStateVertexArray, RenderStateVertexArrayView } from "./render_state_objects/RenderStateVertexArray";

export enum RenderStateShaderType {
    Vertex, Fragment,
}

export enum RenderStateBufferType {
    Index, Array,
}

export enum RenderStateBufferUsage {
    StaticCopy, StaticDraw, StaticRead,
    DynamicCopy, DynamicDraw, DynamicRead,
}

export enum RenderStatePrimitiveType {
    Triangles,
}

export enum RenderStateDataType {
    Float, Int, Byte, Short,
    UnsignedInt, UnsignedByte, UnsignedShort,
}

export abstract class RenderState<T extends RenderState<T>> {
    public readonly render_device: RenderDevice<T>;
    public get render_state() { return this.render_device.render_state; }

    constructor(render_device: RenderDevice<T>) {
        this.render_device = render_device;
    }

    // Shader

    public abstract create_Shader(type: RenderStateShaderType, source: string):
        Result<RenderStateShader<RenderState<T>>, Error>;

    public abstract delete_Shader(shader: RenderStateShader<RenderState<T>>): void;

    public abstract create_Program(vert_shader: RenderStateShader<RenderState<T>>, frag_shader: RenderStateShader<RenderState<T>>):
        Result<RenderStateProgram<RenderState<T>>, Error>;

    public abstract delete_Program(program: RenderStateProgram<RenderState<T>>): void;

    public abstract get_ProgramAttributeLocation(program: RenderStateProgram<RenderState<T>>, attribute: string): number;

    public abstract get_ProgramUniformLocation(program: RenderStateProgram<RenderState<T>>, uniform: string): any;

    // Buffer

    public abstract create_Buffer(type: RenderStateBufferType, usage: RenderStateBufferUsage, data_size: number, data_type: RenderStateDataType, data_normalize: boolean, divisor: number):
        Result<RenderStateBuffer<RenderState<T>>, Error>;

    public abstract alloc_Buffer(buffer: RenderStateBuffer<RenderState<T>>, size: number, data?: ArrayBufferView): void;

    public abstract update_Buffer(buffer: RenderStateBuffer<RenderState<T>>, data: ArrayBufferView, offset: number, src_offset?: number, length?: number): void;

    public abstract delete_Buffer(buffer: RenderStateBuffer<RenderState<T>>): void;

    public abstract create_BufferView(buffer: RenderStateBuffer<RenderState<T>>, data_size: number, data_stride: number, data_offset: number, divisor: number):
        Result<RenderStateBufferView<RenderState<T>>, Error>;

    // Vertex Array

    public abstract create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number, instance_count: number):
        Result<RenderStateVertexArray<RenderState<T>>, Error>;

    public abstract delete_VertexArray(vertex_array: RenderStateVertexArray<RenderState<T>>): void;

    public abstract create_VertexArrayView(vertex_array: RenderStateVertexArray<RenderState<T>>, offset: number, count: number, instance_count: number):
        Result<RenderStateVertexArrayView<RenderState<T>>, Error>;

    public abstract set_VertexArrayAttribute(vertex_array: RenderStateVertexArray<RenderState<T>>, attribute_location: number, enabled: boolean): void;

    public abstract set_VertexArrayAttributeBuffer(vertex_array: RenderStateVertexArray<RenderState<T>>,
        attribute_location: number, buffer: RenderStateBuffer<RenderState<T>> | RenderStateBufferView<RenderState<T>>): void;

    public abstract set_VertexArrayIndexBuffer(vertex_array: RenderStateVertexArray<RenderState<T>>, buffer: RenderStateBuffer<RenderState<T>> | RenderStateBufferView<RenderState<T>>): void;
}