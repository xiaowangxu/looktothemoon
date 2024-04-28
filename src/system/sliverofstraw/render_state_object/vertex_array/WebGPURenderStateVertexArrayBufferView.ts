import { Ref } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer } from "../buffer/WebGPURenderStateBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";

export class WebGPURenderStateVertexArrayBufferView extends WebGPURenderObjectRefCounted {

    public readonly buffer_ref: Ref<WebGPURenderStateBuffer> = new Ref();
    public get buffer() { return this.buffer_ref.expect.buffer; }

    public readonly offset: number;
    public readonly length: number;

    constructor(render_state: WebGPURenderState, buffer: WebGPURenderStateBuffer, offset: number, length: number) {
        super(render_state);
        this.buffer_ref.value = buffer;
        this.offset = offset;
        this.length = length;
    }

    public dispose(): void {
        this.buffer_ref.clear();
    }
}