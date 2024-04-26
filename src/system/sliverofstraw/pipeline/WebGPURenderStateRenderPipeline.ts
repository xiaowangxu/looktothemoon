import type { WebGPURenderState } from "../WebGPURenderState";
import { WebGPURenderStateObjectRefCounted } from "../WebGPURenderStateObject";

export class WebGPURenderStateRenderPipeline extends WebGPURenderStateObjectRefCounted {

    public readonly pipeline: GPURenderPipeline;

    constructor(render_state: WebGPURenderState, pipeline: GPURenderPipeline) {
        super(render_state);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        this.render_state.delete_RenderPipeline(this);
    }
}