import { Result } from "../utils/Result";
import { Buffer, BufferView } from "./Buffer";
import { VertexArray } from "./VertexArray";
import { Shader, ShaderProgram, ShaderType } from "./Shader";
import { AttributeUniformType, Attributes, Uniforms } from "./AttributesUniforms";
import { Texture, type TextureSourceType } from "./Texture";
import { ImageLoader } from "../engine/loaders/ImageLoader";

export class RenderingDevice {
    public readonly canvas: HTMLCanvasElement;
    public readonly state: RenderState;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.state = new RenderState(this);
    }
}

class RenderState {
    public static readonly StartTextureSlot = 8;
    public static readonly MaxTextureSlot = 20;

    private readonly rd: RenderingDevice;
    public readonly gl: WebGL2RenderingContext;

    public readonly instances = {
        shaders: new Set(),
        shader_programs: new Set(),
        buffers: new Set(),
        vertex_arrays: new Set(),
        textures: new Set(),
        frame_buffers: new Set(),
    }

    public get canvas() { return this.gl.canvas; }

    constructor(rd: RenderingDevice) {
        this.rd = rd;
        const _gl = this.rd.canvas.getContext('webgl2');
        if (_gl === null) throw new Error('failed to get webgl2 context');
        this.gl = _gl;
    }

    public set_Size(width: number, height: number) {
        const w = Math.max(0, Math.floor(width));
        const h = Math.max(0, Math.floor(height));
        if (w <= 0 || h <= 0) return;
    }

    // shader

    public create_Shader(type: ShaderType, source: string): Shader {
        return new Shader(this.rd, type, source);
    }

