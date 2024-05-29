import { Result } from "@/system/utils/Result";
import { WebGPURenderStateShader, WebGPURenderStateShaderType } from "./render_state_object/pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTexture, WebGPURenderStateTextureDimension, WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination } from "./render_state_object/texture/WebGPURenderStateTexture";
import { WebGPURenderStateProgram } from "./render_state_object/pipeline/WebGPURenderStateProgram";
import { WebGPURenderStateRenderPipeline } from "./render_state_object/pipeline/WebGPURenderStateRenderPipeline";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateSamplerUniformType, WebGPURenderStateTextureUniformSampleType, WebGPURenderStateTextureUniformType, WebGPURenderStateUniformLayout, type WebGPURenderStateUniformType } from "./render_state_object/uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureSampler, WebGPURenderStateTextureWrap } from "./render_state_object/texture/WebGPURenderStateTextureSampler";
import { WebGPURenderStateUniformGroup, type WebGPURenderStateUniformGroupEntry } from "./render_state_object/uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderStateBuffer, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "./render_state_object/buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateTextureView } from "./render_state_object/texture/WebGPURenderStateTextureView";
import { WebGPURenderStateComputePipeline } from "./render_state_object/pipeline/WebGPURenderStateComputePipeline";
import { WebGPURenderStateCanvasTextureView } from "./render_state_object/texture/WebGPURenderStateCanvasTextureView";
import { type WebGPURenderStateAttributeLayout } from "./render_state_object/pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateBlendFactor, WebGPURenderStateBlendOperator, type WebGPURenderStateOutputState } from "./render_state_object/pipeline/WebGPURenderStateOutputState";
import { WebGPURenderStateCullMode, WebGPURenderStateDepthCompareFunc, WebGPURenderStateFacing, WebGPURenderStatePrimitiveType, type WebGPURenderStateProgramState } from "./render_state_object/pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStateMultiSampleCount, WebGPURenderStateMultiSampleTexture } from "./render_state_object/texture/WebGPURenderStateMultiSampleTexture";
import { WebGPURenderStateBufferView } from "./render_state_object/buffer/WebGPURenderStateBufferView";
import { RefMap, ReadonlyRef } from "../utils/RefCounted";
import type { Disposable } from "../utils/Type";

type WebGPURenderStateMemoryLayoutMemberType =
    WebGPURenderStateUniformType |
    { type: 'array', member: WebGPURenderStateMemoryLayoutMemberType, length: number } |
    { type: 'struct', members: WebGPURenderStateMemoryLayoutMemberType[] } |
    { type: 'layout', size: number, align: number };

type WebGPURenderStateMemoryLayoutTypeList<T> = T extends [infer R] ? [WebGPURenderStateMemoryLayoutType<R>] :
    T extends [infer G, ...infer B] ? [WebGPURenderStateMemoryLayoutType<G>, ...WebGPURenderStateMemoryLayoutTypeList<B>] : never;

type WebGPURenderStateMemoryLayoutType<T> =
    T extends WebGPURenderStateUniformType | { type: 'layout' } ?
    { type: 'primitive', size: number, align: number, offset: number } :
    T extends { type: 'array', member: infer R } ? { type: 'array', size: number, align: number, offset: number, member: WebGPURenderStateMemoryLayoutType<R>, length: number } :
    T extends { type: 'struct', members: infer G } ? { type: 'struct', size: number, align: number, offset: number, members: WebGPURenderStateMemoryLayoutTypeList<G> } : never;

export class WebGPURenderState implements Disposable {

    protected _device!: GPUDevice;
    public get device() { return this._device; }

    public async init(): Promise<boolean> {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        if (!device) {
            return false;
        }
        this._device = device;
        //#region mipmap
        this.mipmap_pipeline_uniform_layout_ref = new ReadonlyRef(this.create_UniformLayout());
        this.mipmap_pipeline_uniform_layout_ref.expect.add_Texture(WebGPURenderStateTextureUniformType.Tex2D, WebGPURenderStateTextureUniformSampleType.Float, WebGPURenderStateShaderType.Fragment, 0);
        this.mipmap_pipeline_uniform_layout_ref.expect.add_Sampler(WebGPURenderStateSamplerUniformType.Filter, WebGPURenderStateShaderType.Fragment, 1);
        this.mipmap_texture_sampler_ref = new ReadonlyRef(this.create_TextureSampler(undefined, undefined, undefined, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear, WebGPURenderStateTextureFilter.Linear).expect());
        //#endregion
        return true;
    }

