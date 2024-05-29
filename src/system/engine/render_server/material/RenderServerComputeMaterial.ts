import { Ref } from "@/system/utils/RefCounted";
import type { WebGPURenderStateUniformGroup } from "../../../sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import type { Temp } from "@/system/utils/Type";
import { RenderServerMaterial } from "./RenderServerMaterial";
import type { WebGPURenderElementComputePipeline } from "@/system/sliverofstraw/render_element_object/pipeline/WebGPURenderElementComputePipeline";
import type { WebGPURenderStateComputePipeline } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateComputePipeline";

type RenderServerComputeMaterialPipelineUniformTarget = { pipeline: WebGPURenderStateComputePipeline, uniform: WebGPURenderStateUniformGroup | undefined };

export class RenderServerComputeMaterial extends RenderServerMaterial<RenderServerComputeMaterial> {

	static readonly #tmp_pipeline_uniform_for_result: RenderServerComputeMaterialPipelineUniformTarget = { pipeline: undefined!, uniform: undefined };

	protected readonly pipeline_ref: Ref<WebGPURenderElementComputePipeline> = new Ref();
	protected readonly uniform_ref: Ref<WebGPURenderStateUniformGroup> = new Ref();

	public set_PipelineUniform(pipeline: WebGPURenderElementComputePipeline, uniform: WebGPURenderStateUniformGroup | undefined) {
		this.pipeline_ref.value = pipeline;
		this.uniform_ref.value = uniform;
	}

	public get_PipelineUniform(): Temp<RenderServerComputeMaterialPipelineUniformTarget> | undefined {
		const tmp = RenderServerComputeMaterial.#tmp_pipeline_uniform_for_result;
		tmp.pipeline = this.pipeline_ref.expect.pipeline;
		tmp.uniform = this.uniform_ref.value;
		return tmp;
	}

	public dispatch(compute_pass: GPUComputePassEncoder) {
		this.pipeline_ref.expect.dispatch(compute_pass);
	}

	public dispose(): void {
		this.pipeline_ref.clear();
		this.uniform_ref.clear();
		super.dispose();
	}
}