    public compile_Shader(shader: Shader): Result<Shader, Error> {
        if (shader.compiled) return Result.Ok(shader);
        const { type, source } = shader;
        const gl = this.gl;
        // create shader
        const glshader = gl.createShader(type === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        if (glshader === null) return Result.Error(new Error('failed to create shader'));
        gl.shaderSource(glshader, source);
        gl.compileShader(glshader);
        const success = gl.getShaderParameter(glshader, gl.COMPILE_STATUS);
        if (success) {
            shader.shader = glshader;
            this.instances.shaders.add(shader);
            return Result.Ok(shader);
        }
        // failed
        const res: Result<Shader, Error> = Result.Error(new Error(`failed to create shader:\n${gl.getShaderInfoLog(glshader) ?? 'unknown error'}\nin ${source}`));
        gl.deleteShader(glshader);
        return res;
    }

    public free_Shader(shader: Shader) {
        if (shader.compiled) {
            this.gl.deleteShader(shader.shader!);
            shader.shader = undefined;
            this.instances.shaders.delete(shader);
        }
    }

    // shader program

    public create_ShaderProgram(vertex_shader: Shader, fragment_shader: Shader, attributes: Attributes, uniforms: Uniforms, cull_back_face: boolean, depth_test: boolean) {
        return new ShaderProgram(this.rd, vertex_shader, fragment_shader, attributes, uniforms, cull_back_face, depth_test);
    }

    public compile_ShaderProgram(program: ShaderProgram): Result<ShaderProgram, Error> {
        if (program.compiled) return Result.Ok(program);
        const { vertex_shader, fragment_shader } = program;
        const gl = this.gl;
        // create program
        const glprogram = gl.createProgram();
        if (glprogram === null) return Result.Error(new Error('failed to create shader program'));
        const vert_result = this.compile_Shader(vertex_shader.value!);
        if (vert_result.failed) return Result.Error(vert_result.error!);
        const frag_result = this.compile_Shader(fragment_shader.value!);
        if (frag_result.failed) return Result.Error(frag_result.error!);
        gl.attachShader(glprogram, vertex_shader.value!.shader!);
        gl.attachShader(glprogram, fragment_shader.value!.shader!);
        gl.linkProgram(glprogram);
        const success = gl.getProgramParameter(glprogram, gl.LINK_STATUS);
        if (success) {
            program.program = glprogram;
            program.attributes.clear_Locations();
            program.uniforms.clear_Locations();
            // set attrs
            for (const attr of program.attributes.names) {
                program.attributes.set_Location(attr, gl.getAttribLocation(glprogram, attr));
            }
            // set uniforms
            for (const uniform of program.uniforms.names) {
                const loc = gl.getUniformLocation(glprogram, uniform);
                if (loc !== null) {
                    program.uniforms.set_Location(uniform, loc);
                }
            }
            this.instances.shader_programs.add(program);
            return Result.Ok(program);
        }
        // failed
        const res: Result<ShaderProgram, Error> = Result.Error(new Error(`failed to create shader program:\n${gl.getProgramInfoLog(glprogram) ?? 'unknown error'}`));
        gl.deleteProgram(glprogram);
        program.attributes.clear_Locations();
        program.uniforms.clear_Locations();
        return res;
    }

    public free_ShaderProgram(program: ShaderProgram) {
        if (program.compiled) {
            this.gl.deleteProgram(program.program!);
            program.program = undefined;
            program.attributes.clear_Locations();
            program.uniforms.clear_Locations();
            this.instances.shader_programs.delete(program);
        }
    }

    // buffer

    public create_Buffer(type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, data: ArrayBufferLike | undefined) {
        const buffer = new Buffer(this.rd, type, usage, data_size, data_type, data_normalize, data);
        return buffer;
    }

    public create_BufferView(buffer: Buffer, data_stride: number = 0, data_offset: number = 0) {
        return new BufferView(this.rd, buffer, data_stride, data_offset);
    }

    public compile_Buffer(buffer: Buffer | BufferView): Result<Buffer | BufferView, Error> {
        if (buffer.compiled) return Result.Ok(buffer);
        const glbuffer = this.gl.createBuffer();
        if (glbuffer === null) return Result.Error(new Error('failed to create buffer'));
        buffer.buffer = glbuffer;
        if (buffer instanceof Buffer && buffer.data !== undefined) {
            this.set_Buffer(buffer, buffer.data);
        }
        if (buffer instanceof BufferView && buffer.buffer_ref.value!.data !== undefined) {
            this.set_Buffer(buffer.buffer_ref.value!, buffer.buffer_ref.value!.data);
        }
        this.instances.buffers.add(buffer);
        return Result.Ok(buffer);
    }

    public set_Buffer(buffer: Buffer | BufferView, data: ArrayBufferLike) {
        const buffer_result = this.compile_Buffer(buffer);
        if (buffer_result.failed) return Result.Error(buffer_result.error!);
        const gl = this.gl;
        gl.bindBuffer(buffer.type, buffer.buffer!);
        gl.bufferData(buffer.type, data, buffer.usage);
    }

    public free_Buffer(buffer: Buffer) {
        if (buffer.compiled) {
            this.gl.deleteBuffer(buffer.buffer!);
            buffer.buffer = undefined;
            this.instances.buffers.delete(buffer);
        }
    }

    // vertex array

    public create_VertexArray(primitive_type: number, offset: number, count: number) {
        return new VertexArray(this.rd, primitive_type, offset, count);
    }

    public compile_VertexArray(vertex_array: VertexArray): Result<VertexArray, Error> {
        if (vertex_array.compiled) return Result.Ok(vertex_array);
        const glvertexarray = this.gl.createVertexArray();
        if (glvertexarray === null) return Result.Error(new Error('failed to create buffer'));
        vertex_array.vertex_array = glvertexarray;
        this.instances.vertex_arrays.add(vertex_array);
        return Result.Ok(vertex_array);
    }

    public set_VertexArrayAttributeBuffer(vertex_array: VertexArray, attribute_location: number, buffer: Buffer | BufferView) {
        if (attribute_location === -1) return Result.Error(new Error('attribute_location is -1'));
        const vertexarray_result = this.compile_VertexArray(vertex_array);
        if (vertexarray_result.failed) return Result.Error(vertexarray_result.error!);
        const buffer_result = this.compile_Buffer(buffer);
        if (buffer_result.failed) return Result.Error(buffer_result.error!);
        const { data_size, data_type, data_stride, data_normalize, data_offset } = buffer;
        const gl = this.gl;
        gl.bindVertexArray(vertex_array.vertex_array!);
        gl.enableVertexAttribArray(attribute_location);
        gl.vertexAttribPointer(attribute_location, data_size, data_type, data_normalize, data_stride, data_offset);
        return Result.Ok(undefined);
    }

    public free_VertexArray(vertex_array: VertexArray) {
        if (buffer.compiled) {
            this.gl.deleteVertexArray(vertex_array.vertex_array!);
            vertex_array.vertex_array = undefined;
            this.instances.vertex_arrays.delete(vertex_array);
        }
    }

    // texture

    public create_Texture(
        levels: (TextureSourceType | undefined)[],
        width: number, height: number,
        internal_format: number = this.gl.RGBA, format: number = this.gl.RGBA, type: number = this.gl.UNSIGNED_BYTE,
        wrap_s: number = this.gl.CLAMP_TO_EDGE, wrap_t: number = this.gl.CLAMP_TO_EDGE, min_filter: number = this.gl.LINEAR, mag_filter: number = this.gl.LINEAR,
        mipmap: boolean = true
    ) {
        return new Texture(this.rd, levels, internal_format, format, type, width, height, wrap_s, wrap_t, min_filter, mag_filter, mipmap);
    }

    public compile_Texture(texture: Texture): Result<Texture, Error> {
        if (texture.compiled) return Result.Ok(texture);
        const gltexture = this.gl.createTexture();
        if (gltexture === null) return Result.Error(new Error('failed to create texture'));
        texture.texture = gltexture;
        for (let i = 0, len = texture.levels.length; i < len; i++) {
            const data = texture.levels[i];
            this.set_Texture(texture, i, texture.internal_format, texture.format, texture.type, data, texture.width, texture.height, texture.mipmap);
        }
        this.instances.textures.add(texture);
        return Result.Ok(texture);
    }

    public set_Texture(texture: Texture, level: number, internal_format: number, format: number, type: number, image: TextureSourceType | undefined, width: number, height: number, mipmap: boolean) {
        const texture_result = this.compile_Texture(texture);
        if (texture_result.failed) return Result.Error(texture_result.error!);
        const gl = this.gl;
        if (image instanceof ImageData || image instanceof HTMLCanvasElement) {
            gl.bindTexture(gl.TEXTURE_2D, texture.texture!);
            gl.texImage2D(gl.TEXTURE_2D, level, internal_format, format, type, image);
        }
        else {
            if (width === undefined || height === undefined) return Result.Error(new Error('can not set texture, missing width and height'));
            gl.bindTexture(gl.TEXTURE_2D, texture.texture!);
            gl.texImage2D(gl.TEXTURE_2D, level, internal_format, width, height, 0, format, type, image ?? null);
        }
        if (mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        return Result.Ok(undefined);
    }

    public set_TextureParameters(texture: Texture, wrap_s?: number, wrap_t?: number, min_filter?: number, mag_filter?: number) {
        const texture_result = this.compile_Texture(texture);
        if (texture_result.failed) return Result.Error(texture_result.error!);
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, texture.texture!);
        if (wrap_s) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_s);
        }
        if (wrap_t) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_t);
        }
        if (min_filter) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filter);
        }
        if (mag_filter) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filter);
        }
        return Result.Ok(undefined);
    }

    public free_Texture(texture: Texture) {
        if (texture.compiled) {
            this.gl.deleteTexture(texture.texture!);
            texture.texture = undefined;
            this.instances.textures.delete(texture);
        }
    }

    // frame buffer

    public create_FrameBuffer() {
        return new FrameBuffer(this.rd);
    }

    public compile_FrameBuffer(framebuffer: FrameBuffer) {
        if (framebuffer.compiled) return Result.Ok(framebuffer);
        const glframebuffer = this.gl.createFramebuffer();
        if (glframebuffer === null) return Result.Error(new Error('failed to create framebuffer'));
        framebuffer.framebuffer = glframebuffer;
        this.instances.frame_buffers.add(framebuffer);
        return Result.Ok(framebuffer);
    }

    public set_FrameBuffer(framebuffer: FrameBuffer, attach: number, texture: Texture, level: number) {
        const framebuffer_result = this.compile_FrameBuffer(framebuffer);
        if (framebuffer_result.failed) return Result.Error(framebuffer_result.error!);
        const texture_result = this.compile_Texture(texture);
        if (texture_result.failed) return Result.Error(texture_result.error!);
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer!);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attach, gl.TEXTURE_2D, texture.texture!, level);
        return Result.Ok(undefined);
    }

    public free_FrameBuffer(framebuffer: FrameBuffer) {
        if (framebuffer.compiled) {
            this.gl.deleteFramebuffer(framebuffer.framebuffer!);
            framebuffer.framebuffer = undefined;
            this.instances.frame_buffers.delete(framebuffer);
        }
    }

    // render

    public set_Uniform(location: WebGLUniformLocation, type: AttributeUniformType, value: number[]) {
        switch (type) {
            case AttributeUniformType.Int: {
                this.gl.uniform1iv(location, value);
                break;
            }
            case AttributeUniformType.Float: {
                this.gl.uniform1fv(location, value);
                break;
            }
            case AttributeUniformType.Vec2: {
                this.gl.uniform2fv(location, value);
                break;
            }
            case AttributeUniformType.Vec3: {
                this.gl.uniform3fv(location, value);
                break;
            }
            case AttributeUniformType.Vec4: {
                this.gl.uniform4fv(location, value);
                break;
            }
            case AttributeUniformType.Mat3: {
                this.gl.uniformMatrix3fv(location, false, value);
                break;
            }
            case AttributeUniformType.Mat4: {
                this.gl.uniformMatrix4fv(location, false, value);
                break;
            }
        }
    }

    public set_Uniforms(program: ShaderProgram, uniforms?: Uniforms) {
        const gl = this.gl;
        let tex_slot = RenderState.StartTextureSlot;
        for (const { name, type, location, value } of program.uniforms) {
            const override_value = uniforms?.get_Value(name);
            const _value = override_value ?? value;
            if (type !== AttributeUniformType.Sample2D) {
                if (_value !== undefined) {
                    this.set_Uniform(location, type, _value as number[]);
                }
            }
            else {
                if (tex_slot >= RenderState.MaxTextureSlot) continue;
                if (_value instanceof Texture) {
                    gl.activeTexture(gl.TEXTURE0 + tex_slot);
                    gl.bindTexture(this.gl.TEXTURE_2D, _value.texture ?? null);
                    gl.uniform1i(location, tex_slot);
                }
                else {
                    gl.activeTexture(gl.TEXTURE0 + tex_slot);
                    gl.bindTexture(this.gl.TEXTURE_2D, null);
                    gl.uniform1i(location, tex_slot);
                }
                tex_slot++;
            }
        }
    }

    public set_Capibilities(program: ShaderProgram) {
        const gl = this.gl;
        // cull back faces
        if (program.cull_back_face) gl.enable(this.gl.CULL_FACE);
        else gl.disable(this.gl.CULL_FACE);
        // depth test
        if (program.depth_test) gl.enable(this.gl.DEPTH_TEST);
        else gl.disable(this.gl.DEPTH_TEST);
    }

    public bind_FrameBuffer(framebuffer: FrameBuffer | undefined = undefined) {
        const gl = this.gl;
        if (framebuffer === undefined || framebuffer.framebuffer === undefined) {
            gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        }
        else {
            gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer.framebuffer);
        }
    }

    public clear_FrameBuffer(mask: number = this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT, clear_color_r: number = 0, clear_color_g: number = 0, clear_color_b: number = 0, clear_color_a: number = 0) {
        this.gl.clearColor(clear_color_r, clear_color_g, clear_color_b, clear_color_a);
        this.gl.clear(mask);
    }

    public set_Viewport(x: number, y: number, width: number, height: number) {
        this.gl.viewport(x, y, width, height);
    }

    public draw_VertexArray(program: ShaderProgram, vertex_array: VertexArray, uniforms?: Uniforms) {
        const gl = this.gl;

        if (program.program !== undefined && vertex_array.vertex_array !== undefined) {
            gl.useProgram(program.program);

            this.set_Capibilities(program);
            this.set_Uniforms(program, uniforms);

            gl.bindVertexArray(vertex_array.vertex_array);
            gl.drawArrays(vertex_array.primitive_type, 0, vertex_array.count);
        }
    }
}


