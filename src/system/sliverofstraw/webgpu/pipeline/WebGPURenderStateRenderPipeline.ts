import type { RenderStateAttributeLayout } from "../../render_state/pipeline/RenderStateAttributeLayout";
import type { RenderStateProgramState } from "../../render_state/pipeline/RenderStateProgramState";
import { RenderStateRenderPipeline } from "../../render_state/pipeline/RenderStateRenderPipeline";
import type { RenderStateUniformLayout } from "../../render_state/uniform/RenderStateUniformLayout";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateProgram } from "./WebGPURenderStateProgram";

export class WebGPURenderStateRenderPipeline extends RenderStateRenderPipeline<WebGPURenderState> {

    public readonly pipeline: GPURenderPipeline;

    constructor(render_state: WebGPURenderState, program: WebGPURenderStateProgram, pipeline: GPURenderPipeline) {
        super(render_state, program);
        this.pipeline = pipeline;
    }
}