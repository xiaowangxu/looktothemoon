import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export enum ShaderType { Vertex, Fragment }

export class Shader implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly type: ShaderType;
    public readonly source: string;
    public readonly attributes: string[];
    public readonly uniforms: string[];

    private _shader: WebGLShader | undefined = undefined;
    public get shader() { return this._shader; }
    public set shader(shader: WebGLShader | undefined) { this._shader = shader; }

    public get compiled() { return this.shader !== undefined; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice, type: ShaderType, source: string, attributes: string[], uniforms: string[]) {
        this.rd = rd;
        this.type = type;
        this.source = source;
        this.attributes = attributes;
        this.uniforms = uniforms;
    }

    public free() { }
}

export class ShaderProgram implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly vertex_shader: Ref<Shader> = new Ref();
    public readonly fragment_shader: Ref<Shader> = new Ref();

    public readonly attribute_locations_map: Map<string, number> = new Map();
    public readonly uniform_locations_map: Map<string, WebGLUniformLocation> = new Map();

    private _program: WebGLProgram | undefined = undefined;
    public get program() { return this._program; }
    public set program(program: WebGLProgram | undefined) { this._program = program; }

    public get compiled() { return this.program !== undefined; }

    private _ref_count: number = 0;
    public ref_count(): number { return this._ref_count; }
    public ref(): void { this._ref_count++; }
    public unref(): void {
        this._ref_count--;
        if (this._ref_count <= 0) {
            this._ref_count = 0;
            this.free();
        }
    }

    constructor(rd: RenderingDevice, vertex_shader: Shader, fragment_shader: Shader) {
        this.rd = rd;
        this.vertex_shader.value = vertex_shader;
        this.fragment_shader.value = fragment_shader;
    }

    public free() { }
}