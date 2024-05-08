import { ReadonlyRef } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "../buffer/WebGPURenderStateBuffer";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { WebGPURenderStateBufferStagingBelt } from "./WebGPURenderStateBufferStagingBelt";

export class WebGPURenderStateBufferView extends WebGPURenderObjectRefCounted {

    public readonly buffer_ref: ReadonlyRef<WebGPURenderStateBuffer>;
    public get buffer() { return this.buffer_ref.expect.buffer; }

    public readonly offset: number;
    public readonly length: number;

    constructor(render_state: WebGPURenderState, buffer: WebGPURenderStateBuffer, offset: number, length: number) {
        super(render_state);
        this.buffer_ref = new ReadonlyRef(buffer);
        this.offset = offset;
        this.length = length;
    }

    public update_Data(dst_offset: number, data: WebGPURenderStateBufferData, data_element_offset?: number | undefined, data_element_length?: number | undefined): void {
        this.buffer_ref.expect.update_Data(dst_offset + this.offset, data, data_element_offset, data_element_length);
    }

    public update_Data_by_StagingBelt(
        staging_belt: WebGPURenderStateBufferStagingBelt, encoder: GPUCommandEncoder,
        dst_offset: number, data: ArrayBuffer, data_offset: number, data_length: number,
    ) {
        this.buffer_ref.expect.update_Data_by_StagingBelt(staging_belt, encoder, dst_offset + this.offset, data, data_offset, data_length);
    }

    public dispose(): void {
        this.buffer_ref.clear();
    }
}