// import testimage from 'res://test-image.png';
// console.log(new ImageLoader().parse(testimage));


import { data1, data2 } from './test.js';


const cvs = document.getElementById('text-canvas') as HTMLCanvasElement;
const rd = new RenderingDevice(cvs);
const vertexShaderSource = `#version 300 es

// 属性是输入(in)顶点着色器的，从缓冲区接收数据
in vec4 a_position;
in vec4 a_color;
in vec2 a_uv;

// 一个用来转换位置的矩阵
uniform mat4 u_matrix;

// a varying the color to the fragment shader
out vec4 v_color;
out vec2 v_uv;

// 所有着色器都有一个 main 函数
void main() {
  // 将位置和矩阵相乘
  gl_Position = u_matrix * a_position;
  v_color = a_color;
  v_uv = a_uv;
}
`;
const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
uniform vec4 u_color;
uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform float u_mix;

in vec4 v_color;
in vec2 v_uv;

// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  if (v_uv.x <= 0.5) {
    outColor = mix(texture(u_texture0, v_uv), v_color, u_mix) * u_color;
  }
  else {
    outColor = mix(texture(u_texture1, v_uv), v_color, u_mix) * u_color;
  }
}
`;
import { FrameBuffer } from "./FrameBuffer";
const texture0 = rd.state.create_Texture([new ImageData(data1, 256, 256)], 256, 256);
const texture1 = rd.state.create_Texture([new ImageData(data2, 130, 130)], 130, 130);
rd.state.compile_Texture(texture0);
rd.state.compile_Texture(texture1);
const vert_shader = rd.state.create_Shader(ShaderType.Vertex, vertexShaderSource);
const frag_shader = rd.state.create_Shader(ShaderType.Fragment, fragmentShaderSource);
const shader_program = rd.state.create_ShaderProgram(
    vert_shader, frag_shader,
    new Attributes().add_Attribute('a_position', AttributeUniformType.Vec4).add_Attribute('a_uv', AttributeUniformType.Vec2).add_Attribute('a_color', AttributeUniformType.Vec4),
    new Uniforms().add_Uniform('u_mix', AttributeUniformType.Float, [0.9])
        .add_Uniform('u_color', AttributeUniformType.Vec4, [0, 1, 0, 0])
        .add_Uniform('u_texture0', AttributeUniformType.Sample2D, texture0)
        .add_Uniform('u_texture1', AttributeUniformType.Sample2D, texture1)
        .add_Uniform('u_matrix', AttributeUniformType.Mat4, new Float32Array([0.0037685475964776838, 0.0009449206565663207, -0.0031694184489966864, 0, 0.0026387654351557603, -0.003413163747081668, 0.0017042432096518146, 0, 0.0021452703641659868, 0.0025384026843990647, 0.0034713602200744193, 0, -0.7715736040609137, 0.3464052287581699, 0, 1])),
    true, true,
);
rd.state.compile_ShaderProgram(shader_program);
const buffer = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 3, rd.state.gl.FLOAT, false, new Float32Array([
    // left column front
    0, 0, 0,
    0, 150, 0,
    30, 0, 0,
    0, 150, 0,
    30, 150, 0,
    30, 0, 0,

    // top rung front
    30, 0, 0,
    30, 30, 0,
    100, 0, 0,
    30, 30, 0,
    100, 30, 0,
    100, 0, 0,

    // middle rung front
    30, 60, 0,
    30, 90, 0,
    67, 60, 0,
    30, 90, 0,
    67, 90, 0,
    67, 60, 0,

    // left column back
    0, 0, 30,
    30, 0, 30,
    0, 150, 30,
    0, 150, 30,
    30, 0, 30,
    30, 150, 30,

    // top rung back
    30, 0, 30,
    100, 0, 30,
    30, 30, 30,
    30, 30, 30,
    100, 0, 30,
    100, 30, 30,

    // middle rung back
    30, 60, 30,
    67, 60, 30,
    30, 90, 30,
    30, 90, 30,
    67, 60, 30,
    67, 90, 30,

    // top
    0, 0, 0,
    100, 0, 0,
    100, 0, 30,
    0, 0, 0,
    100, 0, 30,
    0, 0, 30,

    // top rung right
    100, 0, 0,
    100, 30, 0,
    100, 30, 30,
    100, 0, 0,
    100, 30, 30,
    100, 0, 30,

    // under top rung
    30, 30, 0,
    30, 30, 30,
    100, 30, 30,
    30, 30, 0,
    100, 30, 30,
    100, 30, 0,

    // between top rung and middle
    30, 30, 0,
    30, 60, 30,
    30, 30, 30,
    30, 30, 0,
    30, 60, 0,
    30, 60, 30,

    // top of middle rung
    30, 60, 0,
    67, 60, 30,
    30, 60, 30,
    30, 60, 0,
    67, 60, 0,
    67, 60, 30,

    // right of middle rung
    67, 60, 0,
    67, 90, 30,
    67, 60, 30,
    67, 60, 0,
    67, 90, 0,
    67, 90, 30,

    // bottom of middle rung.
    30, 90, 0,
    30, 90, 30,
    67, 90, 30,
    30, 90, 0,
    67, 90, 30,
    67, 90, 0,

    // right of bottom
    30, 90, 0,
    30, 150, 30,
    30, 90, 30,
    30, 90, 0,
    30, 150, 0,
    30, 150, 30,

    // bottom
    0, 150, 0,
    0, 150, 30,
    30, 150, 30,
    0, 150, 0,
    30, 150, 30,
    30, 150, 0,

    // left side
    0, 0, 0,
    0, 0, 30,
    0, 150, 30,
    0, 0, 0,
    0, 150, 30,
    0, 150, 0,
]));
const uv_buffer = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 2, rd.state.gl.FLOAT, true, new Float32Array([
    // left column front
    38 / 255, 44 / 255,
    38 / 255, 223 / 255,
    113 / 255, 44 / 255,
    38 / 255, 223 / 255,
    113 / 255, 223 / 255,
    113 / 255, 44 / 255,

    // top rung front
    113 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 85 / 255,
    218 / 255, 44 / 255,

    // middle rung front
    113 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 151 / 255,
    203 / 255, 112 / 255,

    // left column back
    38 / 255, 44 / 255,
    113 / 255, 44 / 255,
    38 / 255, 223 / 255,
    38 / 255, 223 / 255,
    113 / 255, 44 / 255,
    113 / 255, 223 / 255,

    // top rung back
    113 / 255, 44 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    218 / 255, 85 / 255,

    // middle rung back
    113 / 255, 112 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    203 / 255, 151 / 255,

    // top
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    1, 1,
    0, 1,

    // top rung right
    0, 0,
    1, 0,
    1, 1,
    0, 0,
    1, 1,
    0, 1,

    // under top rung
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // between top rung and middle
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // top of middle rung
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // right of middle rung
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // bottom of middle rung.
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // right of bottom
    0, 0,
    1, 1,
    0, 1,
    0, 0,
    1, 0,
    1, 1,

    // bottom
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,

    // left side
    0, 0,
    0, 1,
    1, 1,
    0, 0,
    1, 1,
    1, 0,
]));
const color_buffer = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 3, rd.state.gl.UNSIGNED_BYTE, true, new Uint8Array([
    // left column front
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,

    // top rung front
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,

    // middle rung front
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,
    200, 70, 120,

    // left column back
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,

    // top rung back
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,

    // middle rung back
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,
    80, 70, 200,

    // top
    70, 200, 210,
    70, 200, 210,
    70, 200, 210,
    70, 200, 210,
    70, 200, 210,
    70, 200, 210,

    // top rung right
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,
    200, 200, 70,

    // under top rung
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,
    210, 100, 70,

    // between top rung and middle
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,
    210, 160, 70,

    // top of middle rung
    70, 180, 210,
    70, 180, 210,
    70, 180, 210,
    70, 180, 210,
    70, 180, 210,
    70, 180, 210,

    // right of middle rung
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,
    100, 70, 210,

    // bottom of middle rung.
    76, 210, 100,
    76, 210, 100,
    76, 210, 100,
    76, 210, 100,
    76, 210, 100,
    76, 210, 100,

    // right of bottom
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,
    140, 210, 80,

    // bottom
    90, 130, 110,
    90, 130, 110,
    90, 130, 110,
    90, 130, 110,
    90, 130, 110,
    90, 130, 110,

    // left side
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
    160, 160, 220,
]));
const vertex_array = rd.state.create_VertexArray(rd.state.gl.TRIANGLES, 0, buffer.data!.byteLength / Float32Array.BYTES_PER_ELEMENT / 3);
rd.state.set_VertexArrayAttributeBuffer(vertex_array, shader_program.attributes.get_Location('a_position')!, buffer);
rd.state.set_VertexArrayAttributeBuffer(vertex_array, shader_program.attributes.get_Location('a_uv')!, uv_buffer);
rd.state.set_VertexArrayAttributeBuffer(vertex_array, shader_program.attributes.get_Location('a_color')!, color_buffer);

// console.log(texture);

const framebuffer = rd.state.create_FrameBuffer();
const color_frame = rd.state.create_Texture([undefined], 2048, 2048, rd.state.gl.RGBA, rd.state.gl.RGBA, rd.state.gl.UNSIGNED_BYTE, undefined, undefined, rd.state.gl.NEAREST, rd.state.gl.NEAREST);
const depth_frame = rd.state.create_Texture([undefined], 2048, 2048, rd.state.gl.DEPTH_COMPONENT24, rd.state.gl.DEPTH_COMPONENT, rd.state.gl.UNSIGNED_INT, undefined, undefined, rd.state.gl.NEAREST, rd.state.gl.NEAREST, false);
rd.state.set_FrameBuffer(framebuffer, rd.state.gl.COLOR_ATTACHMENT0, color_frame, 0);
rd.state.set_FrameBuffer(framebuffer, rd.state.gl.DEPTH_ATTACHMENT, depth_frame, 0);

color_frame.width = depth_frame.width = 1024 * 2;
color_frame.height = depth_frame.height = 1024 * 2;
rd.state.set_Texture(color_frame, 0, color_frame.internal_format, color_frame.format, color_frame.type, undefined, color_frame.width, color_frame.height, false);
rd.state.set_Texture(depth_frame, 0, depth_frame.internal_format, depth_frame.format, depth_frame.type, undefined, depth_frame.width, depth_frame.height, false);
rd.state.set_TextureParameters(color_frame, color_frame.wrap_s, color_frame.wrap_t, color_frame.min_filter, color_frame.mag_filter);
rd.state.set_TextureParameters(depth_frame, depth_frame.wrap_s, depth_frame.wrap_t, depth_frame.min_filter, depth_frame.mag_filter);

rd.state.bind_FrameBuffer(framebuffer);
rd.state.clear_FrameBuffer();
rd.state.set_Viewport(0, 0, color_frame.width, color_frame.height);
rd.state.draw_VertexArray(shader_program, vertex_array, new Uniforms().add_Uniform('u_color', AttributeUniformType.Vec4, new Float32Array([1, 1, 1, 1])));
rd.state.draw_VertexArray(shader_program, vertex_array, new Uniforms().add_Uniform('u_matrix', AttributeUniformType.Vec4, [0.000058149283975075864, 0.00341993078634373, -0.0031820659747489304, 0, -0.003331370247788233, -0.0012787371333891201, -0.0018539974908720388, 0, 0.0017715908029656267, -0.0025168415640455574, -0.0033818854853742935, 0, 0.588679245283019, -0.3170731707317074, 0.25, 1]).add_Uniform('u_color', AttributeUniformType.Vec4, new Float32Array([1, 1, 1, 1])).add_Uniform('u_mix', AttributeUniformType.Float, [0.0]));

const vertexShaderSourceQuad = `#version 300 es
in vec4 a_position;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  gl_Position = a_position;
  v_uv = a_uv;
}
`;
const fragmentShaderSourceQuad = `#version 300 es
precision highp float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 outColor;
void main() {
  vec4 color = texture(u_texture, v_uv);
  float distance = distance(v_uv, vec2(0.5));
  vec3 greyScale = vec3(.5, .5, .5);
  color = vec4(vec3(dot(color.rgb, greyScale)), color.a);
  outColor = mix( color, vec4(0.0,0.0,0.0,1.0), distance / 2.0);
}
`;
const vert_shader_quad = rd.state.create_Shader(ShaderType.Vertex, vertexShaderSourceQuad);
const frag_shader_quad = rd.state.create_Shader(ShaderType.Fragment, fragmentShaderSourceQuad);
const shader_program_quad = rd.state.create_ShaderProgram(
    vert_shader_quad, frag_shader_quad,
    new Attributes().add_Attribute('a_position', AttributeUniformType.Vec4).add_Attribute('a_uv', AttributeUniformType.Vec2),
    new Uniforms().add_Uniform('u_texture', AttributeUniformType.Sample2D, color_frame),
    true, true,
);
rd.state.compile_ShaderProgram(shader_program_quad);
const buffer_quad = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 3, rd.state.gl.FLOAT, false, new Float32Array([
    -1, 1, 0,
    -1, -1, 0,
    1, 1, 0,

    1, 1, 0,
    -1, -1, 0,
    1, -1, 0,
]));
const uv_buffer_quad = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 2, rd.state.gl.FLOAT, true, new Float32Array([
    0, 1,
    0, 0,
    1, 1,

    1, 1,
    0, 0,
    1, 0,
]));
const vertex_array_quad = rd.state.create_VertexArray(rd.state.gl.TRIANGLES, 0, buffer_quad.data!.byteLength / Float32Array.BYTES_PER_ELEMENT / 3);
rd.state.set_VertexArrayAttributeBuffer(vertex_array_quad, shader_program_quad.attributes.get_Location('a_position')!, buffer_quad);
rd.state.set_VertexArrayAttributeBuffer(vertex_array_quad, shader_program_quad.attributes.get_Location('a_uv')!, uv_buffer_quad);
rd.state.bind_FrameBuffer(undefined);
rd.state.clear_FrameBuffer();
rd.state.set_Viewport(0, 0, 2048, 2048);
rd.state.draw_VertexArray(shader_program_quad, vertex_array_quad);

shader_program.free();
shader_program_quad.free();

console.log(rd.state.instances);

// import url from 'res://f-texture.png';
// console.log(new ImageLoader().parse(url));