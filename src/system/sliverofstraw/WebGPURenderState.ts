import { Result } from "@/system/utils/Result";
import { WebGPURenderStateShader, WebGPURenderStateShaderType } from "./pipeline/WebGPURenderStateShader";
import { WebGPURenderStateTexture, WebGPURenderStateTextureDimension, WebGPURenderStateTextureFormat, WebGPURenderStateTextureUsage, WebGPURendetStateTextureDestination } from "./texture/WebGPURenderStateTexture";
import { WebGPURenderStateProgram } from "./pipeline/WebGPURenderStateProgram";
import { WebGPURenderStateRenderPipeline } from "./pipeline/WebGPURenderStateRenderPipeline";
import { WebGPURenderStateBufferUniformType, WebGPURenderStateUniformLayout, type WebGPURenderStateUniformType } from "./uniform/WebGPURenderStateUniformLayout";
import { WebGPURenderStateTextureFilter, WebGPURenderStateTextureSampler, WebGPURenderStateTextureWrap } from "./texture/WebGPURenderStateTextureSampler";
import { WebGPURenderStateUniformGroup, type WebGPURenderStateUniformGroupEntry } from "./uniform/WebGPURenderStateUniformGroup";
import { WebGPURenderStateBuffer, WebGPURenderStateBufferDataType, WebGPURenderStateBufferType, WebGPURenderStateBufferUsage } from "./buffer/WebGPURenderStateBuffer";
import { WebGPURenderStateTextureView } from "./texture/WebGPURenderStateTextureView";
import { WebGPURenderStateComputePipeline } from "./pipeline/WebGPURenderStateComputePipeline";
import { WebGPURenderStatePrimitiveType, WebGPURenderStateVertexArray } from "./vertex_array/WebGPURenderStateVertexArray";
import { WebGPURenderStateVertexArrayView } from "./vertex_array/WebGPURenderStateVertexArrayView";
import { WebGPURenderStateFrameBuffer } from "./frame_buffer/WebGPURenderStateFrameBuffer";
import { WebGPURenderStateCanvasTextureView } from "./texture/WebGPURenderStateCanvasTextureView";
import { type WebGPURenderStateAttributeLayout } from "./pipeline/WebGPURenderStateAttributeLayout";
import { WebGPURenderStateBlendFactor, WebGPURenderStateBlendOperator, type WebGPURenderStateOutputState } from "./pipeline/WebGPURenderStateOutputState";
import { WebGPURenderStateDepthCompareFunc, WebGPURenderStateProgramState } from "./pipeline/WebGPURenderStateProgramState";
import { WebGPURenderStateMultiSampleTexture } from "./texture/WebGPURenderStateMultiSampleTexture";

type WebGPURenderStateMemoryLayoutMemberType =
    WebGPURenderStateUniformType |
    { type: 'array', member: WebGPURenderStateMemoryLayoutMemberType, length: number } |
    { type: 'struct', members: WebGPURenderStateMemoryLayoutMemberType[] } |
    { type: 'layout', size: number, align: number };

type WebGPURenderStateMemoryLayoutType =
    { type: 'primitive', size: number, align: number, offset: number } |
    { type: 'array', size: number, align: number, offset: number, member: WebGPURenderStateMemoryLayoutType, length: number } |
    { type: 'struct', size: number, align: number, offset: number, members: WebGPURenderStateMemoryLayoutType[] };

export class WebGPURenderState {

    protected _device!: GPUDevice;
    public get device() { return this._device; }

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

    //#endregion

    //#region memory helper

