import { Result } from "@/system/utils/Result";
import type { RenderDevice } from "../RenderDevice";
import { RenderState, RenderStateBufferType, RenderStateBufferUsage, RenderStateDataType, RenderStatePrimitiveType, RenderStateShaderType, RenderStateUniformType, RenderStateTextureWrap, RenderStateTextureMinFilter, RenderStateTextureMagFilter, RenderStateTextureFormat, RenderStateTextureType, type RenderStateUniformSlotTypeMap, type RenderStateInitOption as RenderStateInitOption, RenderStateTextureDataFormat, RenderStateFrameBufferPart } from "../RenderState";
import { WebGL2RenderStateBuffer, WebGL2RenderStateBufferView } from "./webgl2_render_state_objects/WebGL2RenderStateBuffer";
import { WebGL2RenderStateShader } from "./webgl2_render_state_objects/WebGL2RenderStateShader";
import { WebGL2RenderStateProgram } from "./webgl2_render_state_objects/WebGL2RenderStateProgram";
import { WebGL2RenderStateVertexArray, WebGL2RenderStateVertexArrayView } from "./webgl2_render_state_objects/WebGL2RenderStateVertexArray";
import { WebGL2RenderStateSampledTexture, WebGL2RenderStateTexture, WebGL2RenderStateTextureSampler } from "./webgl2_render_state_objects/WebGL2RenderStateTexture";
import { WeakRef } from "@/system/utils/RefCounted";
import { WebGL2RenderStateFrameBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateFrameBuffer";
import { type FrameBufferAttachment } from "../render_state_objects/RenderStateFrameBuffer";
import type { WebGL2RenderStateTextureUniformSlot } from "./webgl2_render_state_objects/WebGL2RenderStateUniformSlot";
import { WebGL2RenderStateRenderBuffer } from "./webgl2_render_state_objects/WebGL2RenderStateRenderBuffer";

export interface WebGL2RenderStateInitOption extends RenderStateInitOption {
    preserve_texture_count: number,
    texture_slot_base?: number,
    default_texture_slot?: number,
    enabled_oes_float_linear_texture?: boolean,
    enabled_ext_float_color_buffer?: boolean,
    canvas_antialias?: boolean,
    canvas_preserve_drawing_buffer?: boolean,
}

export enum WebGL2RenderStateFrameBufferAttachmentPoint {
    Color0, Color1, Color2, Color3,
    Color4, Color5, Color6, Color7,
    Color8, Color9, Color10, Color11,
    Color12, Color13, Color14, Color15,
    Depth, DepthStencil,
}

export class WebGL2RenderState extends RenderState<WebGL2RenderState> {
    public readonly gl: WebGL2RenderingContext;

    private readonly texture_slot_base: number;
    private readonly default_texture_slot: number;
    private readonly texture_slot_preserved: number;
    public readonly max_texture_slot: number;
    public readonly user_texture_slot_count: number;
    private readonly active_sampled_texture_slots: (WeakRef<WebGL2RenderStateSampledTexture> | undefined)[];
    private active_sampled_texture_slot_pointer: number = 0;

    // #region state proxy

    // buffer
    private buffer_state: (WebGLBuffer | null)[] = [null, null, null, null, null, null, null, null];
    public bind_BufferProxy(target: number, buffer: WebGLBuffer | null, protect_vertex_array: boolean = true) {
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
            if (protect_vertex_array && buffer_state_index === 1) {
                // index buffer
                this.bind_VertexArrayProxy(null);
            }
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

    // active texture uint
    private active_texture_slot: number | null = null;
    public active_TextureSlotProxy(slot: number) {
        if (this.active_texture_slot !== slot) {
            this.active_texture_slot = slot;
            this.gl.activeTexture(slot);
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

    // render buffer
    private render_buffer_state: WebGLRenderbuffer | null = null;
    public bind_RenderBufferProxy(render_buffer: WebGLRenderbuffer | null) {
        if (this.render_buffer_state !== render_buffer) {
            this.render_buffer_state = render_buffer;
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, render_buffer);
            return true;
        }
        return false;
    }

    // frame  buffer
    private frame_buffer_state: (WebGLFramebuffer | null)[] = [null, null, null];
    public bind_FrameBufferProxy(target: number, frame_buffer: WebGLFramebuffer | null) {
        let frame_buffer_state_index = 0;
        switch (target) {
            case this.gl.FRAMEBUFFER: /*         */ frame_buffer_state_index = 0; break;
            case this.gl.READ_FRAMEBUFFER: /*    */ frame_buffer_state_index = 1; break;
            case this.gl.DRAW_FRAMEBUFFER: /*    */ frame_buffer_state_index = 2; break;
            default: throw new Error('<WebGL2RenderState> bind_FrameBufferProxy: bind target point is invalid');
        }
        if (this.frame_buffer_state[frame_buffer_state_index] !== frame_buffer) {
            this.frame_buffer_state[frame_buffer_state_index] = frame_buffer;
            if (frame_buffer_state_index === 0) {
                this.frame_buffer_state[1] = frame_buffer;
                this.frame_buffer_state[2] = frame_buffer;
            }
            this.gl.bindFramebuffer(target, frame_buffer);
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

    private depth_mask_state: boolean | null = null;
    public set_DepthMaskProxy(flag: boolean) {
        if (this.depth_mask_state !== flag) {
            this.depth_mask_state = flag;
            this.gl.depthMask(flag);
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
        const [_x, _y, _w, _h] = this.scissor_state;
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

    private pixel_store_pack_alignment: number = 4;
    public set_PixelStorePackAlignment(value: 1 | 2 | 4 | 8) {
        if (this.pixel_store_pack_alignment !== value) {
            this.pixel_store_pack_alignment = value;
            this.gl.pixelStorei(this.gl.PACK_ALIGNMENT, value);
            return true;
        }
        return false;
    }

    private pixel_store_unpack_alignment: number = 4;
    public set_PixelStoreUnpackAlignment(value: 1 | 2 | 4 | 8) {
        if (this.pixel_store_unpack_alignment !== value) {
            this.pixel_store_unpack_alignment = value;
            this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, value);
            return true;
        }
        return false;
    }

    private pixel_store_y_flip: boolean = false;
    public set_PixelStoreYFlip(value: boolean) {
        if (this.pixel_store_y_flip !== value) {
            this.pixel_store_y_flip = value;
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, value);
            return true;
        }
        return false;
    }

    private pixel_store_premult_alpha: boolean = false;
    public set_PixelStorePremultAlpha(value: boolean) {
        if (this.pixel_store_premult_alpha !== value) {
            this.pixel_store_premult_alpha = value;
            this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, value);
            return true;
        }
        return false;
    }

    private pixel_store_colorspace_conversion: boolean = true;
    public set_PixelStoreColorspaceConversion(value: boolean) {
        if (this.pixel_store_colorspace_conversion !== value) {
            this.pixel_store_colorspace_conversion = value;
            this.gl.pixelStorei(this.gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, value ? this.gl.BROWSER_DEFAULT_WEBGL : this.gl.NONE);
            return true;
        }
        return false;
    }

    // #endregion

    constructor(render_device: RenderDevice<WebGL2RenderState>, option: WebGL2RenderStateInitOption) {
        super(render_device, option);

        const {
            preserve_texture_count,
            texture_slot_base = 1,
            default_texture_slot = 0,
            enabled_ext_float_color_buffer = true,
            enabled_oes_float_linear_texture = true,
            canvas_antialias = false,
            canvas_preserve_drawing_buffer = false,
        } = option;

        const gl = this.render_device.canvas.getContext('webgl2', { antialias: canvas_antialias, preserveDrawingBuffer: canvas_preserve_drawing_buffer }) as WebGL2RenderingContext | null;

        if (gl === null) throw new Error('<WebGL2RenderState> constructor: failed to get webgl2 context');
        this.gl = gl as WebGL2RenderingContext;

        if (enabled_ext_float_color_buffer) {
            const color_buffer_float_ext = gl.getExtension('EXT_color_buffer_float');
            if (color_buffer_float_ext === null) throw new Error('<WebGL2RenderState> constructor: failed to get webgl2 color buffer float extension');
        }

        if (enabled_oes_float_linear_texture) {
            const texture_float_linear_ext = gl.getExtension('OES_texture_float_linear');
            if (texture_float_linear_ext === null) throw new Error('<WebGL2RenderState> constructor: failed to get webgl2 texture float extension');
        }

        this.default_texture_slot = default_texture_slot;
        this.texture_slot_base = texture_slot_base;
        this.max_texture_slot = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.texture_slot_preserved = Math.max(0, this.texture_slot_base, preserve_texture_count);
        this.user_texture_slot_count = this.max_texture_slot - this.texture_slot_preserved;
        if (this.user_texture_slot_count <= 0) throw new Error('<WebGL2RenderState> constructor: texture unit not enough');
        this.active_sampled_texture_slots = new Array(this.user_texture_slot_count);
    }

    // #region enum

    public get_PrimitiveType(primitive_type: RenderStatePrimitiveType): number {
        switch (primitive_type) {
            case RenderStatePrimitiveType.Triangles: return this.gl.TRIANGLES;
            case RenderStatePrimitiveType.TriangleStrip: return this.gl.TRIANGLE_STRIP;
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
            case RenderStateBufferUsage.StreamCopy: return this.gl.STREAM_COPY;
            case RenderStateBufferUsage.StreamDraw: return this.gl.STREAM_DRAW;
            case RenderStateBufferUsage.StreamRead: return this.gl.STREAM_READ;
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

    public get_TextureFormatType(internal_format: RenderStateTextureFormat): [internal_format: number, data_type: number] {
        switch (internal_format) {
            case RenderStateTextureFormat.SRGBA8: return [this.gl.SRGB8_ALPHA8, this.gl.UNSIGNED_BYTE];
            case RenderStateTextureFormat.SRGB8: return [this.gl.SRGB8, this.gl.UNSIGNED_BYTE];
            case RenderStateTextureFormat.RGB8: return [this.gl.RGB8, this.gl.UNSIGNED_BYTE];
            case RenderStateTextureFormat.RGBA8: return [this.gl.RGBA8, this.gl.UNSIGNED_BYTE];
            case RenderStateTextureFormat.RGB32F: return [this.gl.RGB32F, this.gl.FLOAT];
            case RenderStateTextureFormat.RGBA32F: return [this.gl.RGBA32F, this.gl.FLOAT];
            case RenderStateTextureFormat.R32UI: return [this.gl.R32UI, this.gl.UNSIGNED_INT];
            case RenderStateTextureFormat.R32F: return [this.gl.R32F, this.gl.FLOAT];
            case RenderStateTextureFormat.D24: return [this.gl.DEPTH_COMPONENT24, this.gl.UNSIGNED_INT];
            case RenderStateTextureFormat.D32F: return [this.gl.DEPTH_COMPONENT32F, this.gl.FLOAT];
            case RenderStateTextureFormat.D32FS8: return [this.gl.DEPTH32F_STENCIL8, this.gl.FLOAT_32_UNSIGNED_INT_24_8_REV];
            default: {
                const n: never = internal_format;
                return n;
            }
        }
    }

    public get_TextureDataFormatType(format: RenderStateTextureDataFormat): number {
        switch (format) {
            case RenderStateTextureDataFormat.RGB: return this.gl.RGB;
            case RenderStateTextureDataFormat.RGBA: return this.gl.RGBA;
            case RenderStateTextureDataFormat.RInt: return this.gl.RED_INTEGER;
            case RenderStateTextureDataFormat.Red: return this.gl.RED;
            case RenderStateTextureDataFormat.Alpha: return this.gl.ALPHA;
            case RenderStateTextureDataFormat.Luminance: return this.gl.LUMINANCE;
            case RenderStateTextureDataFormat.LuminanceAlpha: return this.gl.LUMINANCE_ALPHA;
            case RenderStateTextureDataFormat.Depth: return this.gl.DEPTH_COMPONENT;
            case RenderStateTextureDataFormat.DepthStencil: return this.gl.DEPTH_STENCIL;
            default: {
                const n: never = format;
                return n;
            }
        }
    }

    public get_FrameBufferAttachmentPoint(target: WebGL2RenderStateFrameBufferAttachmentPoint) {
        switch (target) {
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color0: return this.gl.COLOR_ATTACHMENT0;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color1: return this.gl.COLOR_ATTACHMENT1;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color2: return this.gl.COLOR_ATTACHMENT2;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color3: return this.gl.COLOR_ATTACHMENT3;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color4: return this.gl.COLOR_ATTACHMENT4;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color5: return this.gl.COLOR_ATTACHMENT5;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color6: return this.gl.COLOR_ATTACHMENT6;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color7: return this.gl.COLOR_ATTACHMENT7;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color8: return this.gl.COLOR_ATTACHMENT8;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color9: return this.gl.COLOR_ATTACHMENT9;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color10: return this.gl.COLOR_ATTACHMENT10;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color11: return this.gl.COLOR_ATTACHMENT11;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color12: return this.gl.COLOR_ATTACHMENT12;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color13: return this.gl.COLOR_ATTACHMENT13;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color14: return this.gl.COLOR_ATTACHMENT14;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Color15: return this.gl.COLOR_ATTACHMENT15;
            case WebGL2RenderStateFrameBufferAttachmentPoint.Depth: return this.gl.DEPTH_ATTACHMENT;
            case WebGL2RenderStateFrameBufferAttachmentPoint.DepthStencil: return this.gl.DEPTH_STENCIL_ATTACHMENT;
            default: {
                const n: never = target;
                return n;
            }
        }
    }

    public get_FrameBufferPartBits(target: RenderStateFrameBufferPart) {
        let result = 0;
        if (target & RenderStateFrameBufferPart.Color) result |= this.gl.COLOR_BUFFER_BIT;
        if (target & RenderStateFrameBufferPart.Depth) result |= this.gl.DEPTH_BUFFER_BIT;
        if (target & RenderStateFrameBufferPart.Stencil) result |= this.gl.STENCIL_BUFFER_BIT;
        return result;
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
        const lined_source = source.split('\n').map((s, line) => `${(line + 1).toString().padStart(4, ' ')} |  ${s}`).join('\n');
        const res: Result<WebGL2RenderStateShader, Error> = Result.Error(new Error(`<WebGL2RenderState> create_Shader: failed to create render state shader:\n${gl.getShaderInfoLog(shader) ?? 'unknown error'}in:\n${lined_source}\n`));
        gl.deleteShader(shader);
        return res;
    }

    public delete_Shader(shader: WebGL2RenderStateShader): void {
        this.gl.deleteShader(shader.shader);
        console.log("delete shader", shader.id);
    }

    public create_Program(vert_shader: WebGL2RenderStateShader, frag_shader: WebGL2RenderStateShader, vert_attributes_locations?: { [key: string]: number }):
        Result<WebGL2RenderStateProgram, Error> {
        const gl = this.gl;
        const program = gl.createProgram();
        if (program === null) return Result.Error(new Error('<WebGL2RenderState> create_Program: failed to create render state program'));
        gl.attachShader(program, vert_shader.shader);
        gl.attachShader(program, frag_shader.shader);
        if (vert_attributes_locations !== undefined) {
            for (const [attribute, location] of Object.entries(vert_attributes_locations)) {
                gl.bindAttribLocation(program, location, attribute);
            }
        }
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

    public alloc_Buffer(buffer: WebGL2RenderStateBuffer, byte_count: number, data?: ArrayBufferView): void {
        this.bind_BufferProxy(buffer.type, buffer.buffer);
        if (data === undefined) {
            this.gl.bufferData(buffer.type, byte_count, buffer.usage);
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

    public create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number):
        Result<WebGL2RenderStateVertexArray, Error> {
        const vertex_array = this.gl.createVertexArray();
        if (vertex_array === null) return Result.Error(new Error('<WebGL2RenderState> create_VertexArray: failed to create render state vertex array'));
        return Result.Ok(new WebGL2RenderStateVertexArray(this.render_state, vertex_array, this.get_PrimitiveType(primitive_type), offset, count));
    }

    public delete_VertexArray(vertex_array: WebGL2RenderStateVertexArray): void {
        this.gl.deleteVertexArray(vertex_array.vertex_array);
        console.log("delete vertex array", vertex_array.id);
    }

    public create_VertexArrayView(vertex_array: WebGL2RenderStateVertexArray, offset: number, count: number):
        Result<WebGL2RenderStateVertexArrayView, Error> {
        return Result.Ok(new WebGL2RenderStateVertexArrayView(this.render_state, vertex_array, offset, count));
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
        if (!this.bind_BufferProxy(this.gl.ELEMENT_ARRAY_BUFFER, buffer.buffer, false)) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer.buffer);
        }
    }

    // Texture

    public create_Texture(type: RenderStateTextureType, constant: boolean, format: RenderStateTextureFormat, levels: number, wrap_s: RenderStateTextureWrap = RenderStateTextureWrap.Clamp, wrap_t: RenderStateTextureWrap = RenderStateTextureWrap.Clamp, wrap_r: RenderStateTextureWrap = RenderStateTextureWrap.Clamp, min_filter: RenderStateTextureMinFilter = RenderStateTextureMinFilter.Linear, mag_filter: RenderStateTextureMagFilter = RenderStateTextureMagFilter.Linear): Result<WebGL2RenderStateTexture, Error> {
        const texture = this.gl.createTexture();
        if (texture === null) return Result.Error(new Error('<WebGL2RenderState> create_Texture: failed to create render state texture'));
        const [internal_format, data_type] = this.get_TextureFormatType(format);
        return Result.Ok(new WebGL2RenderStateTexture(this.render_state, texture, this.get_TextureType(type), constant, internal_format, levels, data_type, this.get_TextureWrap(wrap_s), this.get_TextureWrap(wrap_t), this.get_TextureWrap(wrap_r), this.get_TextureFilter(min_filter), this.get_TextureFilter(mag_filter)));
    }

    public delete_Texture(texture: WebGL2RenderStateTexture): void {
        this.gl.deleteTexture(texture.texture);
        console.log("delete texture", texture.id);
    }

    public set_TextureFormat(texture: WebGL2RenderStateTexture, format: RenderStateTextureFormat) {
        if (texture.constant) return;
        const [internal_format, data_type] = this.get_TextureFormatType(format);
        texture.format = internal_format;
        texture.data_type = data_type;
    }

    public set_TextureLevels(texture: WebGL2RenderStateTexture, levels: number) {
        if (texture.constant) return;
        texture.levels = levels;
    }

    public set_TextureParameters(texture: WebGL2RenderStateTexture, wrap_s?: RenderStateTextureWrap | undefined, wrap_t?: RenderStateTextureWrap | undefined, wrap_r?: RenderStateTextureWrap | undefined, min_filter?: RenderStateTextureMinFilter | undefined, mag_filter?: RenderStateTextureMagFilter | undefined): void {
        const gl = this.gl;
        const { type, texture: tex } = texture;
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        this.bind_TextureProxy(type, tex);
        if (wrap_s) {
            texture.wrap_s = this.get_TextureWrap(wrap_s);
            gl.texParameteri(type, gl.TEXTURE_WRAP_S, texture.wrap_s);
        }
        if (wrap_t) {
            texture.wrap_t = this.get_TextureWrap(wrap_t);
            gl.texParameteri(type, gl.TEXTURE_WRAP_T, texture.wrap_t);
        }
        if (wrap_r) {
            texture.wrap_r = this.get_TextureWrap(wrap_r);
            gl.texParameteri(type, gl.TEXTURE_WRAP_R, texture.wrap_r);
        }
        if (min_filter) {
            texture.min_filter = this.get_TextureFilter(min_filter);
            gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, texture.min_filter);
        }
        if (mag_filter) {
            texture.mag_filter = this.get_TextureFilter(mag_filter);
            gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, texture.mag_filter);
        }
    }

    public set_TextureDepthParameter(texture: WebGL2RenderStateTexture) {
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        if (!this.bind_TextureProxy(texture.type, texture.texture)) {
            this.gl.bindTexture(texture.type, texture.texture);
        }
        this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_COMPARE_MODE,
            this.gl.COMPARE_REF_TO_TEXTURE,
        );
    }

    // 2D

    public alloc_Texture2D(texture: WebGL2RenderStateTexture, width: number, height: number, level: number, format: RenderStateTextureDataFormat, data?: ArrayBufferView): void {
        const {
            type, constant, format: internal_format, levels, data_type,
            wrap_s, wrap_t, wrap_r, min_filter, mag_filter
        } = texture;
        if (type !== this.gl.TEXTURE_2D) return;
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        if (!this.bind_TextureProxy(type, texture.texture)) {
            this.gl.bindTexture(type, texture.texture);
        }
        const gl = this.gl;
        if (constant) {
            gl.texStorage2D(type, levels, internal_format, width, height);
            if (data !== undefined) {
                this.update_Texture2D(texture, level, format, data, width, height);
            }
        }
        else {
            gl.texImage2D(type, level, internal_format, width, height, 0, this.get_TextureDataFormatType(format), data_type, data ?? null);
        }
        texture.width = width;
        texture.height = height;
        this.set_TextureParameters(texture, wrap_s, wrap_t, wrap_r, min_filter, mag_filter);
    }

    public update_Texture2D(texture: WebGL2RenderStateTexture, level: number, format: RenderStateTextureDataFormat, data: ArrayBufferView, width: number, height: number, offset_x: number = 0, offset_y: number = 0, src_offset?: number) {
        const { data_type, type } = texture;
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        if (!this.bind_TextureProxy(type, texture.texture)) {
            this.gl.bindTexture(type, texture.texture);
        }
        if (type === this.gl.TEXTURE_2D) {
            if (src_offset !== undefined) {
                this.gl.texSubImage2D(type, level, offset_x, offset_y, width, height, this.get_TextureDataFormatType(format), data_type, data, src_offset);
            }
            else {
                this.gl.texSubImage2D(type, level, offset_x, offset_y, width, height, this.get_TextureDataFormatType(format), data_type, data);
            }
        }
    }

    // 3D

    public alloc_Texture3D(texture: WebGL2RenderStateTexture, width: number, height: number, depth: number, level: number, format: RenderStateTextureDataFormat, data?: ArrayBufferView): void {
        const {
            type, constant, format: internal_format, levels, data_type,
            wrap_s, wrap_t, wrap_r, min_filter, mag_filter
        } = texture;
        const gl = this.gl;
        if (type !== gl.TEXTURE_3D && type !== gl.TEXTURE_2D_ARRAY) return;
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        if (!this.bind_TextureProxy(type, texture.texture)) {
            this.gl.bindTexture(type, texture.texture);
        }
        if (constant) {
            gl.texStorage3D(type, levels, internal_format, width, height, depth);
            if (data !== undefined) {
                this.update_Texture3D(texture, level, format, data, width, height, depth);
            }
        }
        else {
            gl.texImage3D(type, level, internal_format, width, height, depth, 0, this.get_TextureDataFormatType(format), data_type, data ?? null);
        }
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        this.set_TextureParameters(texture, wrap_s, wrap_t, wrap_r, min_filter, mag_filter);
    }

    public update_Texture3D(texture: WebGL2RenderStateTexture, level: number, format: RenderStateTextureDataFormat, data: ArrayBufferView, width: number, height: number, depth: number, offset_x: number = 0, offset_y: number = 0, offset_z: number = 0, src_offset?: number) {
        const { data_type, type } = texture;
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        if (!this.bind_TextureProxy(type, texture.texture)) {
            this.gl.bindTexture(type, texture.texture);
        }
        const gl = this.gl;
        if (type === gl.TEXTURE_3D || type === gl.TEXTURE_2D_ARRAY) {
            // disable FLIP_Y and PREMULTIPLY_ALPHA
            this.set_PixelStorePremultAlpha(false);
            this.set_PixelStoreYFlip(false);
            if (src_offset !== undefined) {
                this.gl.texSubImage3D(type, level, offset_x, offset_y, offset_z, width, height, depth, this.get_TextureDataFormatType(format), data_type, data, src_offset);
            }
            else {
                this.gl.texSubImage3D(type, level, offset_x, offset_y, offset_z, width, height, depth, this.get_TextureDataFormatType(format), data_type, data);
            }
        }
    }

    // Cube Map

    // end setting texture

    public generate_Mipmap(texture: WebGL2RenderStateTexture) {
        this.active_TextureSlotProxy(this.gl.TEXTURE0);
        this.bind_TextureProxy(texture.type, texture.texture);
        this.gl.generateMipmap(texture.type);
    }

    public active_Texture(texture: WebGL2RenderStateTexture, slot: number) {
        const target_point = slot;
        this.active_TextureSlotProxy(this.gl.TEXTURE0 + target_point);
        if (!this.bind_TextureProxy(texture.type, texture.texture)) {
            this.gl.bindTexture(texture.type, texture.texture);
        }
    }

    public deactive_Texture(type: RenderStateTextureType, slot: number) {
        const target_point = slot;
        const _type = this.get_TextureType(type);
        this.active_TextureSlotProxy(this.gl.TEXTURE0 + target_point);
        if (!this.bind_TextureProxy(_type, null)) {
            this.gl.bindTexture(_type, null);
        }
    }

    public create_SampledTexture(texture: WebGL2RenderStateTexture | undefined, sampler: WebGL2RenderStateTextureSampler | undefined) {
        return new WebGL2RenderStateSampledTexture(this, texture, sampler);
    }

    public get_SampledTextureSlot(sampled_texture: WebGL2RenderStateSampledTexture) {
        const { texture, sampler } = sampled_texture;

        if (texture === undefined) {
            sampled_texture.slot = this.default_texture_slot;
            return this.default_texture_slot;
        }
        if (sampled_texture.slot !== undefined) {
            return sampled_texture.slot;
        }

        // find
        const last_slot = this.active_sampled_texture_slot_pointer;
        let current_slot = last_slot;

        while (true) {
            const texture_slot = this.active_sampled_texture_slots[current_slot];
            if (texture_slot === undefined || texture_slot.value === undefined) {
                // find blank
                break;
            }
            current_slot = (current_slot + 1) % this.user_texture_slot_count;
            // looped around
            if (current_slot === last_slot) break;
        }

        const texture_slot = this.active_sampled_texture_slots[current_slot];

        if (texture_slot === undefined || texture_slot.value === undefined) {
            this.active_sampled_texture_slots[current_slot] = new WeakRef(sampled_texture);
            const slot = this.texture_slot_preserved + current_slot;
            sampled_texture.slot = slot;
            this.active_Texture(texture, slot);
            this.set_TextureSlotSampler(slot, sampler);
        }
        else {
            // looped arround, clear all used texture
            for (let i = 0; i < this.user_texture_slot_count; i++) {
                const tex = this.active_sampled_texture_slots[i]!.value!;
                tex.slot = undefined;
                this.active_sampled_texture_slots[i] = undefined;
            }
            current_slot = 0;
            this.active_sampled_texture_slots[current_slot] = new WeakRef(sampled_texture);
            const slot = this.texture_slot_preserved + current_slot;
            sampled_texture.slot = slot;
            this.active_Texture(texture, slot);
            this.set_TextureSlotSampler(slot, sampler);
        }

        this.active_sampled_texture_slot_pointer = (current_slot + 1) % this.user_texture_slot_count;

        return sampled_texture.slot!;
    }

    public set_TextureSlotSampler(slot: number, sampler: WebGL2RenderStateTextureSampler | undefined) {
        const target_point = slot;
        this.gl.bindSampler(target_point, sampler?.sampler ?? null);
    }

    // Texture Sampler

    public create_TextureSampler(wrap_s: RenderStateTextureWrap, wrap_t: RenderStateTextureWrap, wrap_r: RenderStateTextureWrap, min_filter: RenderStateTextureMinFilter, mag_filter: RenderStateTextureMagFilter): Result<WebGL2RenderStateTextureSampler, Error> {
        const sampler = this.gl.createSampler();
        if (sampler === null) return Result.Error(new Error('<WebGL2RenderState> create_TextureSampler: failed to create render state texture sampler'));
        const gl = this.gl;
        const _wrap_s = this.get_TextureWrap(wrap_s);
        gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, _wrap_s);
        const _wrap_t = this.get_TextureWrap(wrap_t);
        gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, _wrap_t);
        const _wrap_r = this.get_TextureWrap(wrap_r);
        gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, _wrap_r);
        const _min_filter = this.get_TextureFilter(min_filter);
        gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, _min_filter);
        const _mag_filter = this.get_TextureFilter(mag_filter);
        gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, _mag_filter);
        return Result.Ok(new WebGL2RenderStateTextureSampler(this.render_state, sampler, _wrap_s, _wrap_t, _wrap_r, _min_filter, _mag_filter));
    }

    public set_TextureSamplerParameters(sampler: WebGL2RenderStateTextureSampler, wrap_s?: RenderStateTextureWrap | undefined, wrap_t?: RenderStateTextureWrap | undefined, wrap_r?: RenderStateTextureWrap | undefined, min_filter?: RenderStateTextureMinFilter | undefined, mag_filter?: RenderStateTextureMagFilter | undefined): void {
        const gl = this.gl;
        const s = sampler.sampler;
        if (wrap_s) {
            sampler.wrap_s = this.get_TextureWrap(wrap_s);
            gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, sampler.wrap_s);
        }
        if (wrap_t) {
            sampler.wrap_t = this.get_TextureWrap(wrap_t);
            gl.samplerParameteri(s, gl.TEXTURE_WRAP_T, sampler.wrap_t);
        }
        if (wrap_r) {
            sampler.wrap_r = this.get_TextureWrap(wrap_r);
            gl.samplerParameteri(s, gl.TEXTURE_WRAP_R, sampler.wrap_r);
        }
        if (min_filter) {
            sampler.min_filter = this.get_TextureFilter(min_filter);
            gl.samplerParameteri(s, gl.TEXTURE_MIN_FILTER, sampler.min_filter);
        }
        if (mag_filter) {
            sampler.mag_filter = this.get_TextureFilter(mag_filter);
            gl.samplerParameteri(s, gl.TEXTURE_MAG_FILTER, sampler.mag_filter);
        }
    }

    public delete_TextureSampler(sampler: WebGL2RenderStateTextureSampler): void {
        this.gl.deleteSampler(sampler.sampler);
        console.log("delete texture sampler", sampler.id);
    }

    // Render Buffer

    public create_RenderBuffer(format: RenderStateTextureFormat, samples: number): Result<WebGL2RenderStateRenderBuffer, Error> {
        const render_buffer = this.gl.createRenderbuffer();
        if (render_buffer === null) return Result.Error(new Error('<WebGL2RenderState> create_RenderBuffer: failed to create render state render buffer'));
        return Result.Ok(new WebGL2RenderStateRenderBuffer(this.render_state, render_buffer, this.get_TextureFormatType(format)[0], Math.min(samples, this.gl.getParameter(this.gl.MAX_SAMPLES))));
    }

    public alloc_RenderBuffer(render_buffer: WebGL2RenderStateRenderBuffer, width: number, height: number): void {
        this.bind_RenderBufferProxy(render_buffer.render_buffer);
        const gl = this.gl;
        const { format: internal_format, samples } = render_buffer;
        if (samples > 1) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, internal_format, width, height);
        }
        else {
            gl.renderbufferStorage(gl.RENDERBUFFER, internal_format, width, height);
        }
        render_buffer.width = width;
        render_buffer.height = height;
    }

    public delete_RenderBuffer(render_buffer: WebGL2RenderStateRenderBuffer): void {
        this.gl.deleteRenderbuffer(render_buffer.render_buffer);
        console.log("delete render buffer", render_buffer.id);
    }

    // Frame Buffer

    public create_FrameBuffer(): Result<WebGL2RenderStateFrameBuffer, Error> {
        const frame_buffer = this.gl.createFramebuffer();
        if (frame_buffer === null) return Result.Error(new Error('<WebGL2RenderState> create_TextureSampler: failed to create render state frame buffer'));
        return Result.Ok(new WebGL2RenderStateFrameBuffer(this.render_state, frame_buffer));
    }

    public set_FrameBufferAttachment(frame_buffer: WebGL2RenderStateFrameBuffer, target: WebGL2RenderStateFrameBufferAttachmentPoint, attachment: FrameBufferAttachment<WebGL2RenderState> | undefined, level: number = 0, layer?: number): void {
        const gl = this.gl;
        const point = this.get_FrameBufferAttachmentPoint(target);
        if (attachment === undefined) {
            // remove
            this.bind_FrameBufferProxy(gl.FRAMEBUFFER, frame_buffer.frame_buffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, point, gl.TEXTURE_2D, null, 0);
        }
        else {
            // reset
            this.bind_FrameBufferProxy(gl.FRAMEBUFFER, frame_buffer.frame_buffer);
            if (attachment instanceof WebGL2RenderStateTexture) {
                switch (attachment.type) {
                    case gl.TEXTURE_2D: {
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, point, gl.TEXTURE_2D, attachment.texture, 0);
                        break;
                    }
                    case gl.TEXTURE_2D_ARRAY: {
                        if (layer === undefined) throw new Error('<WebGLRenderState> set_FrameBufferAttachment: missing layer when attaching texture 2d array to frame buffer');
                        gl.framebufferTextureLayer(gl.FRAMEBUFFER, point, attachment.texture, level, layer);
                        break;
                    }
                    default: {
                        throw new Error('<WebGLRenderState> set_FrameBufferAttachment: unknown texture type when attaching to frame buffer');
                    }
                }
            }
            else if (attachment instanceof WebGL2RenderStateRenderBuffer) {
                // render buffer
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, point, gl.RENDERBUFFER, attachment.render_buffer);
            }
            else {
                throw new Error('<WebGLRenderState> set_FrameBufferAttachment: unknown attachment type for frame buffer');
            }
        }
        frame_buffer.set_Attachment(point, attachment);
    }

    public blit_FrameBuffer(src: WebGL2RenderStateFrameBuffer, dst: WebGL2RenderStateFrameBuffer,
        parts: RenderStateFrameBufferPart, filter: RenderStateTextureMagFilter,
        src_x: number, src_y: number, src_w: number, src_h: number,
        dst_x?: number, dst_y?: number, dst_w?: number, dst_h?: number
    ): void {
        const gl = this.gl;
        const src_x1 = src_x + src_w;
        const src_y1 = src_y + src_h;
        if (dst_x === undefined) dst_x = src_x;
        if (dst_y === undefined) dst_y = src_y;
        if (dst_w === undefined) dst_w = src_w;
        if (dst_h === undefined) dst_h = src_h;
        const dst_x1 = dst_x + dst_w;
        const dst_y1 = dst_y + dst_h;
        this.bind_FrameBufferProxy(gl.READ_FRAMEBUFFER, src.frame_buffer);
        this.bind_FrameBufferProxy(gl.DRAW_FRAMEBUFFER, dst.frame_buffer);
        gl.blitFramebuffer(src_x, src_y, src_x1, src_y1, dst_x, dst_y, dst_x1, dst_y1, this.get_FrameBufferPartBits(parts), this.get_TextureFilter(filter));
    }

    public enable_FrameBuffer(frame_buffer: WebGL2RenderStateFrameBuffer) {
        const gl = this.gl;
        this.bind_FrameBufferProxy(gl.FRAMEBUFFER, frame_buffer.frame_buffer);
        const used_attachement_points = frame_buffer.attachement_points.filter(ap => ap !== gl.DEPTH_ATTACHMENT && ap !== gl.DEPTH_STENCIL_ATTACHMENT);
        gl.drawBuffers(used_attachement_points);
    }

    public delete_FrameBuffer(frame_buffer: WebGL2RenderStateFrameBuffer): void {
        this.gl.deleteFramebuffer(frame_buffer.frame_buffer);
        console.log("delete frame buffer", frame_buffer.id);
    }

    // Uniform
    static readonly #matrix3_array: number[] = new Array(9);
    static readonly #matrix4_array: number[] = new Array(16);
    public set_ProgramUniform<Val extends RenderStateUniformType>(program: WebGL2RenderStateProgram, uniform_location: WebGLUniformLocation, uniform_type: Val, data: RenderStateUniformSlotTypeMap<WebGL2RenderState, Val>): void {
        this.use_ProgramProxy(program.program);
        switch (uniform_type) {
            case RenderStateUniformType.Uint: {
                this.gl.uniform1ui(uniform_location, (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Uint>).result);
                return;
            }
            case RenderStateUniformType.Int: {
                this.gl.uniform1i(uniform_location, (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Int>).result);
                return;
            }
            case RenderStateUniformType.Float: {
                this.gl.uniform1f(uniform_location, (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Int>).result);
                return;
            }
            case RenderStateUniformType.Vec2: {
                const vec2 = (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Vec2>).result;
                this.gl.uniform2f(uniform_location, vec2.x, vec2.y);
                return;
            }
            case RenderStateUniformType.Vec3: {
                const vec3 = (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Vec3>).result;
                this.gl.uniform3f(uniform_location, vec3.x, vec3.y, vec3.z);
                return;
            }
            case RenderStateUniformType.Vec4: {
                const vec4 = (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Vec4>).result;
                this.gl.uniform4f(uniform_location, vec4.x, vec4.y, vec4.z, vec4.w);
                return;
            }
            case RenderStateUniformType.Mat3: {
                const mat3 = (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Mat3>).result;
                WebGL2RenderState.#matrix3_array[0] = mat3.n11;
                WebGL2RenderState.#matrix3_array[1] = mat3.n12;
                WebGL2RenderState.#matrix3_array[2] = mat3.n13;
                WebGL2RenderState.#matrix3_array[3] = mat3.n21;
                WebGL2RenderState.#matrix3_array[4] = mat3.n22;
                WebGL2RenderState.#matrix3_array[5] = mat3.n23;
                WebGL2RenderState.#matrix3_array[6] = mat3.n31;
                WebGL2RenderState.#matrix3_array[7] = mat3.n32;
                WebGL2RenderState.#matrix3_array[8] = mat3.n33;
                this.gl.uniformMatrix3fv(uniform_location, true, WebGL2RenderState.#matrix3_array);
                return;
            }
            case RenderStateUniformType.Mat4: {
                const mat4 = (data as RenderStateUniformSlotTypeMap<WebGL2RenderState, RenderStateUniformType.Mat4>).result;
                WebGL2RenderState.#matrix4_array[0] = mat4.n11;
                WebGL2RenderState.#matrix4_array[1] = mat4.n12;
                WebGL2RenderState.#matrix4_array[2] = mat4.n13;
                WebGL2RenderState.#matrix4_array[3] = mat4.n14;
                WebGL2RenderState.#matrix4_array[4] = mat4.n21;
                WebGL2RenderState.#matrix4_array[5] = mat4.n22;
                WebGL2RenderState.#matrix4_array[6] = mat4.n23;
                WebGL2RenderState.#matrix4_array[7] = mat4.n24;
                WebGL2RenderState.#matrix4_array[8] = mat4.n31;
                WebGL2RenderState.#matrix4_array[9] = mat4.n32;
                WebGL2RenderState.#matrix4_array[10] = mat4.n33;
                WebGL2RenderState.#matrix4_array[11] = mat4.n34;
                WebGL2RenderState.#matrix4_array[12] = mat4.n41;
                WebGL2RenderState.#matrix4_array[13] = mat4.n42;
                WebGL2RenderState.#matrix4_array[14] = mat4.n43;
                WebGL2RenderState.#matrix4_array[15] = mat4.n44;
                this.gl.uniformMatrix4fv(uniform_location, true, WebGL2RenderState.#matrix4_array);
                return;
            }
            case RenderStateUniformType.Tex2D:
            case RenderStateUniformType.Tex3D:
            case RenderStateUniformType.Tex2DArray: {
                const uniform = data as WebGL2RenderStateTextureUniformSlot;
                const sampled_texture = uniform.sampled_texture;
                const slot = this.get_SampledTextureSlot(sampled_texture);
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

    public clear_FrameBuffer(frame_buffer: WebGL2RenderStateFrameBuffer | undefined, mask: RenderStateFrameBufferPart) {
        this.use_FrameBuffer(frame_buffer);
        this.gl.clear(this.get_FrameBufferPartBits(mask));
    }

    public draw_Arrays(program: WebGL2RenderStateProgram, vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, instance_count: number): void {
        if (instance_count <= 0) return;
        this.use_ProgramProxy(program.program);
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (instance_count <= 1) {
            this.gl.drawArrays(vertex_array.primitive_type, vertex_array.offset, vertex_array.count);
        }
        else {
            this.gl.drawArraysInstanced(vertex_array.primitive_type, vertex_array.offset, vertex_array.count, instance_count);
        }
    }

    public draw_Elements(program: WebGL2RenderStateProgram, vertex_array: WebGL2RenderStateVertexArray | WebGL2RenderStateVertexArrayView, index_data_type: RenderStateDataType, instance_count: number): void {
        if (instance_count <= 0) return;
        this.use_ProgramProxy(program.program);
        this.bind_VertexArrayProxy(vertex_array.vertex_array);
        if (instance_count <= 1) {
            this.gl.drawElements(vertex_array.primitive_type, vertex_array.count, this.get_DataType(index_data_type), vertex_array.offset);
        }
        else {
            this.gl.drawElementsInstanced(vertex_array.primitive_type, vertex_array.count, this.get_DataType(index_data_type), vertex_array.offset, instance_count);
        }
    }
}