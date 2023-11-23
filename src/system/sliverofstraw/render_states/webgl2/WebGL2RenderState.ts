import { Result } from "@/system/utils/Result";
import type { RenderDevice } from "../../RenderDevice";
import { RenderState } from "../../RenderState";
import { RenderStateBuffer, RenderStateBufferView } from "../../render_state_objects/RenderStateBuffer";
import { RenderStateShader } from "../../render_state_objects/RenderStateShader";
import { RenderStateProgram } from "../../render_state_objects/RenderStateProgram";
import { RenderStateVertexArray, RenderStateVertexArrayView } from "../../render_state_objects/RenderStateVertexArray";

export class WebGL2RenderState extends RenderState<WebGL2RenderState> {
    public readonly gl: WebGL2RenderingContext;

    // #region state proxy

    // buffer
    private buffer_state: (WebGLBuffer | null)[] = [null, null, null, null, null, null, null, null];
    private bind_BufferProxy(target: number, buffer: WebGLBuffer | null) {
        let buffer_state_index = 0;
        switch (target) {
            case this.gl.ARRAY_BUFFER: /*              */ buffer_state_index = 0; break;
            case this.gl.ELEMENT_ARRAY_BUFFER: /*      */ buffer_state_index = 1; break;
            case this.gl.COPY_READ_BUFFER: /*          */ buffer_state_index = 2; break;
            case this.gl.COPY_WRITE_BUFFER: /*         */ buffer_state_index = 3; break;
            case this.gl.TRANSFORM_FEEDBACK_BUFFER: /* */ buffer_state_index = 4; break;
            case this.gl.UNIFORM_BUFFER: /*            */ buffer_state_index = 5; break;
            case this.gl.PIXEL_PACK_BUFFER: /*         */ buffer_state_index = 6; break;
            case this.gl.PIXEL_UNPACK_BUFFER: /*       */ buffer_state_index = 7; break;
            default: throw new Error('<WebGL2RenderState> bind_BufferProxy: bind target point is invalid');
        }
        if (this.buffer_state[buffer_state_index] !== buffer) {
            this.buffer_state[buffer_state_index] = buffer;
            this.gl.bindBuffer(target, buffer);
        }
    }

    // vertex array
    private vertex_array_state: WebGLVertexArrayObject | null = null;
    private bind_VertexArrayProxy(vertex_array: WebGLVertexArrayObject | null) {
        if (this.vertex_array_state !== vertex_array) {
            this.vertex_array_state = vertex_array;
            this.gl.bindVertexArray(vertex_array);
        }
    }

    // use program
    private use_program_state: WebGLProgram | null = null;
    public use_ProgramProxy(program: WebGLProgram | null) {
        if (this.use_program_state !== program) {
            this.use_program_state = program;
            this.gl.useProgram(program);
        }
    }

    // enable caps
    private caps_state: (boolean | null)[] = [null, null, null, null, null, null, null, null, null, null];
    public set_CapabilityProxy(cap: number, enable: boolean) {
        let caps_state_index = 0;
        switch (cap) {
            case this.gl.BLEND: /*                   */ caps_state_index = 0; break;
            case this.gl.CULL_FACE: /*               */ caps_state_index = 1; break;
            case this.gl.DEPTH_TEST: /*              */ caps_state_index = 2; break;
            case this.gl.DITHER: /*                  */ caps_state_index = 3; break;
            case this.gl.POLYGON_OFFSET_FILL: /*     */ caps_state_index = 4; break;
            case this.gl.SAMPLE_ALPHA_TO_COVERAGE: /**/ caps_state_index = 5; break;
            case this.gl.SAMPLE_COVERAGE: /*         */ caps_state_index = 6; break;
            case this.gl.SCISSOR_TEST: /*            */ caps_state_index = 7; break;
            case this.gl.STENCIL_TEST: /*            */ caps_state_index = 8; break;
            case this.gl.RASTERIZER_DISCARD: /*      */ caps_state_index = 9; break;
            default: throw new Error('<WebGL2RenderState> set_CapabilityProxy: capability is invalid');
        }
        if (this.caps_state[caps_state_index] !== enable) {
            this.caps_state[caps_state_index] = enable;
            if (enable) this.gl.enable(cap);
            else this.gl.disable(cap);
        }
    }

    // #endregion

    constructor(render_device: RenderDevice<WebGL2RenderState>) {
        super(render_device);
        const gl = this.render_device.canvas.getContext('webgl2');
        if (gl === null) throw new Error('<WebGL2RenderState> constructor: failed to get webgl2 context');
        this.gl = gl;
    }

    // Shader

