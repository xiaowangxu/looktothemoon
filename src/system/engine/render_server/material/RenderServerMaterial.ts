import { RefArray, type RefCountedLike, type WillRefed } from "@/system/utils/RefCounted";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, WebGPURenderStatePrimitiveType, type WebGPURenderStateProgramState } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateProgramState";
import type { WebGPURenderStateUniformGroup } from "../../../sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderElementRenderPipelineCache, type WebGPURenderElementRenderPipelineCacheGetterFn, type WebGPURenderElementVertexArrayLike } from "../../../sliverofstraw/render_element_object/pipeline/WebGPURenderElementRenderPipelineCache";
import type { WebGPURenderElementFrameBuffer } from "../../../sliverofstraw/render_element_object/frame_buffer/WebGPURenderElementFrameBuffer";
import type { WebGPURenderStateRenderPipeline } from "../../../sliverofstraw/render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import type { Disposable, Temp } from "@/system/utils/Type";
import { RenderServer } from "../RenderServer";
import { WebGPURenderStateBlendFactor, WebGPURenderStateBlendOperator, type WebGPURenderStateOutputState } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateOutputState";
import type { WebGPURenderStateUniformLayout } from "@/system/sliverofstraw/render_state_object/uniform/WebGPURenderStateUniformLayout";
import type { WebGPURenderStateAttributeLayout } from "@/system/sliverofstraw/render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateTextureFormat } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateTexture";
import { RenderServerObjectRefCounted } from "../RenderServerObject";
import type { WebGPURenderStateBuffer, WebGPURenderStateBufferData } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBuffer";
import type { WebGPURenderStateBufferView } from "@/system/sliverofstraw/render_state_object/buffer/WebGPURenderStateBufferView";
import { WebGPURenderStateMultiSampleCount } from "@/system/sliverofstraw/render_state_object/texture/WebGPURenderStateMultiSampleTexture";

export enum RenderServerMaterialPass {
    Depth,
    Solid,
    Transparent,
    Max = 3,
    Compose = 3,
}

type RenderServerMaterialUsablePass = Exclude<RenderServerMaterialPass, RenderServerMaterialPass.Max>;

class RenderServerMaterialPipelineUniformItem implements RefCountedLike {

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

    release(): void {
        this.pipeline_cache.release();
        this.uniform?.release();
    }
}

class RenderServerMaterialUniformBufferItem implements RefCountedLike {

    public readonly buffer: WebGPURenderStateBuffer | WebGPURenderStateBufferView;
    public data: WebGPURenderStateBufferData;
    public changed: boolean = true;

    constructor(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
        this.buffer = buffer;
        this.data = data;
    }

    public commit() {
        if (this.changed) {
            this.changed = false;
            this.buffer.update_Data(0, this.data);
        }
    }

    ref(): void {
        this.buffer.ref();
    }

    unref(): void {
        this.buffer.unref();
    }

    release(): void {
        this.buffer.release();
    }
}

type RenderServerMaterialPipelineUniformTarget = { pipeline: WebGPURenderStateRenderPipeline, uniform: WebGPURenderStateUniformGroup | undefined };

export class RenderServerMaterial extends RenderServerObjectRefCounted {

    static readonly #tmp_pipeline_uniform_for_result: RenderServerMaterialPipelineUniformTarget = { pipeline: undefined!, uniform: undefined };

    public cull_mode: WebGPURenderStateCullMode = WebGPURenderStateCullMode.Back;
    public depth_bias: number = 0.0;
    public depth_bias_slope_scale: number = 0.0;

    public is_transparent: boolean = false;

    protected readonly pipeline_uniform_refs: RefArray<RenderServerMaterialPipelineUniformItem> = new RefArray(RenderServerMaterialPass.Max);

    protected readonly uniform_buffer_refs: RefArray<RenderServerMaterialUniformBufferItem> = new RefArray(0);

    //#region create Pipeline Cache

    static ProgramStatePipelineTemplates: [WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState, WebGPURenderStateProgramState] = [
        // RenderServerMaterialPass.Depth
        {
            primitive_type: WebGPURenderStatePrimitiveType.Triangles,
            cull_mode: WebGPURenderStateCullMode.Back,
            facing: WebGPURenderStateFacing.CounterClockwise,
            depth_bias: 0,
            depth_bias_slope_scale: 0,
            depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
            depth_write: true,
        },
        // RenderServerMaterialPass.Solid
        {
            primitive_type: WebGPURenderStatePrimitiveType.Triangles,
            cull_mode: WebGPURenderStateCullMode.Back,
            facing: WebGPURenderStateFacing.CounterClockwise,
            depth_bias: 0,
            depth_bias_slope_scale: 0,
            depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
            depth_write: true,
        },
        // RenderServerMaterialPass.Transparent
        {
            primitive_type: WebGPURenderStatePrimitiveType.Triangles,
            cull_mode: WebGPURenderStateCullMode.Back,
            facing: WebGPURenderStateFacing.CounterClockwise,
            depth_bias: 0,
            depth_bias_slope_scale: 0,
            depth_compare_func: WebGPURenderStateDepthCompareFunc.LessEqual,
            depth_write: false,
        },
        // RenderServerMaterialPass.Compose
        {
            primitive_type: WebGPURenderStatePrimitiveType.Triangles,
            cull_mode: WebGPURenderStateCullMode.Back,
            facing: WebGPURenderStateFacing.CounterClockwise,
            depth_bias: 0,
            depth_bias_slope_scale: 0,
            depth_compare_func: WebGPURenderStateDepthCompareFunc.Always,
            depth_write: false,
        }
    ];

