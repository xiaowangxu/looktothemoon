import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";
import { Attributes, Uniforms } from "./AttributesUniforms";

export enum ShaderType { Vertex, Fragment }

export class Shader implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly type: ShaderType;
    public readonly source: string;

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

    constructor(rd: RenderingDevice, type: ShaderType, source: string) {
        this.rd = rd;
        this.type = type;
        this.source = source;
    }

    public free() {
        console.log(">>>>> free shader");
        this.rd.state.free_Shader(this);
    }
}

export class ShaderProgram implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly vertex_shader: Ref<Shader> = new Ref();
    public readonly fragment_shader: Ref<Shader> = new Ref();

    public readonly attributes: Attributes;
    public readonly uniforms: Uniforms;

    public cull_back_face: boolean = true;
    public depth_test: boolean = true;

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

    constructor(rd: RenderingDevice, vertex_shader: Shader, fragment_shader: Shader, attributes: Attributes, uniforms: Uniforms, cull_back_face: boolean, depth_test: boolean) {
        this.rd = rd;
        this.vertex_shader.value = vertex_shader;
        this.fragment_shader.value = fragment_shader;
        this.attributes = attributes;
        this.uniforms = uniforms;
        this.cull_back_face = cull_back_face;
        this.depth_test = depth_test;
    }

    public free() {
        console.log(">>>>> free shader program");
        this.vertex_shader.clear();
        this.fragment_shader.clear();
        this.rd.state.free_ShaderProgram(this);
    }
}