    public static RenderStateMemoryLayout(type: WebGPURenderStateMemoryLayoutMemberType): WebGPURenderStateMemoryLayoutType {

        // WebGPU specs see https://www.w3.org/TR/WGSL/#alignment-and-size

        if (typeof type === 'object') {
            if (type.type === 'layout') {
                return { type: 'primitive', size: type.size, align: type.align, offset: 0 };
            }
            else if (type.type === 'array') {
                const size_align_offset = WebGPURenderState.RenderStateMemoryLayout(type.member);
                const { size, align } = size_align_offset;
                // N × roundUp(AlignOf(E), SizeOf(E))
                return { type: 'array', size: type.length * (Math.ceil(size / align) * align), align: align, offset: 0, member: size_align_offset, length: type.length };
            }
            else {
                // align = max(AlignOfMember(S,1), ... , AlignOfMember(S,N))
                let align_max: number = 0;
                const entries: WebGPURenderStateMemoryLayoutType[] = [];
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
                return { type: 'struct', size, align: align_max, offset: 0, members: entries };
            }
        }
        else {
            switch (type) {
                case WebGPURenderStateBufferUniformType.Bool: return { type: 'primitive', size: 4, align: 4, offset: 0 };
                case WebGPURenderStateBufferUniformType.Uint: return { type: 'primitive', size: 4, align: 4, offset: 0 };
                case WebGPURenderStateBufferUniformType.Int: return { type: 'primitive', size: 4, align: 4, offset: 0 };
                case WebGPURenderStateBufferUniformType.Float: return { type: 'primitive', size: 4, align: 4, offset: 0 };
                case WebGPURenderStateBufferUniformType.Vector2: return { type: 'primitive', size: 8, align: 8, offset: 0 };
                case WebGPURenderStateBufferUniformType.Vector3: return { type: 'primitive', size: 12, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.Vector4: return { type: 'primitive', size: 16, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.Matrix2: return { type: 'primitive', size: 16, align: 8, offset: 0 };
                case WebGPURenderStateBufferUniformType.Matrix3: return { type: 'primitive', size: 48, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.Matrix4: return { type: 'primitive', size: 64, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.IVector2: return { type: 'primitive', size: 8, align: 8, offset: 0 };
                case WebGPURenderStateBufferUniformType.IVector3: return { type: 'primitive', size: 12, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.IVector4: return { type: 'primitive', size: 16, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.UVector2: return { type: 'primitive', size: 8, align: 8, offset: 0 };
                case WebGPURenderStateBufferUniformType.UVector3: return { type: 'primitive', size: 12, align: 16, offset: 0 };
                case WebGPURenderStateBufferUniformType.UVector4: return { type: 'primitive', size: 16, align: 16, offset: 0 };
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

    public create_ProgramState(): WebGPURenderStateProgramState {
        return new WebGPURenderStateProgramState(this);
    }

    public create_RenderPipeline(program: WebGPURenderStateProgram, program_state: WebGPURenderStateProgramState, output_state: WebGPURenderStateOutputState, uniform_layouts: Iterable<WebGPURenderStateUniformLayout>, attribute_layouts: Iterable<WebGPURenderStateAttributeLayout>): Result<WebGPURenderStateRenderPipeline, Error> {
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
                format: output_state.depth_stencil_format,
                depthWriteEnabled: program_state.depth_write,
                depthCompare: program_state.depth_compare_func,
                depthBias: program_state.depth_bias,
                depthBiasSlopeScale: program_state.depth_bias_slope_scale,
            },
            primitive: {
                topology: program_state.primitive,
                stripIndexFormat: WebGPURenderState.is_StripPrimitiveType(program_state.primitive) ? 'uint32' : undefined,
                cullMode: program_state.cull_mode,
                frontFace: program_state.facing,
            }
        };

        // color targets
        const targets: GPUColorTargetState[] = [];
        for (const target of output_state.attachments) {
            targets.push({
                format: target.format,
                blend: {
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

    public create_MultiSampleTexture(usage: WebGPURenderStateTextureUsage, format: WebGPURenderStateTextureFormat, width: number, height: number, sample_count: number): Result<WebGPURenderStateMultiSampleTexture, Error> {
        const multi_sample_texture = this.device.createTexture({
            size: [width, height],
            format: format,
            sampleCount: sample_count,
            usage: usage,
        });
        return Result.Ok(new WebGPURenderStateMultiSampleTexture(this, usage, format, width, height, sample_count, multi_sample_texture));
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
        const texture = this.device.createTexture({
            dimension: WebGPURenderState.RenderStateTextureDimension(dimension),
            size: [width, height, depth],
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
            addressModeU: wrap_u,
            addressModeV: wrap_v,
            addressModeW: wrap_w,
            minFilter: min_filter,
            magFilter: mag_filter,
            mipmapFilter: mipmap_filter,
            lodMinClamp: min_lod,
            lodMaxClamp: max_lod,
            compare: compare === undefined ? undefined : compare,
            maxAnisotropy: anisotropy,
        });
        return Result.Ok(new WebGPURenderStateTextureSampler(this, wrap_u, wrap_v, wrap_w, min_filter, mag_filter, mipmap_filter, compare, min_lod, max_lod, anisotropy, sampler));
    }

    public delete_TextureSampler(sampler: WebGPURenderStateTextureSampler): void {
        return;
    }

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
        return Result.Ok(new WebGPURenderStateTextureView(this, texture, dimension, texture_view));
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

    public create_Buffer(type: WebGPURenderStateBufferType, usage: WebGPURenderStateBufferUsage, data_type: WebGPURenderStateBufferDataType, element_size: number, size: number): Result<WebGPURenderStateBuffer, Error> {
        const buffer = this.device.createBuffer({
            size: size,
            usage: type | usage,
        });
        return Result.Ok(new WebGPURenderStateBuffer(this, type, usage, data_type, element_size, size, buffer));
    }

    public delete_Buffer(buffer: WebGPURenderStateBuffer): void {
        buffer.buffer.destroy();
    }

    //#endregion

    //#region vertex array

    public create_VertexArray(primitive_type: WebGPURenderStatePrimitiveType, offset: number, count: number): Result<WebGPURenderStateVertexArray, Error> {
        return Result.Ok(new WebGPURenderStateVertexArray(this, primitive_type, offset, count));
    }

    public create_VertexArrayView(vertex_array: WebGPURenderStateVertexArray, offset: number, count: number): Result<WebGPURenderStateVertexArrayView, Error> {
        return Result.Ok(new WebGPURenderStateVertexArrayView(this, vertex_array, offset, count));
    }

    public delete_VertexArray(vertex_array: WebGPURenderStateVertexArray): void {
        return;
    }

    //#endregion

    //#region frame buffer

    public create_FrameBuffer(): Result<WebGPURenderStateFrameBuffer, Error> {
        return Result.Ok(new WebGPURenderStateFrameBuffer(this));
    }

    public delete_FrameBuffer(frame_buffer: WebGPURenderStateFrameBuffer): void {
        return;
    }

    //#endregion

}