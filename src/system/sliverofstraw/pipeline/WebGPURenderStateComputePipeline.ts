import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export class WebGPURenderStateComputePipeline extends WebGPURenderStateObjectRefCounted {

    public readonly pipeline: GPUComputePipeline;

    constructor(render_state: WebGPURenderState, pipeline: GPUComputePipeline) {
        super(render_state);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        this.render_state.delete_ComputePipeline(this);
    }
}