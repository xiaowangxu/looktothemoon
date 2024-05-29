import { ReadonlyRef, RefArray } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderState } from "../../WebGPURenderState";
import type { WebGPURenderStateUniformLayout } from "../../render_state_object/uniform/WebGPURenderStateUniformLayout";
import type { WebGPURenderStateComputePipeline } from "../../render_state_object/pipeline/WebGPURenderStateComputePipeline";

export class WebGPURenderElementComputePipeline extends WebGPURenderObjectRefCounted {

    public readonly pipeline_ref: ReadonlyRef<WebGPURenderStateComputePipeline>;
    public get pipeline() { return this.pipeline_ref.expect; }

    public workgroup_x: number = 16;
    public workgroup_y: number | undefined = undefined;
    public workgroup_z: number | undefined = undefined;

    protected readonly uniform_layouts: RefArray<WebGPURenderStateUniformLayout>;

    protected readonly pipeline_layout: GPUPipelineLayout;

    constructor(render_state: WebGPURenderState, pipeline: WebGPURenderStateComputePipeline, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>) {
        super(render_state);
        this.pipeline_ref = new ReadonlyRef(pipeline);
        this.uniform_layouts = new RefArray([...uniform_layouts]);
        this.pipeline_layout = this.render_state.device.createPipelineLayout({
            bindGroupLayouts: this.uniform_layouts.map(item => item!.layout),
        });
    }

    public dispatch(compute_pass: GPUComputePassEncoder) {
        compute_pass.dispatchWorkgroups(this.workgroup_x, this.workgroup_y, this.workgroup_z);
    }

    public dispose(): void {
        this.pipeline_ref.clear();
        this.uniform_layouts.clear();
    }
}