    //#region enum map

    public static RenderStateTextureDimension(type: WebGPURenderStateTextureDimension): GPUTextureDimension {
        switch (type) {
            case WebGPURenderStateTextureDimension.D1: return '1d';
            case WebGPURenderStateTextureDimension.D2: return '2d';
            case WebGPURenderStateTextureDimension.D2Array: return '2d';
            case WebGPURenderStateTextureDimension.CubeMap: return '2d';
            case WebGPURenderStateTextureDimension.CubeMapArray: return '2d';
            case WebGPURenderStateTextureDimension.D3: return '3d';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureDimension: unreachable');
            }
        }
    }

    public static RenderStateDepthCompareFunc(type: WebGPURenderStateDepthCompareFunc): GPUCompareFunction {
        switch (type) {
            case WebGPURenderStateDepthCompareFunc.Never: return 'never';
            case WebGPURenderStateDepthCompareFunc.Always: return 'always';
            case WebGPURenderStateDepthCompareFunc.Less: return 'less';
            case WebGPURenderStateDepthCompareFunc.Equal: return 'equal';
            case WebGPURenderStateDepthCompareFunc.Greater: return 'greater';
            case WebGPURenderStateDepthCompareFunc.NotEqual: return 'not-equal';
            case WebGPURenderStateDepthCompareFunc.LessEqual: return 'less-equal';
            case WebGPURenderStateDepthCompareFunc.GreaterEqual: return 'greater-equal';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateDepthCompareFunc: unreachable');
            }
        }
    }

    public static RenderStateTextureWrap(type: WebGPURenderStateTextureWrap): GPUAddressMode {
        switch (type) {
            case WebGPURenderStateTextureWrap.Clamp: return 'clamp-to-edge';
            case WebGPURenderStateTextureWrap.Repeat: return 'repeat';
            case WebGPURenderStateTextureWrap.MirrorRepeat: return 'mirror-repeat';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureDimension: unreachable');
            }
        }
    }

    public static RenderStateTextureFilter(type: WebGPURenderStateTextureFilter): GPUFilterMode {
        switch (type) {
            case WebGPURenderStateTextureFilter.Nearest: return 'nearest';
            case WebGPURenderStateTextureFilter.Linear: return 'linear';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureFilter: unreachable');
            }
        }
    }

    public static RenderStatePrimitiveType(type: WebGPURenderStatePrimitiveType): GPUPrimitiveTopology {
        switch (type) {
            case WebGPURenderStatePrimitiveType.Triangles: return 'triangle-list';
            case WebGPURenderStatePrimitiveType.TriangleStrip: return 'triangle-strip';
            case WebGPURenderStatePrimitiveType.LineStrip: return 'line-strip';
            case WebGPURenderStatePrimitiveType.Lines: return 'line-list';
            case WebGPURenderStatePrimitiveType.Points: return 'point-list';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStatePrimitiveType: unreachable');
            }
        }
    }

    public static RenderStateCullMode(type: WebGPURenderStateCullMode): GPUCullMode {
        switch (type) {
            case WebGPURenderStateCullMode.Front: return 'front';
            case WebGPURenderStateCullMode.Back: return 'back';
            case WebGPURenderStateCullMode.None: return 'none';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateCullMode: unreachable');
            }
        }
    }

    public static RenderStateMultiSampleCount(type: WebGPURenderStateMultiSampleCount): number {
        switch (type) {
            case WebGPURenderStateMultiSampleCount.None: return 1;
            case WebGPURenderStateMultiSampleCount.MS2: return 2;
            case WebGPURenderStateMultiSampleCount.MS4: return 4;
            case WebGPURenderStateMultiSampleCount.MS8: return 8;
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateMultiSampleCount: unreachable');
            }
        }
    }

    //#endregion

    //#region memory helper

    public static RenderStateMemoryLayout<T extends WebGPURenderStateMemoryLayoutMemberType>(type: T): WebGPURenderStateMemoryLayoutType<T> {

        // WebGPU specs see https://www.w3.org/TR/WGSL/#alignment-and-size

        if (typeof type === 'object') {
            if (type.type === 'layout') {
                return { type: 'primitive', size: type.size, align: type.align, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
            }
            else if (type.type === 'array') {
                const size_align_offset = WebGPURenderState.RenderStateMemoryLayout(type.member);
                const { size, align } = size_align_offset;
                // N × roundUp(AlignOf(E), SizeOf(E))
                return { type: 'array', size: type.length * (Math.ceil(size / align) * align), align: align, offset: 0, member: size_align_offset, length: type.length } as WebGPURenderStateMemoryLayoutType<T>;
            }
            else {
                // align = max(AlignOfMember(S,1), ... , AlignOfMember(S,N))
                let align_max: number = 0;
                const entries: any = [];
                let i = 0;
                for (const member of type.members) {
                    const size_align_offset = WebGPURenderState.RenderStateMemoryLayout(member);
                    align_max = Math.max(align_max, size_align_offset.align);
                    const offset_i_1 = i === 0 ? 0 : entries[i - 1].offset;
                    const size_i_1 = i === 0 ? 0 : entries[i - 1].size;
                    const offset_i = Math.ceil((offset_i_1 + size_i_1) / size_align_offset.align) * size_align_offset.align;
                    entries.push({ ...size_align_offset, offset: offset_i });
                    i++;
                }
                // size = roundUp(AlignOf(S), justPastLastMember) where justPastLastMember = OffsetOfMember(S,N) + SizeOfMember(S,N)
                const { size: last_size, offset: last_offset } = entries[type.members.length - 1];
                const just_pass_last_member = last_offset + last_size;
                const size = Math.ceil(just_pass_last_member / align_max) * align_max;
                return { type: 'struct', size, align: align_max, offset: 0, members: entries } as WebGPURenderStateMemoryLayoutType<T>;
            }
        }
        else {
            switch (type) {
                case WebGPURenderStateBufferUniformType.Bool: return { type: 'primitive', size: 4, align: 4, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Uint: return { type: 'primitive', size: 4, align: 4, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Int: return { type: 'primitive', size: 4, align: 4, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Float: return { type: 'primitive', size: 4, align: 4, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Vector2: return { type: 'primitive', size: 8, align: 8, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Vector3: return { type: 'primitive', size: 12, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Vector4: return { type: 'primitive', size: 16, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Matrix2: return { type: 'primitive', size: 16, align: 8, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Matrix3: return { type: 'primitive', size: 48, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.Matrix4: return { type: 'primitive', size: 64, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.IVector2: return { type: 'primitive', size: 8, align: 8, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.IVector3: return { type: 'primitive', size: 12, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.IVector4: return { type: 'primitive', size: 16, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.UVector2: return { type: 'primitive', size: 8, align: 8, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.UVector3: return { type: 'primitive', size: 12, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                case WebGPURenderStateBufferUniformType.UVector4: return { type: 'primitive', size: 16, align: 16, offset: 0 } as WebGPURenderStateMemoryLayoutType<T>;
                default: {
                    throw new Error('<WebGPURenderStateUniformLayout> RenderStateBufferUniformTypeBufferSize: unreachable');
                }
            }
        }
    }

    //#endregion

    //#region pipeline

    public static is_VertexShader(type: WebGPURenderStateShaderType) { return (type & WebGPURenderStateShaderType.Vertex) !== 0; }

    public static is_FragmentShader(type: WebGPURenderStateShaderType) { return (type & WebGPURenderStateShaderType.Vertex) !== 0; }

    public static is_ComputeShader(type: WebGPURenderStateShaderType) { return (type & WebGPURenderStateShaderType.Vertex) !== 0; }

    public static is_StripPrimitiveType(type: WebGPURenderStatePrimitiveType) { return type === WebGPURenderStatePrimitiveType.LineStrip || type === WebGPURenderStatePrimitiveType.TriangleStrip; }

    public create_Shader(type: WebGPURenderStateShaderType, source: string, defines?: { [key: string]: string; } | undefined): Result<WebGPURenderStateShader, Error> {
        const shader = this.device.createShaderModule({ code: source });
        return Result.Ok(new WebGPURenderStateShader(this, type, shader));
    }

    public delete_Shader(shader: WebGPURenderStateShader): void {
        return;
    }

    public create_Program(vertex_or_compute_shader: WebGPURenderStateShader, frag_shader: WebGPURenderStateShader | undefined): Result<WebGPURenderStateProgram, Error> {
        if (
            !WebGPURenderState.is_VertexShader(vertex_or_compute_shader.type) &&
            !WebGPURenderState.is_ComputeShader(vertex_or_compute_shader.type)
        ) {
            return Result.Error(new Error('<WebGPURenderState> create_Program: vertex_or_compute_shader is not Vertex or Compute shader type'));
        }
        if (frag_shader !== undefined) {
            if (!WebGPURenderState.is_FragmentShader(frag_shader.type)) {
                return Result.Error(new Error('<WebGPURenderState> create_Program: frag_shader is not Fragment shader type'));
            }
            if (!WebGPURenderState.is_VertexShader(vertex_or_compute_shader.type)) {
                return Result.Error(new Error('<WebGPURenderState> create_Program: an render program can not have a compute only shader'));
            }
        }
        return Result.Ok(new WebGPURenderStateProgram(this, vertex_or_compute_shader, frag_shader));
    }

    public delete_Program(program: WebGPURenderStateProgram): void {
        return;
    }

    public create_RenderPipeline(program: WebGPURenderStateProgram, program_state: WebGPURenderStateProgramState, output_state: WebGPURenderStateOutputState, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>): Result<WebGPURenderStateRenderPipeline, Error> {
        // binding group layouts
        const layouts: GPUBindGroupLayout[] = [];
        for (const layout of uniform_layouts) {
            const bind_group_layout = layout.layout;
            if (bind_group_layout === undefined) return Result.Error(new Error('<WebGPURenderState> create_RenderPipeline: WebGPURenderStateUniformLayout needs to be built before creating a pipeline'));
            layouts.push(bind_group_layout);
        }
        const uniform_layout = this.device.createPipelineLayout({ bindGroupLayouts: layouts });
        return this.create_RenderPipeline_with_Layout(program, program_state, output_state, uniform_layout, attribute_layouts);
    }

    public create_RenderPipeline_with_Layout(program: WebGPURenderStateProgram, program_state: WebGPURenderStateProgramState, output_state: WebGPURenderStateOutputState, uniform_layout: GPUPipelineLayout, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>): Result<WebGPURenderStateRenderPipeline, Error> {
        if (!WebGPURenderState.is_VertexShader(program.vertex_or_compute_shader_ref.expect.type)) {
            return Result.Error(new Error('<WebGPURenderState> create_RenderPipeline: program does not have Vertex shader'));
        }

        // attributes buffers
        const buffers: GPUVertexBufferLayout[] = [];
        for (const buffer of attribute_layouts) {
            const attributes: GPUVertexAttribute[] = [];
            for (const attribute of buffer.rows) {
                attributes.push({
                    shaderLocation: attribute.location,
                    offset: attribute.offset,
                    format: attribute.type,
                });
            }
            buffers.push({
                arrayStride: buffer.stride,
                stepMode: buffer.per_instance ? 'instance' : 'vertex',
                attributes: attributes,
            });
        }

        const desc: GPURenderPipelineDescriptor = {
            layout: uniform_layout,
            vertex: {
                module: (program.vertex_or_compute_shader_ref.expect as WebGPURenderStateShader).shader,
                entryPoint: 'vs_main',
                buffers: buffers,
            },
            depthStencil: output_state.depth_stencil_format === undefined ? undefined : {
                format: output_state.depth_stencil_format,
                depthWriteEnabled: program_state.depth_write,
                depthCompare: WebGPURenderState.RenderStateDepthCompareFunc(program_state.depth_compare_func),
                depthBias: program_state.depth_bias,
                depthBiasSlopeScale: program_state.depth_bias_slope_scale,
            },
            primitive: {
                topology: WebGPURenderState.RenderStatePrimitiveType(program_state.primitive_type),
                stripIndexFormat: WebGPURenderState.is_StripPrimitiveType(program_state.primitive_type) ? 'uint32' : undefined,
                cullMode: WebGPURenderState.RenderStateCullMode(program_state.cull_mode),
                frontFace: program_state.facing,
            }
        };

        // color targets
        const targets: GPUColorTargetState[] = [];
        for (const target of output_state.attachments) {
            targets.push({
                format: target.format,
                blend: target.blend ? {
                    color: {
                        operation: target.color_operator ?? WebGPURenderStateBlendOperator.Add,
                        srcFactor: target.color_src_factor ?? WebGPURenderStateBlendFactor.One,
                        dstFactor: target.color_dst_factor ?? WebGPURenderStateBlendFactor.Zero,
                    },
                    alpha: {
                        operation: target.alpha_operator ?? WebGPURenderStateBlendOperator.Add,
                        srcFactor: target.alpha_src_factor ?? WebGPURenderStateBlendFactor.One,
                        dstFactor: target.alpha_dst_factor ?? WebGPURenderStateBlendFactor.Zero,
                    },
                } : undefined,
            })
        }

        if (!program.fragment_shader_ref.is_empty) {
            desc.fragment = {
                module: (program.fragment_shader_ref.expect as WebGPURenderStateShader).shader,
                entryPoint: 'fs_main',
                targets: targets,
            };
        }

        // multi sample
        if (output_state.multi_sample_count > 1) {
            desc.multisample = {
                count: output_state.multi_sample_count,
                alphaToCoverageEnabled: output_state.alpha_to_coverage ?? false,
            };
        }

        const pipeline = this.device.createRenderPipeline(desc);
        return Result.Ok(new WebGPURenderStateRenderPipeline(this, pipeline));
    }

    public delete_RenderPipeline(pipeline: WebGPURenderStateRenderPipeline): void {
        return;
    }

    public create_ComputePipeline(program: WebGPURenderStateProgram, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>): Result<WebGPURenderStateComputePipeline, Error> {
        if (!WebGPURenderState.is_ComputeShader(program.vertex_or_compute_shader_ref.expect.type)) {
            return Result.Error(new Error('<WebGPURenderState> create_ComputePipeline: program does not have Compute shader'));
        }

        // binding group layouts
        const layouts: GPUBindGroupLayout[] = [];
        for (const layout of uniform_layouts) {
            const bind_group_layout = layout.layout;
            if (bind_group_layout === undefined) return Result.Error(new Error('<WebGPURenderState> create_ComputePipeline: WebGPURenderStateUniformLayout needs to be built before creating a pipeline'));
            layouts.push(bind_group_layout);
        }

        const desc: GPUComputePipelineDescriptor = {
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: layouts,
            }),
            compute: {
                module: (program.vertex_or_compute_shader_ref.expect as WebGPURenderStateShader).shader,
                entryPoint: 'main',
            }
        };

        const pipeline = this.device.createComputePipeline(desc);
        return Result.Ok(new WebGPURenderStateComputePipeline(this, pipeline));
    }

    public delete_ComputePipeline(pipeline: WebGPURenderStateComputePipeline): void {
        return;
    }

    //#endregion

    //#region multi sample texture

    public create_MultiSampleTexture(usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat, width: number, height: number, multi_sample_count: WebGPURenderStateMultiSampleCount): Result<WebGPURenderStateMultiSampleTexture, Error> {
        const multi_sample_texture = this.device.createTexture({
            size: [width, height],
            format: format,
            sampleCount: WebGPURenderState.RenderStateMultiSampleCount(multi_sample_count),
            usage: usage,
        });
        return Result.Ok(new WebGPURenderStateMultiSampleTexture(this, usage, format, width, height, multi_sample_count, multi_sample_texture));
    }

    public delete_MultiSampleTexture(texture: WebGPURenderStateMultiSampleTexture): void {
        texture.texture.destroy();
    }

    //#endregion

    //#region texture

    public get_TextureFormatTexelBytes(format: WebGPURenderStateTextureFormat): number {
        switch (format) {
            case WebGPURenderStateTextureFormat.RGBA32F: return 16;
            case WebGPURenderStateTextureFormat.RGBA16F: return 8;
            case WebGPURenderStateTextureFormat.R32U: return 4;
            case WebGPURenderStateTextureFormat.R32F: return 4;
            case WebGPURenderStateTextureFormat.R16F: return 2;
            case WebGPURenderStateTextureFormat.RGBA32U: return 16;
            case WebGPURenderStateTextureFormat.RGBA8: return 4;
            case WebGPURenderStateTextureFormat.BGRA8: return 4;
            case WebGPURenderStateTextureFormat.SRGBA8: return 4;
            case WebGPURenderStateTextureFormat.SBGRA8: return 4;
            case WebGPURenderStateTextureFormat.D24: return 3;
            case WebGPURenderStateTextureFormat.D24S8: return 4;
            case WebGPURenderStateTextureFormat.D32F: return 4;
            case WebGPURenderStateTextureFormat.D32FS8: return 5;
            default: {
                const n: never = format;
                throw new Error('<WebGPURenderState> get_TextureFormatTexelBytes: unreachable');
            }
        }
    }

    public create_Texture(usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat, dimension: WebGPURenderStateTextureDimension, width: number, height: number = 1, depth: number = 1, mipmap_level_count: number = 1): Result<WebGPURenderStateTexture, Error> {
        mipmap_level_count = mipmap_level_count <= 1 ? 1 : Math.min(mipmap_level_count, WebGPURenderState.get_MipmapCount(width, height));
        const texture = this.device.createTexture({
            dimension: WebGPURenderState.RenderStateTextureDimension(dimension),
            size: [width, height, depth],
            mipLevelCount: mipmap_level_count,
            format: format,
            usage: usage,
        });
        return Result.Ok(new WebGPURenderStateTexture(this, usage, format, dimension, width, height, depth, mipmap_level_count, texture));
    }

    public delete_Texture(texture: WebGPURenderStateTexture): void {
        texture.texture.destroy();
    }

    public create_CanvasTextureView(canvas: GPUCanvasContext): Result<WebGPURenderStateCanvasTextureView, Error> {
        return Result.Ok(new WebGPURenderStateCanvasTextureView(this, canvas));
    }

    public delete_CanvasTextureView(canvas_texture_view: WebGPURenderStateCanvasTextureView): void {
        return;
    }

    public create_TextureSampler(
        wrap_u: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        wrap_v: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        wrap_w: WebGPURenderStateTextureWrap = WebGPURenderStateTextureWrap.Clamp,
        min_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        mag_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        mipmap_filter: WebGPURenderStateTextureFilter = WebGPURenderStateTextureFilter.Nearest,
        compare: WebGPURenderStateDepthCompareFunc | undefined = undefined,
        min_lod: number = 0,
        max_lod: number = 32,
        anisotropy: number = 1,
    ): Result<WebGPURenderStateTextureSampler, Error> {
        const sampler = this.device.createSampler({
            addressModeU: WebGPURenderState.RenderStateTextureWrap(wrap_u),
            addressModeV: WebGPURenderState.RenderStateTextureWrap(wrap_v),
            addressModeW: WebGPURenderState.RenderStateTextureWrap(wrap_w),
            minFilter: WebGPURenderState.RenderStateTextureFilter(min_filter),
            magFilter: WebGPURenderState.RenderStateTextureFilter(mag_filter),
            mipmapFilter: WebGPURenderState.RenderStateTextureFilter(mipmap_filter),
            lodMinClamp: min_lod,
            lodMaxClamp: max_lod,
            compare: compare === undefined ? undefined : WebGPURenderState.RenderStateDepthCompareFunc(compare),
            maxAnisotropy: anisotropy,
        });
        return Result.Ok(new WebGPURenderStateTextureSampler(this, wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare, min_lod, max_lod, anisotropy, sampler));
    }

    public delete_TextureSampler(sampler: WebGPURenderStateTextureSampler): void {
        return;
    }

    //#region mipmap

    private readonly mipmap_pipeline_refs: RefMap<WebGPURenderStateTextureFormat, WebGPURenderStateRenderPipeline> = new RefMap();
    private mipmap_pipeline_uniform_layout_ref!: ReadonlyRef<WebGPURenderStateUniformLayout>;
    private mipmap_texture_sampler_ref!: ReadonlyRef<WebGPURenderStateTextureSampler>;

    private get_MipmapPipeline(format: WebGPURenderStateTextureFormat) {
        if (this.mipmap_pipeline_refs.has(format)) {
            return this.mipmap_pipeline_refs.get(format)!;
        }
        else {
            const shader_code = `
            struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) texcoord: vec2f,
            };
 
            @vertex
            fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VSOutput {
                let pos = array(
                    vec2f(0.0, 0.0),
                    vec2f(1.0, 0.0),
                    vec2f(0.0, 1.0),
                    vec2f(0.0, 1.0),
                    vec2f(1.0, 0.0),
                    vec2f(1.0, 1.0),
                );
                var vsOutput: VSOutput;
                let xy = pos[vertexIndex];
                vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
                vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
                return vsOutput;
            }
 
            @group(0) @binding(0) var ourTexture: texture_2d<f32>;
            @group(0) @binding(1) var ourSampler: sampler;
 
            @fragment
            fn fs_main(fsInput: VSOutput) -> @location(0) vec4f {
                return textureSample(ourTexture, ourSampler, fsInput.texcoord);
            }
            `;

            const shader = this.create_Shader(WebGPURenderStateShaderType.Vertex | WebGPURenderStateShaderType.Fragment, shader_code).expect();
            const program = this.create_Program(shader, shader).expect();

            const pipeline = this.create_RenderPipeline(
                program,
                {
                    primitive_type: WebGPURenderStatePrimitiveType.Triangles,
                    cull_mode: WebGPURenderStateCullMode.None,
                    facing: WebGPURenderStateFacing.CounterClockwise,
                    depth_bias: 0,
                    depth_bias_slope_scale: 0,
                    depth_compare_func: WebGPURenderStateDepthCompareFunc.Always,
                    depth_write: false,
                },
                {
                    depth_stencil_format: undefined,
                    multi_sample_count: WebGPURenderStateMultiSampleCount.None,
                    attachments: [
                        // normal
                        {
                            format: format,
                            blend: false,
                        }
                    ],
                },
                [this.mipmap_pipeline_uniform_layout_ref.expect],
                []
            ).expect();

            shader.release();
            program.release();
            this.mipmap_pipeline_refs.set(format, pipeline);

            return pipeline;
        }
    }

    static get_MipmapCount(width: number, height: number) {
        const max_dim = Math.max(width, height);
        return 1 + Math.floor(Math.log2(max_dim));
    }

    public generate_Mipmap(texture: WebGPURenderStateTexture) {
        const mipmap_count = Math.min(texture.mipmap_level_count, WebGPURenderState.get_MipmapCount(texture.width, texture.height));
        let base_mipmap_level = 0;
        const encoder = this.device.createCommandEncoder();
        const sampler = this.mipmap_texture_sampler_ref.expect.sampler;
        const pipeline = this.get_MipmapPipeline(texture.format).pipeline;
        for (let i = mipmap_count - 1; i >= 1; i--) {
            const uniform_bind_group = this.device.createBindGroup({
                layout: this.mipmap_pipeline_uniform_layout_ref.expect.layout,
                entries: [
                    { binding: 0, resource: texture.texture.createView({ baseMipLevel: base_mipmap_level, mipLevelCount: 1 }) },
                    { binding: 1, resource: sampler },
                ],
            });
            base_mipmap_level++;
            const frame_buffer_desc: GPURenderPassDescriptor = {
                colorAttachments: [
                    {
                        view: texture.texture.createView({ baseMipLevel: base_mipmap_level, mipLevelCount: 1 }),
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            };
            const pass = encoder.beginRenderPass(frame_buffer_desc);
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, uniform_bind_group);
            pass.draw(6);
            pass.end();
        }
        const command_buffer = encoder.finish();
        this.device.queue.submit([command_buffer]);
    }

    //#endregion

    //#endregion

    //#region texture view

    public create_TextureView(texture: WebGPURenderStateTexture | WebGPURenderStateMultiSampleTexture, dimension: WebGPURenderStateTextureDimension | undefined = undefined, part: WebGPURendetStateTextureDestination | undefined = WebGPURendetStateTextureDestination.All, base_layer: number = 0, layer_count: number | undefined = undefined, base_mipmap: number | undefined = undefined, mipmap_count: number | undefined = undefined): Result<WebGPURenderStateTextureView, Error> {
        dimension ??= texture.dimension;
        const texture_view = texture.texture.createView({
            dimension: dimension,
            aspect: part,
            baseArrayLayer: base_layer,
            arrayLayerCount: layer_count,
            baseMipLevel: base_mipmap,
            mipLevelCount: mipmap_count
        });
        const multi_sample_count = texture instanceof WebGPURenderStateTexture ? 1 : texture.multi_sample_count;
        return Result.Ok(new WebGPURenderStateTextureView(this, texture, dimension, multi_sample_count, texture_view));
    }

    public delete_TextureView(texture_view: WebGPURenderStateTextureView): void {
        return;
    }

    //#endregion

    //#region uniform

    public create_UniformLayout(): WebGPURenderStateUniformLayout {
        return new WebGPURenderStateUniformLayout(this);
    }

    public delete_UniformLayout(layout: WebGPURenderStateUniformLayout): void {
        return;
    }

    public create_UniformGroup(layout: WebGPURenderStateUniformLayout): Result<WebGPURenderStateUniformGroup, Error> {
        const bind_group_layout = layout.layout;
        if (bind_group_layout === undefined) return Result.Error(new Error('<WebGPURenderState> create_UniformGroup: WebGPURenderStateUniformLayout needs to be built before creating a group'));
        const entries: WebGPURenderStateUniformGroupEntry[] = [];
        for (const entry of layout.entries) {
            entries.push({
                type: entry.type,
                binding: entry.binding,
            })
        }
        return Result.Ok(new WebGPURenderStateUniformGroup(this, bind_group_layout, entries));
    }

    public delete_UniformGroup(group: WebGPURenderStateUniformGroup): void {
        return;
    }

    //#endregion

    //#region buffer

    public create_Buffer(type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, length: number, map?: false): Result<WebGPURenderStateBuffer, Error>;
    public create_Buffer(type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, length: number, map?: true, init_data?: false): Result<WebGPURenderStateBuffer, Error>;
    public create_Buffer(type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, length: number, map?: true, init_data?: true): Result<{ buffer: WebGPURenderStateBuffer, data: ArrayBuffer }, Error>;
    public create_Buffer(type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, length: number, map: boolean = false, init_data: boolean = true): Result<{ buffer: WebGPURenderStateBuffer, data: ArrayBuffer }, Error> | Result<WebGPURenderStateBuffer, Error> {
        const buffer = this.device.createBuffer({
            size: length,
            usage: type | usage,
            mappedAtCreation: map,
        });
        if (map && init_data) {
            return Result.Ok({ buffer: new WebGPURenderStateBuffer(this, type, usage, length, buffer), data: buffer.getMappedRange() });
        }
        else return Result.Ok(new WebGPURenderStateBuffer(this, type, usage, length, buffer));
    }

    public create_BufferView(buffer: WebGPURenderStateBuffer, offset: number, length: number | undefined = undefined): Result<WebGPURenderStateBufferView, Error> {
        if (offset % 4 !== 0) return Result.Error(new Error(`<WebGPURenderState> create_BufferView: view offset should align with 4`));
        length ??= Math.max(0, buffer.length - offset);
        if (offset + length > buffer.length) return Result.Error(new Error(`<WebGPURenderState> create_BufferView: view range out of bound, buffer range is [0, ${buffer.length}), but the view range is [${offset}, ${offset + length})`));
        return Result.Ok(new WebGPURenderStateBufferView(this, buffer, offset, length));
    }

    public delete_Buffer(buffer: WebGPURenderStateBuffer): void {
        buffer.buffer.destroy();
    }

    //#endregion

    public dispose(): void {
        this.mipmap_pipeline_refs.clear();
        this.mipmap_pipeline_uniform_layout_ref.clear();
        this.mipmap_texture_sampler_ref.clear();
    }
}