    public create_Shader(type: number, source: string):
        Result<RenderStateShader<RenderState<WebGL2RenderState>>, Error> {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (shader === null) return Result.Error(new Error('<WebGL2RenderState> create_Shader: failed to create render state shader'));
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return Result.Ok(new RenderStateShader(this.render_state, shader, type));
        }
        const res: Result<RenderStateShader<RenderState<WebGL2RenderState>>, Error> = Result.Error(new Error(`<WebGL2RenderState> create_Shader: failed to create render state shader:\n${gl.getShaderInfoLog(shader) ?? 'unknown error'}\nin ${source}`));
        gl.deleteShader(shader);
        return res;
    }

    public delete_Shader(shader: RenderStateShader<RenderState<WebGL2RenderState>>): void {
        this.gl.deleteShader(shader.shader);
        console.log("delete shader", shader.id);
    }

    public create_Program(vert_shader: RenderStateShader<RenderState<WebGL2RenderState>>, frag_shader: RenderStateShader<RenderState<WebGL2RenderState>>):
        Result<RenderStateProgram<RenderState<WebGL2RenderState>>, Error> {
        const gl = this.gl;
        const program = gl.createProgram();
        if (program === null) return Result.Error(new Error('<WebGL2RenderState> create_Program: failed to create render state program'));
        gl.attachShader(program, vert_shader.shader);
        gl.attachShader(program, frag_shader.shader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return Result.Ok(new RenderStateProgram(this.render_state, program, vert_shader, frag_shader));
        }
        const res: Result<RenderStateProgram<RenderState<WebGL2RenderState>>, Error> = Result.Error(new Error(`<WebGL2RenderState> create_Program: failed to create render state program:\n${gl.getProgramInfoLog(program) ?? 'unknown error'}`));
        gl.deleteProgram(program);
        return res;
    }

    public delete_Program(program: RenderStateProgram<RenderState<WebGL2RenderState>>): void {
        this.gl.deleteProgram(program.program);
        console.log("delete program", program.id);
    }

    public get_ProgramAttributeLocation(program: RenderStateProgram<RenderState<WebGL2RenderState>>, attribute: string) {
        return this.gl.getAttribLocation(program.program, attribute);
    }

    public get_ProgramUniformLocation(program: RenderStateProgram<RenderState<WebGL2RenderState>>, uniform: string) {
        return this.gl.getUniformLocation(program.program, uniform);
    }

    // Buffer

    public create_Buffer(type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, divisor: number):
        Result<RenderStateBuffer<RenderState<WebGL2RenderState>>, Error> {
        const buffer = this.gl.createBuffer();
        if (buffer === null) return Result.Error(new Error('<WebGL2RenderState> create_Buffer: failed to create render state buffer'));
        return Result.Ok(new RenderStateBuffer(this.render_state, buffer, type, usage, data_size, data_type, data_normalize, 0, 0, divisor));
    }

    public alloc_Buffer(buffer: RenderStateBuffer<RenderState<WebGL2RenderState>>, size: number, data?: ArrayBufferView): void {
        this.bind_BufferProxy(buffer.type, buffer.buffer);
        if (data === undefined) {
            this.gl.bufferData(buffer.type, size, buffer.usage);
        }
        else {
            this.gl.bufferData(buffer.type, data, buffer.usage);
        }
    }

    public update_Buffer(buffer: RenderStateBuffer<RenderState<WebGL2RenderState>>, data: ArrayBufferView, offset: number = 0, src_offset?: number, length?: number) {
        this.bind_BufferProxy(buffer.type, buffer.buffer);
        if (src_offset === undefined) {
            this.gl.bufferSubData(buffer.type, offset, data);
        }
        else {
            this.gl.bufferSubData(buffer.type, offset, data, src_offset, length)
        }
    }

    public delete_Buffer(buffer: RenderStateBuffer<RenderState<WebGL2RenderState>>): void {
        this.gl.deleteBuffer(buffer.buffer);
        console.log("delete buffer", buffer.id);
    }

    public create_BufferView(buffer: RenderStateBuffer<RenderState<WebGL2RenderState>>, data_size: number, data_stride: number, data_offset: number, divisor: number):
        Result<RenderStateBufferView<RenderState<WebGL2RenderState>>, Error> {
        return Result.Ok(new RenderStateBufferView(this.render_state, buffer, data_size, data_stride, data_offset, divisor));
    }

    // Vertex Array

    public create_VertexArray(primitive_type: number, offset: number, count: number, instance_count: number = 1):
        Result<RenderStateVertexArray<RenderState<WebGL2RenderState>>, Error> {
        const vertex_array = this.gl.createVertexArray();
        if (vertex_array === null) return Result.Error(new Error('<WebGL2RenderState> create_VertexArray: failed to create render state vertex array'));
        return Result.Ok(new RenderStateVertexArray(this.render_state, vertex_array, primitive_type, offset, count, instance_count));
    }

    public delete_VertexArray(vertex_array: RenderStateVertexArray<RenderState<WebGL2RenderState>>): void {
        this.gl.deleteVertexArray(vertex_array.vertex_array);
        console.log("delete buffer", vertex_array.id);
    }

    public create_VertexArrayView(vertex_array: RenderStateVertexArray<RenderState<WebGL2RenderState>>, offset: number, count: number, instance_count: number = 1):
        Result<RenderStateVertexArrayView<RenderState<WebGL2RenderState>>, Error> {
        return Result.Ok(new RenderStateVertexArrayView(this.render_state, vertex_array, offset, count, instance_count));
    }

    public set_VertexArrayAttribute(vertex_array: RenderStateVertexArray<RenderState<WebGL2RenderState>>, attribute_location: number, enable: boolean): void {
        const gl = this.gl;
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (enable) gl.enableVertexAttribArray(attribute_location);
        else gl.disableVertexAttribArray(attribute_location);
    }

    public set_VertexArrayAttributeBuffer(vertex_array: RenderStateVertexArray<RenderState<WebGL2RenderState>>,
        attribute_location: number, buffer: RenderStateBuffer<RenderState<WebGL2RenderState>> | RenderStateBufferView<RenderState<WebGL2RenderState>>): void {
        const gl = this.gl;
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        const { data_size, data_type, data_stride, data_normalize, data_offset, divisor } = buffer;
        gl.vertexAttribPointer(attribute_location, data_size, data_type, data_normalize, data_stride, data_offset);
        gl.vertexAttribDivisor(attribute_location, divisor);
    }
}