import { RefArray } from "@/system/utils/RefCounted";
import type { RenderStateAttributeLayout } from "../../render_state/pipeline/RenderStateAttributeLayout";
import type { RenderStateProgramState } from "../../render_state/pipeline/RenderStateProgramState";
import { RenderStateRenderPipeline } from "../../render_state/pipeline/RenderStateRenderPipeline";
import type { RenderStateUniformLayout } from "../../render_state/uniform/RenderStateUniformLayout";
import type { WebGPURenderState } from "../WebGPURenderState";
import type { WebGPURenderStateProgram } from "./WebGPURenderStateProgram";
import type { WebGPURenderStateUniformLayout } from "../uniform/WebGPURenderStateUniformLayout";

export class WebGPURenderStateRenderPipeline extends RenderStateRenderPipeline<WebGPURenderState> {

    public readonly pipeline: GPURenderPipeline;
    public readonly uniform_layout_refs: RefArray<WebGPURenderStateUniformLayout>;

    constructor(render_state: WebGPURenderState, program: WebGPURenderStateProgram, pipeline: GPURenderPipeline, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>) {
        super(render_state, program);
        this.pipeline = pipeline;
        this.uniform_layout_refs = new RefArray([...uniform_layouts]);
    }

    public dispose(): void {
        this.uniform_layout_refs.clear();
        super.dispose();
    }
}