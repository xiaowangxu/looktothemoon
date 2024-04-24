import { Result } from "@/system/utils/Result";
import { RenderState, type RenderStateInitOption } from "../render_state/RenderState";
import type { RenderStateBufferDataType, RenderStateBuffer } from "../render_state/buffer/RenderStateBuffer";
import type { RenderStateFrameBuffer } from "../render_state/frame_buffer/RenderStateFrameBuffer";
import type { RenderStatePassCollection } from "../render_state/pass/RenderStatePassCollection";
import { RenderStateAttributeRowType, type RenderStateAttributeLayout } from "../render_state/pipeline/RenderStateAttributeLayout";
import type { RenderStateComputePipeline } from "../render_state/pipeline/RenderStateComputePipeline";
import { RenderStateCullMode, RenderStateDepthCompareFunc, RenderStateFacing, RenderStateProgramState } from "../render_state/pipeline/RenderStateProgramState";
import type { RenderStateRenderPipeline } from "../render_state/pipeline/RenderStateRenderPipeline";
import type { RenderStateShaderType, RenderStateShader } from "../render_state/pipeline/RenderStateShader";
import { RenderStateTextureUsage, RenderStateTextureFormat, type RenderStateTextureDimension, type RenderStateTexture } from "../render_state/texture/RenderStateTexture";
import { RenderStateTextureFilter, RenderStateTextureWrap, type RenderStateTextureSampler } from "../render_state/texture/RenderStateTextureSampler";
import type { RenderStateTextureView } from "../render_state/texture/RenderStateTextureView";
import type { RenderStateUniformGroup } from "../render_state/uniform/RenderStateUniformGroup";
import { RenderStateSamplerUniformType, RenderStateTextureUniformSampleType, RenderStateTextureUniformType, type RenderStateUniformLayout } from "../render_state/uniform/RenderStateUniformLayout";
import { RenderStatePrimitiveType, type RenderStateVertexArray } from "../render_state/vertex_array/RenderStateVertexArray";
import type { RenderDevice } from "../render_device/RenderDevice";
import { WebGPURenderStateMultiSampleTexture } from "./texture/WebGPURenderStateMultiSampleTexture";
import { WebGPURenderStateShader } from "./pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTexture } from "./texture/WebGPURenderStateTexture";
import { WebGPURenderStateProgram } from "./pipeline/WebGPURenderStateProgram";
import { WebGPURenderStateRenderPipeline } from "./pipeline/WebGPURenderStateRenderPipeline";
import { WebGPURenderStateUniformLayout } from "./uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateTextureSampler } from "./texture/WebGPURenderStateTextureSampler";
import { RenderStateBlendFactor, RenderStateBlendOperator, type RenderStateOutputState } from "../render_state/pipeline/RenderStateOutputState";

export class WebGPURenderState extends RenderState<WebGPURenderState> {

    protected _device!: GPUDevice;
    public get device() { return this._device; }

    constructor(render_device: RenderDevice<WebGPURenderState>, option: RenderStateInitOption) {
        super(render_device, option);
    }

    public async init(): Promise<boolean> {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        if (!device) {
            return false;
        }
        this._device = device;
        return true;
    }

    //#region enum map

    public static RenderStateTextureFormat(format: RenderStateTextureFormat): GPUTextureFormat {
        switch (format) {
            case RenderStateTextureFormat.RGBA32F: return 'rgba32float';
            case RenderStateTextureFormat.RGBA16F: return 'rgba16float';
            case RenderStateTextureFormat.R32U: return 'r32uint';
            case RenderStateTextureFormat.RGBA32U: return 'rgba32uint';
            case RenderStateTextureFormat.BGRA8: return 'bgra8unorm';
            case RenderStateTextureFormat.SBGRA8: return 'bgra8unorm-srgb';
            case RenderStateTextureFormat.RGBA8: return 'rgba8unorm';
            case RenderStateTextureFormat.SRGBA8: return 'rgba8unorm-srgb';
            case RenderStateTextureFormat.D24: return 'depth24plus';
            case RenderStateTextureFormat.D24S8: return 'depth24plus-stencil8';
            case RenderStateTextureFormat.D32F: return 'depth32float';
            case RenderStateTextureFormat.D32FS8: return 'depth32float-stencil8';
            default: {
                const n: never = format;
                throw new Error('<WebGPURenderState> RenderStateTextureFormat: unreachable');
            }
        }
    }

