import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObject, WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import { WebGPURenderStateBufferDataType, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage, type WebGPURenderStateBuffer } from "./WebGPURenderStateBuffer";
import { align } from "@/system/fivepebble/Scalar";

class WebGPURenderStateBufferStagingChunk extends WebGPURenderObject {

    public readonly buffer_ref: Ref<WebGPURenderStateBuffer> = new Ref();

    public get buffer() { return this.buffer_ref.expect.buffer; }

    public readonly length: number;
    public offset: number;

    constructor(render_state: WebGPURenderState, buffer: WebGPURenderStateBuffer, offset: number, length: number) {
        super(render_state);
        this.buffer_ref.value = buffer;
        this.length = length;
        this.offset = offset;
    }

    public dispose(): void {
        this.buffer_ref.clear();
    }
}

export class WebGPURenderStateBufferStagingBelt extends WebGPURenderObjectRefCounted {

    protected readonly chunk_length: number;

    /**
     * chunks into which we are accumulating data to be transferred, all mapped
     */
    protected active_chunks: WebGPURenderStateBufferStagingChunk[] = [];
    /**
     * chunks that have scheduled transfers already; they are unmapped and some
     * command encoder has one or more `copy_buffer_to_buffer` commands with them
     * as source
     */
    protected closed_chunks: WebGPURenderStateBufferStagingChunk[] = [];
    /**
     * chunks that are back from the GPU and ready to be mapped for write and put into active_chunks
     */
    protected free_chunks: WebGPURenderStateBufferStagingChunk[] = [];


    constructor(render_state: WebGPURenderState, chunk_length: number) {
        super(render_state);
        this.chunk_length = chunk_length;
    }

    public write_Buffer(
        encoder: GPUCommandEncoder,
        dst: WebGPURenderStateBuffer, dst_offset: number,
        data: ArrayBuffer, data_offset: number, data_length: number
    ) {
        const active_index = this.active_chunks.findIndex(chunk => chunk === undefined ? false : (chunk.offset + data_length) <= chunk.length);
        let chunk: WebGPURenderStateBufferStagingChunk;
        // no more avaliable range in active chunks
        if (active_index <= 0) {
            // find in free chunks
            const free_index = this.free_chunks.findIndex(chunk => chunk === undefined ? false : chunk?.length <= data_length);
            if (free_index <= 0) {
                const length = Math.max(this.chunk_length, data_length);
                const buffer = this.render_state.create_Buffer(
                    WebGPURenderStateBufferType.NotSpecified,
                    WebGPURenderStateBufferUsage.MapWrite | WebGPURenderStateBufferUsage.CopySrc,
                    WebGPURenderStateBufferDataType.Byte,
                    length, true
                ).expect();
                const free_chunk = new WebGPURenderStateBufferStagingChunk(this.render_state, buffer, 0, length);
                this.active_chunks.push(free_chunk);
                chunk = free_chunk;
            }
            // no more avaliable range in active chunks
            // create a new buffer big enough to contain the data
            else {
                const free_chunk = this.free_chunks[free_index];
                this.active_chunks.push(free_chunk);
                this.free_chunks.splice(free_index, 1);
                chunk = free_chunk;
            }
        }
        else {
            chunk = this.active_chunks[active_index];
        }
        encoder.copyBufferToBuffer(chunk.buffer, chunk.offset, dst.buffer, dst_offset, data_length);
        let old_offset = chunk.offset;
        chunk.offset = align(chunk.offset + data_length, 8); // MAP_ALIGNMENT = 8
        const map_array_buffer = chunk.buffer.getMappedRange(old_offset, data_length);
        const dst_array_buffer_view = new Uint8Array(map_array_buffer);
        const data_array_buffer_view = new Uint8Array(data, data_offset);
        dst_array_buffer_view.set(data_array_buffer_view);
    }

    /**
     * prepare currently mapped buffers for use in a submission
     * 
     * This must be called ***before*** the command encoder(s) provided to
     * [`WebGPURenderStateBufferStagingBelt::write_Buffer()`] are submitted
     * 
     * At this point, all the partially used staging buffers are closed (cannot be used for
     * further writes) until after [`WebGPURenderStateBufferStagingBelt::recall()`] is called *and* the GPU is done
     * copying the data from them
     */
    public finish() {
        // unmap all active chunks' buffer
        for (const chunk of this.active_chunks) {
            if (chunk === undefined) continue;
            chunk.buffer.unmap();
            this.closed_chunks.push(chunk);
        }
        this.active_chunks = [];
    }

    /**
     * recall all of the closed buffers back to be reused
     *
     * This must only be called after the command encoder(s) provided to
     * [`WebGPURenderStateBufferStagingBelt::write_Buffer()`] are submitted
     */
    public recall() {
        for (const chunk of this.closed_chunks) {
            chunk.buffer.mapAsync(GPUMapMode.WRITE).then(() => {
                chunk.offset = 0;
                this.free_chunks.push(chunk);
            });
        }
        this.closed_chunks = [];
    }

    public dispose(): void {
        for (const chunk of this.active_chunks) chunk.dispose();
        for (const chunk of this.free_chunks) chunk.dispose();
        for (const chunk of this.closed_chunks) chunk.dispose();
    }
}