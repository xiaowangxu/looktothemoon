import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";

export class WebGPURenderStateComputePipeline extends WebGPURenderObjectRefCounted {

    public readonly pipeline: GPUComputePipeline;

    constructor(render_state: WebGPURenderState, pipeline: GPUComputePipeline) {
        super(render_state);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        this.render_state.delete_ComputePipeline(this);
    }
}