import type { WebGPURenderState } from "../../WebGPURenderState";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderElementRenderPipelineCacheHash } from "../../render_element_object/pipeline/WebGPURenderElementRenderPipelineCache";

export class WebGPURenderStateRenderPipeline extends WebGPURenderObjectRefCounted {

    public readonly pipeline: GPURenderPipeline;

    constructor(render_state: WebGPURenderState, pipeline: GPURenderPipeline) {
        super(render_state);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        this.render_state.delete_RenderPipeline(this);
    }
}