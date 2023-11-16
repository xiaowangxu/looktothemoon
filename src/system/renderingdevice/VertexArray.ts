import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";

export class VertexArray implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly primitive_type: number; 

    private _vertex_array: WebGLVertexArrayObject | undefined = undefined;
    public get vertex_array() { return this._vertex_array; }
    public set vertex_array(vertex_array: WebGLVertexArrayObject | undefined) { this._vertex_array = vertex_array; }

    public get compiled() { return this.vertex_array !== undefined; }

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

    constructor(rd: RenderingDevice, primitive_type: number) {
        this.rd = rd;
        this.primitive_type = primitive_type;
    }

    public free() { }
}