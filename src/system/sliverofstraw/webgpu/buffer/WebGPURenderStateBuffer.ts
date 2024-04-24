import { RenderStateBuffer, RenderStateBufferDataType, type RenderStateBufferData } from "../../render_state/buffer/RenderStateBuffer";
import type { WebGPURenderState } from "../WebGPURenderState";

export class WebGPURenderStateBuffer extends RenderStateBuffer<WebGPURenderState> {

    public readonly buffer: GPUBuffer;

    constructor(render_state: WebGPURenderState, type: number, usage: number, data_type: RenderStateBufferDataType, element_size: number, size: number, buffer: GPUBuffer) {
        super(render_state, type, usage, data_type, element_size, size);
        this.buffer = buffer;
    }

    public update_Data(dst_offset: number, data: RenderStateBufferData, data_element_offset?: number | undefined, data_element_length?: number | undefined): void {
        this.render_state.device.queue.writeBuffer(this.buffer, dst_offset, data, data_element_offset, data_element_length);
    }
}