    public static RenderStateAttributeRowType(type: RenderStateAttributeRowType): GPUVertexFormat {
        switch (type) {
            case RenderStateAttributeRowType.Bool: return 'uint32';
            case RenderStateAttributeRowType.Int: return 'sint32';
            case RenderStateAttributeRowType.Uint: return 'uint32';
            case RenderStateAttributeRowType.Float: return 'float32';
            case RenderStateAttributeRowType.Vec2: return 'float32x2';
            case RenderStateAttributeRowType.Vec3: return 'float32x3';
            case RenderStateAttributeRowType.Vec4: return 'float32x4';
            case RenderStateAttributeRowType.Mat2Row: return 'float32x2';
            case RenderStateAttributeRowType.Mat3Row: return 'float32x3';
            case RenderStateAttributeRowType.Mat4Row: return 'float32x4';
            case RenderStateAttributeRowType.IVec2: return 'sint32x2';
            case RenderStateAttributeRowType.IVec3: return 'sint32x3';
            case RenderStateAttributeRowType.IVec4: return 'sint32x4';
            case RenderStateAttributeRowType.UVec2: return 'uint32x2';
            case RenderStateAttributeRowType.UVec3: return 'uint32x3';
            case RenderStateAttributeRowType.UVec4: return 'uint32x4';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateAttributeRowType: unreachable');
            }
        }
    }

    public static RenderStateBlendFactor(type: RenderStateBlendFactor): GPUBlendFactor {
        switch (type) {
            case RenderStateBlendFactor.Constant: return 'constant';
            case RenderStateBlendFactor.Zero: return 'zero';
            case RenderStateBlendFactor.Dst: return 'dst';
            case RenderStateBlendFactor.DstAlpha: return 'dst-alpha';
            case RenderStateBlendFactor.One: return 'one';
            case RenderStateBlendFactor.OneMinusDst: return 'one-minus-dst';
            case RenderStateBlendFactor.OneMinusSrc: return 'one-minus-src';
            case RenderStateBlendFactor.OneMinusSrcAlpha: return 'one-minus-src-alpha';
            case RenderStateBlendFactor.OneMinusDstAlpha: return 'one-minus-dst-alpha';
            case RenderStateBlendFactor.OneMinusConstant: return 'one-minus-constant';
            case RenderStateBlendFactor.Src: return 'src';
            case RenderStateBlendFactor.SrcAlpha: return 'src-alpha';
            case RenderStateBlendFactor.SrcAlphaSaturated: return 'src-alpha-saturated';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateBlendFactor: unreachable');
            }
        }
    }

    public static RenderStateBlendOperator(type: RenderStateBlendOperator): GPUBlendOperation {
        switch (type) {
            case RenderStateBlendOperator.Add: return 'add';
            case RenderStateBlendOperator.Subtract: return 'subtract';
            case RenderStateBlendOperator.ReverseSubtract: return 'reverse-subtract';
            case RenderStateBlendOperator.Max: return 'max';
            case RenderStateBlendOperator.Min: return 'min';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateBlendOperator: unreachable');
            }
        }
    }

    public static RenderStateDepthCompareFunc(type: RenderStateDepthCompareFunc): GPUCompareFunction {
        switch (type) {
            case RenderStateDepthCompareFunc.Never: return 'never';
            case RenderStateDepthCompareFunc.Always: return 'always';
            case RenderStateDepthCompareFunc.Less: return 'less';
            case RenderStateDepthCompareFunc.Equal: return 'equal';
            case RenderStateDepthCompareFunc.Greater: return 'greater';
            case RenderStateDepthCompareFunc.NotEqual: return 'not-equal';
            case RenderStateDepthCompareFunc.LessEqual: return 'less-equal';
            case RenderStateDepthCompareFunc.GreaterEqual: return 'greater-equal';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateDepthCompareFunc: unreachable');
            }
        }
    }

    public static RenderStatePrimitiveType(type: RenderStatePrimitiveType): GPUPrimitiveTopology {
        switch (type) {
            case RenderStatePrimitiveType.Triangles: return 'triangle-list';
            case RenderStatePrimitiveType.TriangleStrip: return 'triangle-strip';
            case RenderStatePrimitiveType.TriangleFan: throw new Error('<WebGPURenderState> RenderStatePrimitiveType: TriangleFan not allowed in WebGPU');
            case RenderStatePrimitiveType.LineStrip: return 'line-strip';
            case RenderStatePrimitiveType.Lines: return 'line-list';
            case RenderStatePrimitiveType.LineLoop: throw new Error('<WebGPURenderState> RenderStatePrimitiveType: LineLoop not allowed in WebGPU');
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStatePrimitiveType: unreachable');
            }
        }
    }

    public static RenderStateCullMode(type: RenderStateCullMode): GPUCullMode {
        switch (type) {
            case RenderStateCullMode.Front: return 'front';
            case RenderStateCullMode.Back: return 'back';
            case RenderStateCullMode.None: return 'none';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateCullMode: unreachable');
            }
        }
    }

    public static RenderStateFacing(type: RenderStateFacing): GPUFrontFace {
        switch (type) {
            case RenderStateFacing.Clockwise: return 'cw';
            case RenderStateFacing.CounterClockwise: return 'ccw';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateFacing: unreachable');
            }
        }
    }

    public static RenderStateTextureUniformType(type: RenderStateTextureUniformType): GPUTextureViewDimension {
        switch (type) {
            case RenderStateTextureUniformType.Tex1D: return '1d';
            case RenderStateTextureUniformType.Tex2D: return '2d';
            case RenderStateTextureUniformType.Tex2DArray: return '2d-array';
            case RenderStateTextureUniformType.Tex3D: return '3d';
            case RenderStateTextureUniformType.TexCubeMap: return 'cube';
            case RenderStateTextureUniformType.TexCubeMapArray: return 'cube-array';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureUniformType: unreachable');
            }
        }
    }

    public static RenderStateTextureUniformSampleType(type: RenderStateTextureUniformSampleType): GPUTextureSampleType {
        switch (type) {
            case RenderStateTextureUniformSampleType.Depth: return 'depth';
            case RenderStateTextureUniformSampleType.Float: return 'float';
            case RenderStateTextureUniformSampleType.Int: return 'sint';
            case RenderStateTextureUniformSampleType.Uint: return 'uint';
            case RenderStateTextureUniformSampleType.NonFilterFloat: return 'unfilterable-float';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureUniformSampleType: unreachable');
            }
        }
    }

    public static RenderStateSamplerUniformType(type: RenderStateSamplerUniformType): GPUSamplerBindingType {
        switch (type) {
            case RenderStateSamplerUniformType.Compare: return 'comparison';
            case RenderStateSamplerUniformType.Filter: return 'filtering';
            case RenderStateSamplerUniformType.NonFilter: return 'non-filtering';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateSamplerUniformType: unreachable');
            }
        }
    }

    public static RenderStateTextureWrap(type: RenderStateTextureWrap): GPUAddressMode {
        switch (type) {
            case RenderStateTextureWrap.Clamp: return 'clamp-to-edge';
            case RenderStateTextureWrap.Repeat: return 'repeat';
            case RenderStateTextureWrap.MirrorRepeat: return 'mirror-repeat';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureWrap: unreachable');
            }
        }
    }

    public static RenderStateTextureFilter(type: RenderStateTextureFilter): GPUFilterMode {
        switch (type) {
            case RenderStateTextureFilter.Nearest: return 'nearest';
            case RenderStateTextureFilter.Linear: return 'linear';
            default: {
                const n: never = type;
                throw new Error('<WebGPURenderState> RenderStateTextureFilter: unreachable');
            }
        }
    }

    //#endregion

    //#region pipeline

    public create_Shader(type: RenderStateShaderType, source: string, defines?: { [key: string]: string; } | undefined): Result<WebGPURenderStateShader, Error> {
        const shader = this.device.createShaderModule({ code: source });
        return Result.Ok(new WebGPURenderStateShader(this, type, shader));
    }

    public delete_Shader(shader: WebGPURenderStateShader): void {
        return;
    }

    public create_Program(vertex_or_compute_shader: WebGPURenderStateShader, frag_shader: WebGPURenderStateShader | undefined): Result<WebGPURenderStateProgram, Error> {
        if (
            !RenderState.is_VertexShader(vertex_or_compute_shader.type) &&
            !RenderState.is_ComputeShader(vertex_or_compute_shader.type)
        ) {
            return Result.Error(new Error('<WebGPURenderState> create_Program: vertex_or_compute_shader is not Vertex or Compute shader type'));
        }
        if (frag_shader !== undefined) {
            if (!RenderState.is_FragmentShader(frag_shader.type)) {
                return Result.Error(new Error('<WebGPURenderState> create_Program: frag_shader is not Fragment shader type'));
            }
            if (!RenderState.is_VertexShader(vertex_or_compute_shader.type)) {
                return Result.Error(new Error('<WebGPURenderState> create_Program: an render program can not have a compute only shader'));
            }
        }
        return Result.Ok(new WebGPURenderStateProgram(this, vertex_or_compute_shader, frag_shader));
    }

    public delete_Program(program: WebGPURenderStateProgram): void {
        return;
    }

    public create_ProgramState(): RenderStateProgramState<WebGPURenderState> {
        return new RenderStateProgramState<WebGPURenderState>(this);
    }

    public create_RenderPipeline(program: WebGPURenderStateProgram, program_state: RenderStateProgramState<WebGPURenderState>, output_state: RenderStateOutputState, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>, attribute_layouts: Iterable<RenderStateAttributeLayout>): Result<WebGPURenderStateRenderPipeline, Error> {
        if (!RenderState.is_VertexShader(program.vertex_or_compute_shader_ref.expect.type)) {
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
                    format: WebGPURenderState.RenderStateAttributeRowType(attribute.type),
                })
            }
            buffers.push({
                arrayStride: buffer.stride,
                stepMode: buffer.per_instance ? 'instance' : 'vertex',
                attributes: attributes,
            })
        }

        // binding group layouts
        const layouts: GPUBindGroupLayout[] = [];
        for (const layout of uniform_layouts) {
            const bind_group_layout = layout.layout;
            if (bind_group_layout === undefined) return Result.Error(new Error('<WebGPURenderState> create_RenderPipeline: WebGPURenderStateUniformLayout needs to be built before creating a pipeline'));
            layouts.push(bind_group_layout);
        }

        const desc: GPURenderPipelineDescriptor = {
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: layouts,
            }),
            vertex: {
                module: (program.vertex_or_compute_shader_ref.expect as WebGPURenderStateShader).shader,
                entryPoint: 'vs_main',
                buffers: buffers,
            },
            depthStencil: {
                format: WebGPURenderState.RenderStateTextureFormat(output_state.depth_stencil_format),
                depthWriteEnabled: program_state.depth_write,
                depthCompare: WebGPURenderState.RenderStateDepthCompareFunc(program_state.depth_compare_func),
                depthBias: program_state.depth_bias,
                depthBiasSlopeScale: program_state.depth_bias_slope_scale,
            },
            primitive: {
                topology: WebGPURenderState.RenderStatePrimitiveType(program_state.primitive),
                stripIndexFormat: RenderState.is_StripPrimitiveType(program_state.primitive) ? 'uint32' : undefined,
                cullMode: WebGPURenderState.RenderStateCullMode(program_state.cull_mode),
                frontFace: WebGPURenderState.RenderStateFacing(program_state.facing),
            }
        };

        // color targets
        const targets: GPUColorTargetState[] = [];
        for (const target of output_state.attachments) {
            targets.push({
                format: WebGPURenderState.RenderStateTextureFormat(target.format),
                blend: {
                    color: {
                        operation: WebGPURenderState.RenderStateBlendOperator(target.color_operator ?? RenderStateBlendOperator.Add),
                        srcFactor: WebGPURenderState.RenderStateBlendFactor(target.color_src_factor ?? RenderStateBlendFactor.One),
                        dstFactor: WebGPURenderState.RenderStateBlendFactor(target.color_dst_factor ?? RenderStateBlendFactor.Zero),
                    },
                    alpha: {
                        operation: WebGPURenderState.RenderStateBlendOperator(target.alpha_operator ?? RenderStateBlendOperator.Add),
                        srcFactor: WebGPURenderState.RenderStateBlendFactor(target.alpha_src_factor ?? RenderStateBlendFactor.One),
                        dstFactor: WebGPURenderState.RenderStateBlendFactor(target.alpha_dst_factor ?? RenderStateBlendFactor.Zero),
                    },
                }
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
        return Result.Ok(new WebGPURenderStateRenderPipeline(this, program, pipeline));
    }

    public delete_RenderPipeline(pipeline: WebGPURenderStateRenderPipeline): void {
        return;
    }






    public create_ComputePipeline(program: WebGPURenderStateProgram, uniform_layouts: Iterable<RenderStateUniformLayout<WebGPURenderState>>): Result<RenderStateRenderPipeline<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }

    public delete_ComputePipeline(pipeline: RenderStateComputePipeline<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }

    //#endregion

    //#region multi sample texture

    public create_MultiSampleTexture(usage: RenderStateTextureUsage, format: RenderStateTextureFormat, width: number, height: number, sample_count: number): Result<WebGPURenderStateMultiSampleTexture, Error> {
        const multi_sample_texture = this.device.createTexture({
            size: [width, height],
            format: WebGPURenderState.RenderStateTextureFormat(format),
            sampleCount: sample_count,
            usage: usage,
        });
        return Result.Ok(new WebGPURenderStateMultiSampleTexture(this, usage, format, width, height, sample_count, multi_sample_texture));
    }

    public delete_MultiSampleTexture(texture: WebGPURenderStateMultiSampleTexture): void {
        texture.multi_sample_texture.destroy();
    }

    //#endregion

    //#region texture

    public delete_Texture(texture: WebGPURenderStateTexture): void {
        texture.texture.destroy();
    }

    public create_TextureSampler(
        wrap_u: RenderStateTextureWrap = RenderStateTextureWrap.Clamp,
        wrap_v: RenderStateTextureWrap = RenderStateTextureWrap.Clamp,
        wrap_w: RenderStateTextureWrap = RenderStateTextureWrap.Clamp,
        min_filter: RenderStateTextureFilter = RenderStateTextureFilter.Nearest,
        mag_filter: RenderStateTextureFilter = RenderStateTextureFilter.Nearest,
        mipmap_filter: RenderStateTextureFilter = RenderStateTextureFilter.Nearest,
        compare: RenderStateDepthCompareFunc | undefined = undefined,
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

    public delete_TextureView(texture: RenderStateTextureView<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }

    //#endregion

    //#region uniform

    public create_UniformLayout(): WebGPURenderStateUniformLayout {
        return new WebGPURenderStateUniformLayout(this);
    }

    //#endregion


















    public create_Buffer(type: number, usage: number, data_type: RenderStateBufferDataType, element_size: number, size: number): Result<RenderStateBuffer<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public get_BufferDataTypeBytes(format: RenderStateBufferDataType): number {
        throw new Error("Method not implemented.");
    }
    public delete_Buffer(buffer: RenderStateBuffer<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_VertexArray(primitive_type: RenderStatePrimitiveType, offset: number, count: number): Result<RenderStateVertexArray<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_VertexArray(vertex_array: RenderStateVertexArray<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_PassCollection(): RenderStatePassCollection<WebGPURenderState> {
        throw new Error("Method not implemented.");
    }
    public submit_PassCollections(pass_collections: Iterable<RenderStatePassCollection<WebGPURenderState>>): void {
        throw new Error("Method not implemented.");
    }
    public create_FrameBuffer(): Result<RenderStateFrameBuffer<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public delete_FrameBuffer(frame_buffer: RenderStateFrameBuffer<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }
    public create_Texture(usage: RenderStateTextureUsage, format: RenderStateTextureFormat, dimension: RenderStateTextureDimension, width: number, height: number, depth: number, mipmap_level_count: number): Result<RenderStateTexture<WebGPURenderState>, Error> {
        throw new Error("Method not implemented.");
    }
    public get_TextureFormatTexelBytes(format: RenderStateTextureFormat): number {
        throw new Error("Method not implemented.");
    }
    public delete_UniformGroup(group: RenderStateUniformGroup<WebGPURenderState>): void {
        throw new Error("Method not implemented.");
    }

}