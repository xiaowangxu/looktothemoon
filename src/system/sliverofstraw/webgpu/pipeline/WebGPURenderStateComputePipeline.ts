import { RefArray } from "@/system/utils/RefCounted";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateProgram } from "./WebGPURenderStateProgram";
import type { WebGPURenderStateUniformLayout } from "../uniform/WebGPURenderStateUniformLayout";
import { RenderStateComputePipeline } from "../../render_state/pipeline/RenderStateComputePipeline";

export class WebGPURenderStateComputePipeline extends RenderStateComputePipeline<WebGPURenderState> {

    public readonly pipeline: GPUComputePipeline;

    constructor(render_state: WebGPURenderState, program: WebGPURenderStateProgram, pipeline: GPUComputePipeline) {
        super(render_state, program);
        this.pipeline = pipeline;
    }

    public dispose(): void {
        super.dispose();
    }
}