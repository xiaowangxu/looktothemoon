import { RenderStateRenderPipeline } from "../../render_state/pipeline/RenderStateRenderPipeline";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateProgram } from "./WebGPURenderStateProgram";

export class WebGPURenderStateRenderPipeline extends RenderStateRenderPipeline<WebGPURenderState> {

    public readonly pipeline: GPURenderPipeline;

    constructor(render_state: WebGPURenderState, program: WebGPURenderStateProgram, pipeline: GPURenderPipeline) {
        super(render_state, program);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        super.dispose();
    }
}