    static OutputStatePipelineTemplates: [WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState, WebGPURenderStateOutputState] = [
        // RenderServerMaterialPass.Depth
        {
            depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
            multi_sample_count: WebGPURenderStateMultiSampleCount.None,
            attachments: [
                // normal
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
                    blend: false,
                }
            ],
        },
        // RenderServerMaterialPass.Solid
        {
            depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
            multi_sample_count: WebGPURenderStateMultiSampleCount.None,
            attachments: [
                // color
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
                    blend: false,
                },
                // normal
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
                    blend: false,
                }
            ],
        },
        // RenderServerMaterialPass.Transparent
        {
            depth_stencil_format: WebGPURenderStateTextureFormat.D32F,
            multi_sample_count: WebGPURenderStateMultiSampleCount.None,
            alpha_to_coverage: false,
            attachments: [
                // accum
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
                    color_src_factor: WebGPURenderStateBlendFactor.One,
                    color_dst_factor: WebGPURenderStateBlendFactor.One,
                    alpha_src_factor: WebGPURenderStateBlendFactor.One,
                    alpha_dst_factor: WebGPURenderStateBlendFactor.One,
                    blend: true,
                },
                // reveal
                {
                    format: WebGPURenderStateTextureFormat.R16F,
                    color_src_factor: WebGPURenderStateBlendFactor.Zero,
                    color_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrc,
                    alpha_src_factor: WebGPURenderStateBlendFactor.Zero,
                    alpha_dst_factor: WebGPURenderStateBlendFactor.Zero,
                    blend: true,
                },
            ],
        },
        // RenderServerMaterialPass.Compose
        {
            depth_stencil_format: undefined,
            multi_sample_count: WebGPURenderStateMultiSampleCount.None,
            alpha_to_coverage: false,
            attachments: [
                // compose
                {
                    format: WebGPURenderStateTextureFormat.RGBA16F,
                    color_src_factor: WebGPURenderStateBlendFactor.SrcAlpha,
                    color_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrcAlpha,
                    alpha_src_factor: WebGPURenderStateBlendFactor.SrcAlpha,
                    alpha_dst_factor: WebGPURenderStateBlendFactor.OneMinusSrcAlpha,
                    blend: true,
                },
            ],
        }
    ];

    static create_PipelineCache(fn: WebGPURenderElementRenderPipelineCacheGetterFn, pass: RenderServerMaterialUsablePass, uniform_layout: WebGPURenderStateUniformLayout | undefined, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>) {
        return new WebGPURenderElementRenderPipelineCache(
            RenderServer.render_state,
            fn,
            RenderServerMaterial.ProgramStatePipelineTemplates[pass],
            RenderServerMaterial.OutputStatePipelineTemplates[pass],
            uniform_layout !== undefined ?
                [RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout, uniform_layout] :
                [RenderServer.world_env_uniform_layout, RenderServer.lights_uniform_layout, RenderServer.instance_uniform_layout],
            attribute_layouts,
        );
    }

    //#endregion

    public set_PipelineUniform(pass: RenderServerMaterialUsablePass, pipeline_cache: WebGPURenderElementRenderPipelineCache, uniform: WebGPURenderStateUniformGroup | undefined) {
        this.pipeline_uniform_refs.set(pass, new RenderServerMaterialPipelineUniformItem(pipeline_cache, uniform));
    }

    public get_PipelineUniform(pass: RenderServerMaterialPass, vertex_array: WebGPURenderElementVertexArrayLike, frame_buffer: WebGPURenderElementFrameBuffer, depth_compare_func: WebGPURenderStateDepthCompareFunc): Temp<RenderServerMaterialPipelineUniformTarget> | undefined {
        const item = this.pipeline_uniform_refs.get(pass);
        if (item === undefined) return undefined;
        const { pipeline_cache, uniform } = item;
        const pipeline = pipeline_cache.get(vertex_array, frame_buffer, this.cull_mode, this.depth_bias, this.depth_bias_slope_scale, depth_compare_func);
        if (pipeline === undefined) return;
        const tmp = RenderServerMaterial.#tmp_pipeline_uniform_for_result;
        tmp.pipeline = pipeline;
        tmp.uniform = uniform;
        return tmp;
    }

    public add_UniformBuffer(buffer: WebGPURenderStateBuffer, data: WebGPURenderStateBufferData) {
        this.uniform_buffer_refs.push(new RenderServerMaterialUniformBufferItem(buffer, data));
    }

    public set_UniformBufferData(index: number, data: WebGPURenderStateBufferData) {
        const item = this.uniform_buffer_refs.get(index);
        if (item !== undefined) {
            item.data = data;
        }
    }

    public trigger_UniformBufferChange(index: number) {
        const item = this.uniform_buffer_refs.get(index);
        if (item !== undefined) {
            item.changed = true;
        }
    }

    public update_UniformBuffers() {
        for (let i = 0, l = this.uniform_buffer_refs.length; i < l; i++) {
            const item = this.uniform_buffer_refs.get(i);
            if (item !== undefined) {
                item.commit();
            }
        }
    }

    public dispose(): void {
        this.pipeline_uniform_refs.clear();
        this.uniform_buffer_refs.clear();
    }
}