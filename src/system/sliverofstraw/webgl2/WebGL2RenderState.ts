import { Result } from "@/system/utils/Result";
import type { RenderDevice } from "../RenderDevice";
import { RenderState, RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType, RenderStateValueType, type RenderStateUniformVectorType, RenderStateTextureWrap, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureFormat, RenderStateTextureType, type RenderStateValueTypeKey } from "../RenderState";
import { WebGL2RenderStateBuffer, WebGL2RenderStateBufferView } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { WebGL2RenderStateShader } from "./webgl2_render_state_objects/WebGL2RenderStateShader";
import { WebGL2RenderStateProgram } from "./webgl2_render_state_objects/WebGL2RenderStateProgram";
import { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "./webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import { WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler } from "./webgl2_render_state_objects/WebGL2RenderStateTexture";
import { WeakRef } from "@/system/utils/RefCounted";
import { WebGL2RenderStateFrameBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import type { RenderStateFrameBuffer, FrameBufferAttachment } from "../render_state_objects/RenderStateFrameBuffer";

export class WebGL2RenderState extends RenderState<WebGL2RenderState> {
    public readonly gl: WebGL2RenderingContext;

    private static readonly TextureSlotBase = 1;
    private static readonly TextureSlotPreserved = 3;

    public readonly max_texture_slot: number;
    public readonly user_texture_slot_count: number;
    private readonly active_texture_slots: WeakRef<WebGL2RenderStateTexture>[];
    private active_texture_slot_pointer: number = 0;

    // #region state proxy

    // buffer
    private buffer_state: (WebGLBuffer | null)[] = [null, null, null, null, null, null, null, null];
    public bind_BufferProxy(target: number, buffer: WebGLBuffer | null) {
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
            return true;
        }
        return false;
    }

    // vertex array
    private vertex_array_state: WebGLVertexArrayObject | null = null;
    public bind_VertexArrayProxy(vertex_array: WebGLVertexArrayObject | null) {
        if (this.vertex_array_state !== vertex_array) {
            this.vertex_array_state = vertex_array;
            this.gl.bindVertexArray(vertex_array);
            return true;
        }
        return false;
    }

    // texture
    private texture_state: (WebGLTexture | null)[] = [null, null, null, null];
    public bind_TextureProxy(target: number, texture: WebGLTexture | null) {
        let texture_state_index = 0;
        switch (target) {
            case this.gl.TEXTURE_2D: /*          */ texture_state_index = 0; break;
            case this.gl.TEXTURE_CUBE_MAP: /*    */ texture_state_index = 1; break;
            case this.gl.TEXTURE_3D: /*          */ texture_state_index = 2; break;
            case this.gl.TEXTURE_2D_ARRAY: /*    */ texture_state_index = 3; break;
            default: throw new Error('<WebGL2RenderState> bind_TextureProxy: bind target point is invalid');
        }
        if (this.texture_state[texture_state_index] !== texture) {
            this.texture_state[texture_state_index] = texture;
            this.gl.bindTexture(target, texture);
            return true;
        }
        return false;
    }

    // texture
    private frame_buffer_state: (WebGLFramebuffer | null)[] = [null, null, null];
    public bind_FrameBufferProxy(target: number, texture: WebGLFramebuffer | null) {
        let frame_buffer_state_index = 0;
        switch (target) {
            case this.gl.FRAMEBUFFER: /*         */ frame_buffer_state_index = 0; break;
            case this.gl.READ_FRAMEBUFFER: /*    */ frame_buffer_state_index = 1; break;
            case this.gl.DRAW_FRAMEBUFFER: /*    */ frame_buffer_state_index = 2; break;
            default: throw new Error('<WebGL2RenderState> bind_FrameBufferProxy: bind target point is invalid');
        }
        if (this.frame_buffer_state[frame_buffer_state_index] !== texture) {
            this.frame_buffer_state[frame_buffer_state_index] = texture;
            this.gl.bindFramebuffer(target, texture);
            return true;
        }
        return false;
    }

    // use program
    private use_program_state: WebGLProgram | null = null;
    public use_ProgramProxy(program: WebGLProgram | null) {
        if (this.use_program_state !== program) {
            this.use_program_state = program;
            this.gl.useProgram(program);
            return true;
        }
        return false;
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
            return true;
        }
        return false;
    }

    private face_winding_state: number | null = null;
    public set_FaceWindingProxy(direction: number) {
        if (this.face_winding_state !== direction) {
            this.face_winding_state = direction;
            this.gl.frontFace(direction);
            return true;
        }
        return false;
    }

    private depth_func_state: number | null = null;
    public set_DepthFuncProxy(func: number) {
        if (this.depth_func_state !== func) {
            this.depth_func_state = func;
            this.gl.depthFunc(func);
            return true;
        }
        return false;
    }

    private viewport_state: [number | null, number | null, number | null, number | null] = [null, null, null, null];
    public set_ViewportProxy(x: number, y: number, w: number, h: number) {
        const [_x, _y, _w, _h] = this.viewport_state;
        if (_x !== x || _y !== y || _w !== w || _h !== h) {
            this.viewport_state[0] = x;
            this.viewport_state[1] = y;
            this.viewport_state[2] = w;
            this.viewport_state[3] = h;
            this.gl.viewport(x, y, w, h);
            return true;
        }
        return false;
    }

    private scissor_state: [number | null, number | null, number | null, number | null] = [null, null, null, null];
    public set_ScissorProxy(x: number, y: number, w: number, h: number) {
        const [_x, _y, _w, _h] = this.viewport_state;
        if (_x !== x || _y !== y || _w !== w || _h !== h) {
            this.scissor_state[0] = x;
            this.scissor_state[1] = y;
            this.scissor_state[2] = w;
            this.scissor_state[3] = h;
            this.gl.scissor(x, y, w, h);
            return true;
        }
        return false;
    }

    private clear_color_state: [number | null, number | null, number | null, number | null] = [null, null, null, null];
    public set_ClearColorProxy(r: number, g: number, b: number, a: number) {
        const [_r, _g, _b, _a] = this.clear_color_state;
        if (_r !== r || _g !== g || _b !== b || _a !== a) {
            this.clear_color_state[0] = r;
            this.clear_color_state[1] = g;
            this.clear_color_state[2] = b;
            this.clear_color_state[3] = a;
            this.gl.clearColor(r, g, b, a);
            return true;
        }
        return false;
    }

    // #endregion

    constructor(render_device: RenderDevice<WebGL2RenderState>) {
        super(render_device);
        const gl = this.render_device.canvas.getContext('webgl2', { antialias: true });
        if (gl === null) throw new Error('<WebGL2RenderState> constructor: failed to get webgl2 context');
        this.gl = gl as WebGL2RenderingContext;
        this.max_texture_slot = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.user_texture_slot_count = this.max_texture_slot - WebGL2RenderState.TextureSlotBase - WebGL2RenderState.TextureSlotPreserved;
        if (this.user_texture_slot_count <= 0) throw new Error('<WebGL2RenderState> constructor: texture unit not enough');
        this.active_texture_slots = new Array(this.user_texture_slot_count);
    }

    // #region enum

    public get_PrimitiveType(primitive_type: RenderStatePrimitiveType): number {
        switch (primitive_type) {
            case RenderStatePrimitiveType.Triangles: return this.gl.TRIANGLES;
            case RenderStatePrimitiveType.LineStrip: return this.gl.LINE_STRIP;
            case RenderStatePrimitiveType.Lines: return this.gl.LINES;
            case RenderStatePrimitiveType.LineLoop: return this.gl.LINE_LOOP;
            default: {
                const n: never = primitive_type;
                return n;
            }
        }
    }

    public get_DataType(data_type: RenderStateDataType): number {
        switch (data_type) {
            case RenderStateDataType.Float: return this.gl.FLOAT;
            case RenderStateDataType.Int: return this.gl.INT;
            case RenderStateDataType.UnsignedInt: return this.gl.UNSIGNED_INT;
            case RenderStateDataType.Byte: return this.gl.BYTE;
            case RenderStateDataType.UnsignedByte: return this.gl.UNSIGNED_BYTE;
            case RenderStateDataType.Short: return this.gl.SHORT;
            case RenderStateDataType.UnsignedShort: return this.gl.UNSIGNED_SHORT;
            default: {
                const n: never = data_type;
                return n;
            }
        }
    }

    public get_BufferType(type: RenderStateBufferType): number {
        switch (type) {
            case RenderStateBufferType.Index: return this.gl.ELEMENT_ARRAY_BUFFER;
            case RenderStateBufferType.Array: return this.gl.ARRAY_BUFFER;
            case RenderStateBufferType.Uniform: return this.gl.UNIFORM_BUFFER;
            default: {
                const n: never = type;
                return n;
            }
        }
    }

    public get_BufferUsage(usage: RenderStateBufferUsage): number {
        switch (usage) {
            case RenderStateBufferUsage.StaticCopy: return this.gl.STATIC_COPY;
            case RenderStateBufferUsage.StaticDraw: return this.gl.STATIC_DRAW;
            case RenderStateBufferUsage.StaticRead: return this.gl.STATIC_READ;
            case RenderStateBufferUsage.DynamicCopy: return this.gl.DYNAMIC_COPY;
            case RenderStateBufferUsage.DynamicDraw: return this.gl.DYNAMIC_DRAW;
            case RenderStateBufferUsage.DynamicRead: return this.gl.DYNAMIC_READ;
            default: {
                const n: never = usage;
                return n;
            }
        }
    }

    public get_ShaderType(type: RenderStateShaderType): number {
        switch (type) {
            case RenderStateShaderType.Vertex: return this.gl.VERTEX_SHADER;
            case RenderStateShaderType.Fragment: return this.gl.FRAGMENT_SHADER;
            default: {
                const n: never = type;
                return n;
            }
        }
    }

    public get_TextureType(type: RenderStateTextureType): number {
        switch (type) {
            case RenderStateTextureType.Tex2D: return this.gl.TEXTURE_2D;
            case RenderStateTextureType.CubeMap: return this.gl.TEXTURE_CUBE_MAP;
            case RenderStateTextureType.Tex3D: return this.gl.TEXTURE_3D;
            case RenderStateTextureType.Tex2DArray: return this.gl.TEXTURE_2D_ARRAY;
            default: {
                const n: never = type;
                return n;
            }
        }
    }

    public get_TextureWrap(wrap: RenderStateTextureWrap): number {
        switch (wrap) {
            case RenderStateTextureWrap.Clamp: return this.gl.CLAMP_TO_EDGE;
            case RenderStateTextureWrap.Repeat: return this.gl.REPEAT;
            case RenderStateTextureWrap.MirrorRepeat: return this.gl.MIRRORED_REPEAT;
            default: {
                const n: never = wrap;
                return n;
            }
        }
    }

    public get_TextureFilter(filter: RenderStateTextureMinFilter | RenderStateTextureMagFilter): number {
        switch (filter) {
            case RenderStateTextureMinFilter.Linear:
            case RenderStateTextureMagFilter.Linear: return this.gl.LINEAR;
            case RenderStateTextureMinFilter.Nearest:
            case RenderStateTextureMagFilter.Nearest: return this.gl.NEAREST;
            case RenderStateTextureMinFilter.NearestMipmapNearest: return this.gl.NEAREST_MIPMAP_NEAREST;
            case RenderStateTextureMinFilter.NearestMipmapLinear: return this.gl.NEAREST_MIPMAP_LINEAR;
            case RenderStateTextureMinFilter.LinearMipmapNearest: return this.gl.LINEAR_MIPMAP_NEAREST;
            case RenderStateTextureMinFilter.LinearMipmapLinear: return this.gl.LINEAR_MIPMAP_LINEAR;
            default: {
                const n: never = filter;
                return n;
            }
        }
    }

    public get_TextureFormatType(internal_format: RenderStateTextureFormat): [internal_format: number, format: number, data_type: number] {
        switch (internal_format) {
            case RenderStateTextureFormat.RGBA8: return [this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE];
            case RenderStateTextureFormat.RGBA32F: return [this.gl.RGBA32F, this.gl.RGBA, this.gl.FLOAT];
            case RenderStateTextureFormat.R32UI: return [this.gl.R32UI, this.gl.RED_INTEGER, this.gl.UNSIGNED_INT];
            case RenderStateTextureFormat.D32F: return [this.gl.DEPTH_COMPONENT32F, this.gl.DEPTH_COMPONENT, this.gl.FLOAT];
            case RenderStateTextureFormat.D32FS8: return [this.gl.DEPTH32F_STENCIL8, this.gl.DEPTH_STENCIL, this.gl.FLOAT_32_UNSIGNED_INT_24_8_REV];
            default: {
                const n: never = internal_format;
                return n;
            }
        }
    }

    // #endregion 

    // Shader

    public create_Shader(type: RenderStateShaderType, source: string):
        Result<WebGL2RenderStateShader, Error> {
        const gl = this.gl;
        const shader = gl.createShader(this.get_ShaderType(type));
        if (shader === null) return Result.Error(new Error('<WebGL2RenderState> create_Shader: failed to create render state shader'));
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return Result.Ok(new WebGL2RenderStateShader(this.render_state, shader, type));
        }
        const res: Result<WebGL2RenderStateShader, Error> = Result.Error(new Error(`<WebGL2RenderState> create_Shader: failed to create render state shader:\n${gl.getShaderInfoLog(shader) ?? 'unknown error'}\nin ${source}`));
        gl.deleteShader(shader);
        return res;
    }

    public delete_Shader(shader: WebGL2RenderStateShader): void {
        this.gl.deleteShader(shader.shader);
        console.log("delete shader", shader.id);
    }

    public create_Program(vert_shader: WebGL2RenderStateShader, frag_shader: WebGL2RenderStateShader):
        Result<WebGL2RenderStateProgram, Error> {
        const gl = this.gl;
        const program = gl.createProgram();
        if (program === null) return Result.Error(new Error('<WebGL2RenderState> create_Program: failed to create render state program'));
        gl.attachShader(program, vert_shader.shader);
        gl.attachShader(program, frag_shader.shader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return Result.Ok(new WebGL2RenderStateProgram(this.render_state, program, vert_shader, frag_shader));
        }
        const res: Result<WebGL2RenderStateProgram, Error> = Result.Error(new Error(`<WebGL2RenderState> create_Program: failed to create render state program:\n${gl.getProgramInfoLog(program) ?? 'unknown error'}`));
        gl.deleteProgram(program);
        return res;
    }

    public delete_Program(program: WebGL2RenderStateProgram): void {
        this.gl.deleteProgram(program.program);
        console.log("delete program", program.id);
    }

    public get_ProgramAttributeLocation(program: WebGL2RenderStateProgram, attribute: string) {
        return this.gl.getAttribLocation(program.program, attribute);
    }

    public get_ProgramUniformLocation(program: WebGL2RenderStateProgram, uniform: string) {
        return this.gl.getUniformLocation(program.program, uniform);
    }

    public get_ProgramUniformBlockLocation(program: WebGL2RenderStateProgram, uniform: string) {
        return this.gl.getUniformBlockIndex(program.program, uniform);
    }

    public get_ProgramUniformBlockSize(program: WebGL2RenderStateProgram, uniform_location: number) {
        return this.gl.getActiveUniformBlockParameter(program.program, uniform_location, this.gl.UNIFORM_BLOCK_DATA_SIZE);
    }

    public get_ProgramUniformBlockMemberIndexOffsets(program: WebGL2RenderStateProgram, members: string[]): null | { [name: string]: { index: number, offset: number } } {
        const gl = this.gl;
        const indices = gl.getUniformIndices(program.program, members);
        if (indices === null) return null;
        const offsets = gl.getActiveUniforms(program.program, indices, gl.UNIFORM_OFFSET);
        const result: { [name: string]: { index: number, offset: number } } = {};
        const indexes = [...indices];
        for (let i = 0; i < members.length; i++) {
            result[members[i]] = { index: indexes[i], offset: offsets[i] };
        }
        return result;
    }

    public bind_UniformBuffer(buffer: WebGL2RenderStateBuffer, index: number) {
        this.bind_BufferProxy(this.gl.UNIFORM_BUFFER, buffer.buffer);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, index, buffer.buffer);
    }

    // Buffer

    public create_Buffer(type: RenderStateBufferType, usage: RenderStateBufferUsage, data_size: number, data_type: RenderStateDataType, data_normalize: boolean, divisor: number):
        Result<WebGL2RenderStateBuffer, Error> {
        const buffer = this.gl.createBuffer();
        if (buffer === null) return Result.Error(new Error('<WebGL2RenderState> create_Buffer: failed to create render state buffer'));
        return Result.Ok(new WebGL2RenderStateBuffer(this.render_state, buffer, this.get_BufferType(type), this.get_BufferUsage(usage), data_size, this.get_DataType(data_type), data_normalize, 0, 0, divisor));
    }

    public alloc_Buffer(buffer: WebGL2RenderStateBuffer, size: number, data?: ArrayBufferView): void {
        this.bind_BufferProxy(buffer.type, buffer.buffer);
        if (data === undefined) {
            this.gl.bufferData(buffer.type, size, buffer.usage);
        }
        else {
            this.gl.bufferData(buffer.type, data, buffer.usage);
        }
    }

    public update_Buffer(buffer: WebGL2RenderStateBuffer, data: ArrayBufferView, offset: number = 0, src_offset?: number, length?: number) {
        this.bind_BufferProxy(buffer.type, buffer.buffer);
        if (src_offset === undefined) {
            this.gl.bufferSubData(buffer.type, offset, data);
        }
        else {
            this.gl.bufferSubData(buffer.type, offset, data, src_offset, length)
        }
    }

    public delete_Buffer(buffer: WebGL2RenderStateBuffer): void {
        this.gl.deleteBuffer(buffer.buffer);
        console.log("delete buffer", buffer.id);
    }

    public create_BufferView(buffer: WebGL2RenderStateBuffer, data_size: number, data_stride: number, data_offset: number, divisor: number):
        Result<WebGL2RenderStateBufferView, Error> {
        return Result.Ok(new WebGL2RenderStateBufferView(this.render_state, buffer, data_size, data_stride, data_offset, divisor));
    }

    // Vertex Array

    public create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number, instance_count: number = 0):
        Result<WebGL2RenderStateVertexArray, Error> {
        const vertex_array = this.gl.createVertexArray();
        if (vertex_array === null) return Result.Error(new Error('<WebGL2RenderState> create_VertexArray: failed to create render state vertex array'));
        return Result.Ok(new WebGL2RenderStateVertexArray(this.render_state, vertex_array, this.get_PrimitiveType(primitive_type), offset, count, instance_count));
    }

    public delete_VertexArray(vertex_array: WebGL2RenderStateVertexArray): void {
        this.gl.deleteVertexArray(vertex_array.vertex_array);
        console.log("delete vertex array", vertex_array.id);
    }

    public set_VertexArrayInstanceCount(vertex_array: WebGL2RenderStateVertexArray, instance_count: number = 1) {
        const c = Math.floor(Math.max(0, instance_count));
        vertex_array.instance_count = c;
    }

    public create_VertexArrayView(vertex_array: WebGL2RenderStateVertexArray, offset: number, count: number, instance_count: number = 1):
        Result<WebGL2RenderStateVertexArrayView, Error> {
        return Result.Ok(new WebGL2RenderStateVertexArrayView(this.render_state, vertex_array, offset, count, instance_count));
    }

    public toggle_VertexArrayAttribute(vertex_array: WebGL2RenderStateVertexArray, attribute_location: number, enable: boolean): void {
        const gl = this.gl;
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (enable) gl.enableVertexAttribArray(attribute_location);
        else gl.disableVertexAttribArray(attribute_location);
    }

    public set_VertexArrayAttributeBuffer(vertex_array: WebGL2RenderStateVertexArray, attribute_location: number, buffer: WebGL2RenderStateBuffer | WebGL2RenderStateBufferView): void {
        const gl = this.gl;
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        const { type, data_size, data_type, data_stride, data_normalize, data_offset, divisor } = buffer;
        this.bind_BufferProxy(type, buffer.buffer);
        gl.vertexAttribPointer(attribute_location, data_size, data_type, data_normalize, data_stride, data_offset);
        gl.vertexAttribDivisor(attribute_location, divisor);
    }

    public set_VertexArrayIndexBuffer(vertex_array: WebGL2RenderStateVertexArray, buffer: WebGL2RenderStateBuffer | WebGL2RenderStateBufferView): void {
        if (buffer.type !== this.gl.ELEMENT_ARRAY_BUFFER) return;
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        const binded = this.bind_BufferProxy(this.gl.ELEMENT_ARRAY_BUFFER, buffer.buffer);
        if (!binded) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer.buffer);
        }
    }

    // Texture

    public create_Texture(type: RenderStateTextureType, format: RenderStateTextureFormat, wrap_s: RenderStateTextureWrap = RenderStateTextureWrap.Clamp, wrap_t: RenderStateTextureWrap = RenderStateTextureWrap.Clamp, min_filter: RenderStateTextureMinFilter = RenderStateTextureMinFilter.Linear, mag_filter: RenderStateTextureMagFilter = RenderStateTextureMagFilter.Linear): Result<WebGL2RenderStateTexture, Error> {
        const texture = this.gl.createTexture();
        if (texture === null) return Result.Error(new Error('<WebGL2RenderState> create_Texture: failed to create render state texture'));
        const [internal_format, texel_format, data_type] = this.get_TextureFormatType(format);
        return Result.Ok(new WebGL2RenderStateTexture(this.render_state, texture, this.get_TextureType(type), internal_format, texel_format, data_type, this.get_TextureWrap(wrap_s), this.get_TextureWrap(wrap_t), this.get_TextureFilter(min_filter), this.get_TextureFilter(mag_filter)));
    }

    public delete_Texture(texture: WebGL2RenderStateTexture): void {
        this.gl.deleteTexture(texture.texture);
        console.log("delete texture", texture.id);
    }

    public set_TextureParameters(texture: WebGL2RenderStateTexture, wrap_s?: RenderStateTextureWrap | undefined, wrap_t?: RenderStateTextureWrap | undefined, min_filter?: RenderStateTextureMinFilter | undefined, mag_filter?: RenderStateTextureMagFilter | undefined): void {
        const gl = this.gl;
        const { type, texture: tex } = texture;
        this.bind_TextureProxy(type, tex);
        if (wrap_s) gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.get_TextureWrap(wrap_s));
        if (wrap_t) gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.get_TextureWrap(wrap_t));
        if (min_filter) gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.get_TextureFilter(min_filter));
        if (mag_filter) gl.texParameteri(type, gl.TEXTURE_WRAP_S, this.get_TextureFilter(mag_filter));
    }

    public alloc_Texture(texture: WebGL2RenderStateTexture, width: number, height: number, level: number, data?: ArrayBufferView): void {
        const {
            format: internal_format,
            texel_format: format,
            data_type, type,
            wrap_s, wrap_t, min_filter, mag_filter
        } = texture;
        this.bind_TextureProxy(type, texture.texture);
        const gl = this.gl;
        if (type === this.gl.TEXTURE_2D) {
            gl.texImage2D(type, level, internal_format, width, height, 0, format, data_type, data ?? null);
            texture.width = width;
            texture.height = height;
        }
        gl.texParameteri(type, gl.TEXTURE_WRAP_S, wrap_s);
        gl.texParameteri(type, gl.TEXTURE_WRAP_T, wrap_t);
        gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, min_filter);
        gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, mag_filter);
    }

    public update_Texture(texture: WebGL2RenderStateTexture, level: number, data: ArrayBufferView, width: number, height: number, offset_x: number = 0, offset_y: number = 0, src_offset?: number) {
        const { texel_format: format, data_type, type } = texture;
        this.bind_TextureProxy(type, texture.texture);
        if (type === this.gl.TEXTURE_2D) {
            if (src_offset !== undefined) {
                this.gl.texSubImage2D(type, level, offset_x, offset_y, width, height, format, data_type, data, src_offset);
            }
            else {
                this.gl.texSubImage2D(type, level, offset_x, offset_y, width, height, format, data_type, data);
            }
        }
    }

    public generate_Mipmap(texture: WebGL2RenderStateTexture) {
        this.bind_TextureProxy(texture.type, texture.texture);
        this.gl.generateMipmap(texture.type);
    }

    public active_Texture(texture: WebGL2RenderStateTexture, slot: number) {
        const target_point = WebGL2RenderState.TextureSlotBase + slot;
        if (texture.active_slot === target_point) return;
        this.gl.activeTexture(this.gl.TEXTURE0 + target_point);
        const binded = this.bind_TextureProxy(texture.type, texture.texture);
        if (!binded) {
            this.gl.bindTexture(texture.type, texture.texture);
        }
        this.gl.activeTexture(this.gl.TEXTURE0);
        texture.active_slot = target_point;
    }

    public get_TextureSlot(texture: WebGL2RenderStateTexture | undefined) {
        if (texture === undefined) return WebGL2RenderState.TextureSlotBase;
        if (texture.active_slot !== undefined) {
            return texture.active_slot;
        }
        // find
        const last_slot = this.active_texture_slot_pointer;
        let current_slot = last_slot;
        while (true) {
            const texture_slot = this.active_texture_slots[current_slot];
            if (texture_slot === undefined || texture_slot.value === undefined) {
                // find blank
                break;
            }
            current_slot = (current_slot + 1) % this.user_texture_slot_count;
            // looped around
            if (current_slot === last_slot) break;
        }
        const texture_slot = this.active_texture_slots[current_slot];
        if (texture_slot === undefined || texture_slot.value === undefined) {
            this.active_texture_slots[current_slot] = new WeakRef(texture);
            this.active_Texture(texture, WebGL2RenderState.TextureSlotPreserved + current_slot);
        }
        else {
            const old_texture = texture_slot.value;
            old_texture.active_slot = undefined;
            this.active_texture_slots[current_slot] = new WeakRef(texture);
            this.active_Texture(texture, WebGL2RenderState.TextureSlotPreserved + current_slot);
        }
        this.active_texture_slot_pointer = (current_slot + 1) % this.user_texture_slot_count;
        return texture.active_slot!;
    }

    // Texture Sampler

    public create_TextureSampler(wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter): Result<WebGL2RenderStateTextureSampler, Error> {
        const sampler = this.gl.createSampler();
        if (sampler === null) return Result.Error(new Error('<WebGL2RenderState> create_TextureSampler: failed to create render state texture sampler'));
        return Result.Ok(new WebGL2RenderStateTextureSampler(this.render_state, sampler, this.get_TextureWrap(wrap_s), this.get_TextureWrap(wrap_t), this.get_TextureFilter(min_filter), this.get_TextureFilter(mag_filter)));
    }

    public set_TextureSamplerParameters(sampler: WebGL2RenderStateTextureSampler, wrap_s?: RenderStateTextureWrap | undefined, wrap_t?: RenderStateTextureWrap | undefined, min_filter?: RenderStateTextureMinFilter | undefined, mag_filter?: RenderStateTextureMagFilter | undefined): void {
        const gl = this.gl;
        const s = sampler.sampler;
        if (wrap_s) gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, this.get_TextureWrap(wrap_s));
        if (wrap_t) gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, this.get_TextureWrap(wrap_t));
        if (min_filter) gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, this.get_TextureFilter(min_filter));
        if (mag_filter) gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, this.get_TextureFilter(mag_filter));
    }

    public delete_TextureSampler(sampler: WebGL2RenderStateTextureSampler): void {
        this.gl.deleteTexture(sampler.sampler);
        console.log("delete texture sampler", sampler.id);
    }

    // Frame Buffer

    public create_FrameBuffer(): Result<WebGL2RenderStateFrameBuffer, Error> {
        const frame_buffer = this.gl.createFramebuffer();
        if (frame_buffer === null) return Result.Error(new Error('<WebGL2RenderState> create_TextureSampler: failed to create render state frame buffer'));
        return Result.Ok(new WebGL2RenderStateFrameBuffer(this.render_state, frame_buffer));
    }

    public set_FrameBufferAttachment(frame_buffer: WebGL2RenderStateFrameBuffer, target: number, attachment: FrameBufferAttachment<WebGL2RenderState> | undefined): void {
        const gl = this.gl;
        if (frame_buffer.has_Attachment(target)) {
            if (attachment === undefined) {
                // remove
                this.bind_FrameBufferProxy(gl.FRAMEBUFFER, frame_buffer.frame_buffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, target, gl.TEXTURE_2D, null, 0);
            }
            else {
                // reset
                this.bind_FrameBufferProxy(gl.FRAMEBUFFER, frame_buffer.frame_buffer);
                if (attachment instanceof WebGL2RenderStateTexture) {
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, target, gl.TEXTURE_2D, attachment.texture, 0);
                }
                else {
                    // render buffer
                }
            }
            frame_buffer.set_Attachment(target, attachment);
        }
        else if (attachment !== undefined) {
            // new
            if (attachment instanceof WebGL2RenderStateTexture) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, target, gl.TEXTURE_2D, attachment.texture, 0);
            }
            else {
                // render buffer
            }
            frame_buffer.set_Attachment(target, attachment);
        }
    }

    public delete_FrameBuffer(frame_buffer: WebGL2RenderStateFrameBuffer): void {
        this.gl.deleteFramebuffer(frame_buffer.frame_buffer);
        console.log("delete frame buffer", frame_buffer.id);
    }

    // Uniform

    public set_ProgramUniform<Val extends RenderStateValueType>(program: WebGL2RenderStateProgram, uniform_location: WebGLUniformLocation, uniform_type: Val, data: RenderStateValueTypeKey<WebGL2RenderState, Val>): void {
        this.use_ProgramProxy(program.program);
        switch (uniform_type) {
            case RenderStateValueType.Int: {
                this.gl.uniform1i(uniform_location, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Int>));
                return;
            }
            case RenderStateValueType.Float: {
                this.gl.uniform1f(uniform_location, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Int>));
                return;
            }
            case RenderStateValueType.Vec2: {
                this.gl.uniform2fv(uniform_location, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Vec2>).typed_array_f32);
                return;
            }
            case RenderStateValueType.Vec3: {
                this.gl.uniform3fv(uniform_location, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Vec3>).typed_array_f32);
                return;
            }
            case RenderStateValueType.Vec4: {
                this.gl.uniform4fv(uniform_location, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Vec4>).typed_array_f32);
                return;
            }
            case RenderStateValueType.Mat3: {
                this.gl.uniformMatrix3fv(uniform_location, true, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Mat3>).typed_array_f32);
                return;
            }
            case RenderStateValueType.Mat4: {
                this.gl.uniformMatrix4fv(uniform_location, true, (data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Mat4>).typed_array_f32);
                return;
            }
            case RenderStateValueType.Tex2D: {
                const texture = data as RenderStateValueTypeKey<WebGL2RenderState, RenderStateValueType.Tex2D> as (WebGL2RenderStateTexture | undefined);
                const slot = this.get_TextureSlot(texture);
                // console.log("use texture slot", slot);
                this.gl.uniform1i(uniform_location, slot);
                return;
            }
            default: {
                const n: never = uniform_type;
                return n;
            }
        }
    }

    public set_ProgramUniformBuffer(program: WebGL2RenderStateProgram, uniform_location: number, index: number) {
        this.gl.uniformBlockBinding(program.program, uniform_location, index);
    }

    // Render

    public use_FrameBuffer(frame_buffer: WebGL2RenderStateFrameBuffer | undefined) {
        if (frame_buffer === undefined) this.bind_FrameBufferProxy(this.gl.FRAMEBUFFER, null);
        else this.bind_FrameBufferProxy(this.gl.FRAMEBUFFER, frame_buffer.frame_buffer);
    }

    public draw_Arrays(program: WebGL2RenderStateProgram, vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView): void {
        this.use_ProgramProxy(program.program);
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (vertex_array.instance_count <= 0) {
            this.gl.drawArrays(vertex_array.primitive_type, vertex_array.offset, vertex_array.count);
        }
        else {
            this.gl.drawArraysInstanced(vertex_array.primitive_type, vertex_array.offset, vertex_array.count, vertex_array.instance_count);
        }
    }

    public draw_Elements(program: WebGL2RenderStateProgram, vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, index_data_type: RenderStateDataType): void {
        this.use_ProgramProxy(program.program);
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (vertex_array.instance_count <= 0) {
            this.gl.drawElements(vertex_array.primitive_type, vertex_array.count, this.get_DataType(index_data_type), vertex_array.offset);
        }
        else {
            this.gl.drawElementsInstanced(vertex_array.primitive_type, vertex_array.count, this.get_DataType(index_data_type), vertex_array.offset, vertex_array.instance_count);
        }
    }
}