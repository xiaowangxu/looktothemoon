import { Ref, RefArray, RefMap } from "@/system/utils/RefCounted";
import { WebGPURenderObjectRefCounted } from "../../WebGPURenderObject";
import type { WebGPURenderStateRenderPipeline } from "../../render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { WebGPURenderStateVertexArray } from "../../render_state_object/vertex_array/WebGPURenderStateVertexArray";
import type { WebGPURenderStateVertexArrayView } from "../../render_state_object/vertex_array/WebGPURenderStateVertexArrayView";
import type { WebGPURenderStateFrameBuffer } from "../../render_state_object/frame_buffer/WebGPURenderStateFrameBuffer";
import type { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateProgramState } from "../../render_state_object/pipeline/WebGPURenderStateProgramState";
import { bitmask_check, bitmask_keep, bitmask_set } from "@/system/utils/BitMask";
import { WebGPURenderStateProgram } from "../../render_state_object/pipeline/WebGPURenderStateProgram";
import type { WebGPURenderStateOutputState } from "../../render_state_object/pipeline/WebGPURenderStateOutputState";
import type { WebGPURenderStateUniformLayout } from "../../render_state_object/uniform/WebGPURenderStateUniformLayout";
import type { WebGPURenderStateAttributeLayout } from "../../render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderState } from "../../WebGPURenderState";

export enum WebGPURenderElementRenderPipelineDepthOffset {
    None, Front, Back,
}

// hash bitmask 32bit uint
// 
// 0b 00 00 00 000 000 0000 0000 0000 0000 0000
//    ^^ ^^ ^^ ^^^ ^^^ |                      |     
//    || || || ||| ||| +---- vertex attrs ----+     
//    || || || ||| |||        
//    || || || ||| primitive type       
//    || || || |||         
//    || || || depth compare func      
//    || || ||          
//    || || depth offset
//    || || 
//    || cull mode
//    ||
//    frame buffer  
export type WebGPURenderElementRenderPipelineCacheHash = number;

export type WebGPURenderElementRenderPipelineCacheGetterFn = (hash: WebGPURenderElementRenderPipelineCacheHash) => WebGPURenderStateProgram;

export class WebGPURenderElementRenderPipelineCache extends WebGPURenderObjectRefCounted {

    protected readonly program_ref: Ref<WebGPURenderStateProgram> | undefined;
    protected readonly program_fn: WebGPURenderElementRenderPipelineCacheGetterFn | undefined;
    
    protected readonly program_state: WebGPURenderStateProgramState;
    protected readonly output_state: WebGPURenderStateOutputState;
    protected readonly uniform_layouts: RefArray<WebGPURenderStateUniformLayout>;
    protected readonly attribute_layouts: WebGPURenderStateAttributeLayout[];

    protected readonly pipeline_layout: GPUPipelineLayout;
    protected readonly pipeline_refs: RefMap<WebGPURenderElementRenderPipelineCacheHash, WebGPURenderStateRenderPipeline> = new RefMap();

    constructor(render_state: WebGPURenderState, program: WebGPURenderStateProgram | WebGPURenderElementRenderPipelineCacheGetterFn, program_state: WebGPURenderStateProgramState, output_state: WebGPURenderStateOutputState, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>) {
        super(render_state);
        if (program instanceof WebGPURenderStateProgram) {
            this.program_ref = new Ref(program);
            this.program_fn = undefined;
        }
        else {
            this.program_ref = undefined;
            this.program_fn = program;
        }
        this.program_state = program_state;
        this.output_state = output_state;
        this.uniform_layouts = new RefArray([...uniform_layouts]);
        this.attribute_layouts = [...attribute_layouts];
        this.pipeline_layout = this.render_state.device.createPipelineLayout({
            bindGroupLayouts: this.uniform_layouts.map(item => item!.layout),
        });
    }

    protected static RenderStateRenderPipelineDepthOffset(depth_offset: WebGPURenderElementRenderPipelineDepthOffset): Pick<WebGPURenderStateProgramState, 'depth_bias' | 'depth_bias_slope_scale'> {
        switch (depth_offset) {
            case WebGPURenderElementRenderPipelineDepthOffset.None: return { depth_bias: 0, depth_bias_slope_scale: 0 };
            case WebGPURenderElementRenderPipelineDepthOffset.Front: return { depth_bias: 1.5, depth_bias_slope_scale: 1.5 };
            case WebGPURenderElementRenderPipelineDepthOffset.Back: return { depth_bias: -1.5, depth_bias_slope_scale: -1.5 };
            default: {
                const n: never = depth_offset;
                throw new Error('<WebGPURenderStateRenderPipelineCache> RenderStateRenderPipelineDepthOffset: unreachable');
            }
        }
    }

    public get(
        vertex_array: WebGPURenderStateVertexArray | WebGPURenderStateVertexArrayView,
        frame_buffer: WebGPURenderStateFrameBuffer,
        cull_mode: WebGPURenderStateCullMode,
        depth_offset: WebGPURenderElementRenderPipelineDepthOffset,
        depth_compare_func: WebGPURenderStateDepthCompareFunc,
    ): WebGPURenderStateRenderPipeline {

        // vertex array attributes
        let bitmask = bitmask_keep(vertex_array.attribute_location_bitmask, 20, 0);
        // frame buffer
        bitmask = bitmask_set(bitmask, frame_buffer.multi_sample_count, 30, 2);
        // cull mode
        bitmask = bitmask_set(bitmask, cull_mode, 28, 2);
        // depth offset
        bitmask = bitmask_set(bitmask, depth_offset, 26, 2);
        // depth compare func
        bitmask = bitmask_set(bitmask, depth_compare_func, 23, 3);
        // primitive type
        const primitive_type = vertex_array.primitive_type;
        bitmask = bitmask_set(bitmask, primitive_type, 20, 3);

        if (this.pipeline_refs.has(bitmask)) {
            return this.pipeline_refs.get(bitmask)!;
        }
        else {
            const pipeline = this.render_state.create_RenderPipeline_with_Layout(
                this.program_ref !== undefined ? this.program_ref.expect : this.program_fn!(bitmask),
                {
                    ...this.program_state,
                    cull_mode: cull_mode,
                    depth_compare_func: depth_compare_func,
                    primitive_type: primitive_type,
                },
                {
                    ...this.output_state,
                    ...WebGPURenderElementRenderPipelineCache.RenderStateRenderPipelineDepthOffset(depth_offset),
                },
                this.pipeline_layout,
                this.attribute_layouts.filter((_, index) => {
                    return bitmask_check(bitmask, index)
                }),
            ).expect();
            this.pipeline_refs.set(bitmask, pipeline);
            return pipeline;
        }
    }

    public dispose(): void {
        if (this.program_ref !== undefined) {
            this.program_ref.clear();
        }
        this.pipeline_refs.clear();
    }
}