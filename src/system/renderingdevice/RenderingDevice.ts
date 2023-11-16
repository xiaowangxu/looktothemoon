import { Result } from "../utils/Result";
import { Buffer, BufferView } from "./Buffer";
import { VertexArray } from "./VertexArray";
import { Shader, ShaderProgram, ShaderType } from "./Shader";

export class RenderingDevice {
    public readonly canvas: HTMLCanvasElement;
    public readonly state: RenderState;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.state = new RenderState(this);
    }
}

class RenderState {
    private readonly rd: RenderingDevice;
    public readonly gl: WebGL2RenderingContext;

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

    public create_Shader(type: ShaderType, source: string, attributes: string[], uniform: string[]): Shader {
        return new Shader(this.rd, type, source, attributes, uniform);
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
            return Result.Ok(shader);
        }
        // failed
        const res: Result<Shader, Error> = Result.Error(new Error(`failed to create shader:\n${gl.getShaderInfoLog(glshader) ?? 'unknown error'}`));
        gl.deleteShader(glshader);
        return res;
    }

    public free_Shader(shader: Shader) {
        if (shader.compiled) {
            this.gl.deleteShader(shader.shader!);
            shader.shader = undefined;
        }
    }

    // shader program

    public create_ShaderProgram(vertex_shader: Shader, fragment_shader: Shader) {
        return new ShaderProgram(this.rd, vertex_shader, fragment_shader);
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
            program.attribute_locations_map.clear();
            program.uniform_locations_map.clear();
            // set attrs
            for (const attr of vert_shader.attributes) {
                program.attribute_locations_map.set(attr, gl.getAttribLocation(glprogram, attr));
            }
            for (const attr of frag_shader.attributes) {
                program.attribute_locations_map.set(attr, gl.getAttribLocation(glprogram, attr));
            }
            // set uniforms
            for (const uniform of vert_shader.uniforms) {
                const loc = gl.getUniformLocation(glprogram, uniform);
                if (loc !== null) {
                    program.uniform_locations_map.set(uniform, loc);
                }
            }
            for (const uniform of frag_shader.uniforms) {
                const loc = gl.getUniformLocation(glprogram, uniform);
                if (loc !== null) {
                    program.uniform_locations_map.set(uniform, loc);
                }
            }
            return Result.Ok(program);
        }
        // failed
        const res: Result<ShaderProgram, Error> = Result.Error(new Error(`failed to create shader program:\n${gl.getProgramInfoLog(glprogram) ?? 'unknown error'}`));
        gl.deleteProgram(glprogram);
        program.attribute_locations_map.clear();
        program.uniform_locations_map.clear();
        return res;
    }

    public free_ShaderProgram(program: ShaderProgram) {
        if (program.compiled) {
            this.gl.deleteProgram(program.program!);
            program.program = undefined;
            program.attribute_locations_map.clear();
            program.uniform_locations_map.clear();
        }
    }

    // buffer

    public create_Buffer(type: number, usage: number, data_size: number, data_type: number, data_normalize: boolean, data_stride: number = 0, data_offset: number = 0) {
        const buffer = new Buffer(this.rd, type, usage, data_size, data_type, data_normalize);
        if (data_stride !== 0 || data_offset !== 0) {
            return new BufferView(this.rd, buffer, data_stride, data_offset);
        }
        return buffer;
    }

    public compile_Buffer(buffer: Buffer | BufferView): Result<Buffer | BufferView, Error> {
        if (buffer.compiled) return Result.Ok(buffer);
        const glbuffer = this.gl.createBuffer();
        if (glbuffer === null) return Result.Error(new Error('failed to create buffer'));
        buffer.buffer = glbuffer;
        return Result.Ok(buffer);
    }

    public set_Buffer(buffer: Buffer | BufferView, data: Float32Array) {
        const buffer_result = this.compile_Buffer(buffer);
        if (buffer_result.failed) return Result.Error(buffer_result.error!);
        const gl = this.gl;
        gl.bindBuffer(buffer.type, buffer.buffer!);
        gl.bufferData(buffer.type, data, buffer.usage);
        buffer.data = data;
    }

    public free_Buffer(buffer: Buffer) {
        if (buffer.compiled) {
            this.gl.deleteBuffer(buffer.buffer!);
            buffer.buffer = undefined;
        }
    }

    // vertex array

    public create_VertexArray(primitive_type: number) {
        return new VertexArray(this.rd, primitive_type);
    }

    public compile_VertexArray(array_mesh: VertexArray): Result<VertexArray, Error> {
        if (array_mesh.compiled) return Result.Ok(array_mesh);
        const glvertexarray = this.gl.createVertexArray();
        if (glvertexarray === null) return Result.Error(new Error('failed to create buffer'));
        array_mesh.vertex_array = glvertexarray;
        return Result.Ok(array_mesh);
    }

    public set_VertexArrayAttributeBuffer(array_mesh: VertexArray, attribute_location: number, buffer: Buffer | BufferView) {
        const arraymesh_result = this.compile_VertexArray(array_mesh);
        if (arraymesh_result.failed) return Result.Error(arraymesh_result.error!);
        const buffer_result = this.compile_Buffer(buffer);
        if (buffer_result.failed) return Result.Error(buffer_result.error!);
        const { data_size, data_type, data_stride, data_normalize, data_offset } = buffer;
        const gl = this.gl;
        gl.bindVertexArray(array_mesh.vertex_array!);
        gl.enableVertexAttribArray(attribute_location);
        gl.vertexAttribPointer(attribute_location, data_size, data_type, data_normalize, data_stride, data_offset);
    }

    public render(program: ShaderProgram, array_mesh: VertexArray) {
        this.canvas.width = 2048;
        this.canvas.height = 2048;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (program.program !== undefined && array_mesh.vertex_array !== undefined) {
            this.gl.useProgram(program.program);
            this.gl.uniform4f(program.uniform_locations_map.get('u_color')!, 0, 0, 0, 1);
            this.gl.bindVertexArray(array_mesh.vertex_array);
            const offset = 0;
            const count = 3;
            this.gl.drawArrays(array_mesh.primitive_type, offset, count);
        }
    }
}

const cvs = document.getElementById('text-canvas') as HTMLCanvasElement;
const rd = new RenderingDevice(cvs);
const vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
 
// all shaders have a main function
void main() {
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = a_position;
}
`;
const fragmentShaderSource = `#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
 
uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  // Just set the output to a constant reddish-purple
  outColor = u_color;
}
`;
const vert_shader = rd.state.create_Shader(ShaderType.Vertex, vertexShaderSource, ['a_position'], []);
const frag_shader = rd.state.create_Shader(ShaderType.Fragment, fragmentShaderSource, [], ['u_color']);
const shader_program = rd.state.create_ShaderProgram(vert_shader, frag_shader);
rd.state.compile_ShaderProgram(shader_program);
const buffer = rd.state.create_Buffer(rd.state.gl.ARRAY_BUFFER, rd.state.gl.STATIC_DRAW, 2, rd.state.gl.FLOAT, false);
rd.state.set_Buffer(buffer, new Float32Array([
    0, 0,
    0, 0.5,
    0.7, 0
]));
const array_mesh = rd.state.create_VertexArray(rd.state.gl.TRIANGLES);
rd.state.set_VertexArrayAttributeBuffer(array_mesh, shader_program.attribute_locations_map.get('a_position')!, buffer);

rd.state.render(shader_program, array_mesh);

console.log(array_mesh);