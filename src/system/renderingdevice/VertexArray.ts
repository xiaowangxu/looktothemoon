import { Buffer } from "./Buffer";
import { type RefCounted, Ref } from "../utils/RefCounted";
import type { RenderingDevice } from "./RenderingDevice";
import type { BufferView } from "./Buffer";

export class VertexArray implements RefCounted {
    private readonly rd: RenderingDevice;
    public readonly primitive_type: number;

    public offset: number = 0;
    public count: number = 0;

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

    constructor(rd: RenderingDevice, primitive_type: number, offset: number, count: number) {
        this.rd = rd;
        this.primitive_type = primitive_type;
        this.offset = offset;
        this.count = count;
    }

    public bind_Buffer(attribute: string, attribute_location: number, buffer: Buffer | BufferView) {
        this.rd.state.set_VertexArrayAttributeBuffer(this, attribute_location, buffer);
    }

    public free() {
        this.rd.state.free_VertexArray(this);
    }
}