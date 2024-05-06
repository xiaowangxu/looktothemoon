import { RefArray, type RefCountedLike } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateRenderPipeline } from "../../render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { WebGPURenderElementVertexArray } from "../vertex_array/WebGPURenderElementVertexArray";
import type { WebGPURenderElementVertexArrayView } from "../vertex_array/WebGPURenderElementVertexArrayView";
import type { WebGPURenderElementFrameBuffer } from "../frame_buffer/WebGPURenderElementFrameBuffer";
import type { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateProgramState } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";
import { bitmask_check, bitmask_keep, bitmask_set } from "@/system/utils/BitMask";
import { WebGPURenderStateProgram } from "../../render_state_object/pipeline/WebGPURenderStateProgram";
import type { WebGPURenderStateOutputState } from "../../render_state_object/pipeline/WebGPURenderStateOutputState";
import type { WebGPURenderStateUniformLayout } from "../../render_state_object/uniform/WebGPURenderStateUniformLayout";
import type { WebGPURenderStateAttributeLayout } from "../../render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderState } from "../../WebGPURenderState";

// hash bitmask 32bit uint
// 
// 0b 00 00 000 000 0000000000 000000000000
//    ^^ ^^ ^^^ ^^^ ^^^^^^^^^^ |          |     
//    || || ||| ||| |||||||||| +----------+
//    || || ||| ||| ||||||||||   12 vert
//    || || ||| ||| ||||||||||
//    || || ||| |||  preserve
//    || || ||| |||           
//    || || ||| |||           
//    || || ||| |||           
//    || || ||| primitive type       
//    || || |||         
//    || || depth compare func      
//    || ||
//    || cull mode
//    ||
//    frame buffer multi sample count 
// 
export type WebGPURenderElementRenderPipelineCacheHash = number;

export type WebGPURenderElementRenderPipelineCacheGetterFn = (hash: WebGPURenderElementRenderPipelineCacheHash) => WebGPURenderStateProgram | undefined;

export type WebGPURenderElementVertexArrayLike = WebGPURenderElementVertexArray | WebGPURenderElementVertexArrayView;

class WebGPURenderElementRenderPipelineCacheItem implements RefCountedLike {

    public readonly pipeline: WebGPURenderStateRenderPipeline;
    public readonly bitmask: WebGPURenderElementRenderPipelineCacheHash;
    public readonly depth_bias: number;
    public readonly depth_bias_slope_scale: number;

    constructor(pipeline: WebGPURenderStateRenderPipeline, bitmask: WebGPURenderElementRenderPipelineCacheHash, depth_bias: number, depth_bias_slope_scale: number) {
        this.pipeline = pipeline;
        this.bitmask = bitmask;
        this.depth_bias = depth_bias;
        this.depth_bias_slope_scale = depth_bias_slope_scale;
    }

    ref(): void {
        this.pipeline.ref();
    }

    unref(): void {
        this.pipeline.unref();
    }
}

export class WebGPURenderElementRenderPipelineCache extends WebGPURenderObjectRefCounted {

    protected readonly program_getter_fn: WebGPURenderElementRenderPipelineCacheGetterFn;
    protected readonly program_state: WebGPURenderStateProgramState;
    protected readonly output_state: WebGPURenderStateOutputState;
    protected readonly uniform_layouts: RefArray<WebGPURenderStateUniformLayout>;
    protected readonly attribute_layouts: WebGPURenderStateAttributeLayout[];

    protected readonly pipeline_layout: GPUPipelineLayout;
    protected readonly pipeline_refs: RefArray<WebGPURenderElementRenderPipelineCacheItem> = new RefArray();

    constructor(render_state: WebGPURenderState, program_getter_fn: WebGPURenderElementRenderPipelineCacheGetterFn, program_state: WebGPURenderStateProgramState, output_state: WebGPURenderStateOutputState, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>) {
        super(render_state);
        this.program_getter_fn = program_getter_fn;
        this.program_state = program_state;
        this.output_state = output_state;
        this.uniform_layouts = new RefArray([...uniform_layouts]);
        this.attribute_layouts = [...attribute_layouts];
        this.pipeline_layout = this.render_state.device.createPipelineLayout({
            bindGroupLayouts: this.uniform_layouts.map(item => item!.layout),
        });
    }

    public get(
        vertex_array: WebGPURenderElementVertexArrayLike,
        frame_buffer: WebGPURenderElementFrameBuffer,
        cull_mode: WebGPURenderStateCullMode,
        depth_bias: number, depth_bias_slope_scale: number,
        depth_compare_func: WebGPURenderStateDepthCompareFunc,
    ): WebGPURenderStateRenderPipeline | undefined {

        // vertex array attributes
        let bitmask = bitmask_keep(vertex_array.attribute_bitmask, 12, 0);
        // preserved [13-22]
        // primitive type
        const primitive_type = vertex_array.primitive_type;
        bitmask = bitmask_set(bitmask, primitive_type, 22, 3);
        // depth compare func
        bitmask = bitmask_set(bitmask, depth_compare_func, 25, 3);
        // cull mode
        bitmask = bitmask_set(bitmask, cull_mode, 28, 2);
        // frame buffer multi sample count
        bitmask = bitmask_set(bitmask, frame_buffer.multi_sample_count, 30, 2);

        const length = this.pipeline_refs.length;
        for (let i = 0; i < length; i++) {
            const item = this.pipeline_refs.index(i);
            if (item.bitmask === bitmask && item.depth_bias === depth_bias && item.depth_bias_slope_scale === depth_bias_slope_scale) return item.pipeline;
        }
        const program = this.program_getter_fn(bitmask);
        if (program === undefined) return undefined;
        const pipeline = this.render_state.create_RenderPipeline_with_Layout(
            program,
            {
                ...this.program_state,
                cull_mode: cull_mode,
                depth_compare_func: depth_compare_func,
                depth_bias: depth_bias,
                depth_bias_slope_scale: depth_bias_slope_scale,
                primitive_type: primitive_type,
            },
            {
                ...this.output_state,
            },
            this.pipeline_layout,
            this.attribute_layouts.filter((_, index) => {
                return bitmask_check(bitmask, index);
            }),
        ).expect();
        this.pipeline_refs.unshift(new WebGPURenderElementRenderPipelineCacheItem(pipeline, bitmask, depth_bias, depth_bias_slope_scale));
        return pipeline;
    }

    public dispose(): void {
        this.pipeline_refs.clear();
    }
}