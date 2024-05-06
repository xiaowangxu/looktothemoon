import { RefArray, type RefCountedLike } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderStateUniformGroup } from "../../render_state_object/uniform/WebGPURenderStateUniformGroup";
import type { WebGPURenderElementRenderPipelineCache, WebGPURenderElementVertexArrayLike } from "../pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderElementFrameBuffer } from "../frame_buffer/WebGPURenderElementFrameBuffer";
import type { WebGPURenderStateRenderPipeline } from "../../render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { Temp } from "@/system/utils/Type";

export enum WebGPURenderElementMaterialPass {
    Depth,
    Solid,
    Transparent,
    Max = 3,
}

class WebGPURenderElementMaterialShaderItem implements RefCountedLike {

    public readonly pipeline_cache: WebGPURenderElementRenderPipelineCache;
    public readonly uniform: WebGPURenderStateUniformGroup | undefined;

    constructor(pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
        this.pipeline_cache = pipeline_cache;
        this.uniform = uniform;
    }

    ref(): void {
        this.pipeline_cache.ref();
        this.uniform?.ref();
    }

    unref(): void {
        this.pipeline_cache.unref();
        this.uniform?.unref();
    }
}

type WebGPURenderElementMaterialPipelineUniformTarget = { pipeline: WebGPURenderStateRenderPipeline, uniform: WebGPURenderStateUniformGroup | undefined };

export class WebGPURenderElementMaterial extends WebGPURenderObjectRefCounted {

    static readonly WorldEnvUniformBindGroupIndex = 0;
    static readonly LightsUniformBindGroupIndex = 1;
    static readonly GlobalUniformBindGroupIndex = 2;
    static readonly UniformBindGroupIndex = 3;

    static readonly #tmp_pipeline_uniform_target: WebGPURenderElementMaterialPipelineUniformTarget = { pipeline: undefined!, uniform: undefined };

    public cull_mode: WebGPURenderStateCullMode = WebGPURenderStateCullMode.Back;
    public depth_bias: number = 0.0;
    public depth_bias_slope_scale: number = 0.0;

    protected readonly pipeline_uniform_refs: RefArray<WebGPURenderElementMaterialShaderItem> = new RefArray(WebGPURenderElementMaterialPass.Max);

    public set_PipelineUniform(pass: WebGPURenderElementMaterialPass, pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
        if (pass < 0 || pass >= WebGPURenderElementMaterialPass.Max) throw new Error('<WebGPURenderElementMaterial> set_PipelineUniform: pass out of bound');
        this.pipeline_uniform_refs.set(pass, new WebGPURenderElementMaterialShaderItem(pipeline_cache, uniform));
    }

    public get_PipelineUniform(pass: WebGPURenderElementMaterialPass, vertex_array: WebGPURenderElementVertexArrayLike, frame_buffer: WebGPURenderElementFrameBuffer, depth_compare_func: WebGPURenderStateDepthCompareFunc): Temp<WebGPURenderElementMaterialPipelineUniformTarget> | undefined {
        const item = this.pipeline_uniform_refs.get(pass);
        if (item === undefined) return undefined;
        const { pipeline_cache, uniform } = item;
        const pipeline = pipeline_cache.get(vertex_array, frame_buffer, this.cull_mode, this.depth_bias, this.depth_bias_slope_scale, depth_compare_func);
        if (pipeline === undefined) return;
        const tmp = WebGPURenderElementMaterial.#tmp_pipeline_uniform_target;
        tmp.pipeline = pipeline;
        tmp.uniform = uniform;
        return tmp;
    }

    public dispose(): void {
        this.pipeline_uniform_refs.clear();
    }
}